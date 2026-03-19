import { PrismaClient, Prisma } from "@prisma/client";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { WillFromDB } from "./chainStateService";

const prisma = new PrismaClient();

/*
Get all wills (drafts and deployed) by wallet address
*/
export const getWillsByWalletAddress = async (walletAddress: string): Promise<WillFromDB[]> => {
    const wallet = await prisma.wallet.findUnique({
        where: { address: walletAddress },
    });

    if (!wallet) {
        throw new NotFoundError('Wallet not found');
    }

    // Get both draft and deployed wills in parallel
    const [draftWills, deployedWills] = await Promise.all([
        getDraftWillsByWalletAddress(walletAddress),
        getDeployedWillsByWalletAddress(walletAddress),
    ]);

    // Combine and return
    return [...draftWills, ...deployedWills];
};

/*
Get all deployed wills by wallet address
*/
export const getDeployedWillsByWalletAddress = async (walletAddress: string): Promise<WillFromDB[]> => {
    const wallet = await prisma.wallet.findUnique({
        where: { address: walletAddress },
    });

    if (!wallet) {
        throw new NotFoundError('Wallet not found');
    }

    // Get only deployed wills
    const deployedWills = await prisma.will.findMany({
        where: { walletAddress },
        include: { secondaryMembers: true },
    });

    return deployedWills as WillFromDB[];
};

/*
Get all draft wills by wallet address
*/
export const getDraftWillsByWalletAddress = async (walletAddress: string): Promise<WillFromDB[]> => {
    const wallet = await prisma.wallet.findUnique({
        where: { address: walletAddress },
    });

    if (!wallet) {
        throw new NotFoundError('Wallet not found');
    }

    // Get only draft wills
    const draftWills = await prisma.draftWill.findMany({
        where: { walletAddress },
        include: { draftsecondarymembers: true },
    });

    const mappedDraftWills: WillFromDB[] = draftWills.map(({ draftsecondarymembers, draftWillId, ...dw }) => ({
        ...dw,
        state: 'DRAFT' as const,   // as expected by frontend
        willId: draftWillId,
        secondaryMembers: draftsecondarymembers,
    }));

    return mappedDraftWills;
};

/**
 * Get a single will by ID
 */
export const getWillById = async (willId: string) => {
    return await prisma.will.findUnique({
        where: { willId },
        include: { secondaryMembers: true },
    });
};

/**
 * Get a single draft will by ID
 */
export const getDraftWillById = async (draftWillId: string) => {
    return await prisma.draftWill.findUnique({
        where: { draftWillId },
        include: { draftsecondarymembers: true },
    });
};

/**
 * Get all wills where the given user is listed as a secondary member.
 * Matches via walletAddress, tempWalletAddress, or email on SecondaryMember.
 */
export const getAssociatedWills = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { userId },
        include: { wallets: { select: { address: true } } },
    });

    if (!user) {
        return [];
    }

    const walletAddresses = user.wallets.map((w) => w.address);

    const orConditions: any[] = [
        { email: user.email },
    ];

    if (walletAddresses.length > 0) {
        orConditions.push({ walletAddress: { in: walletAddresses } });
        orConditions.push({ tempWalletAddress: { in: walletAddresses } });
    }

    const secondaryMemberRecords = await prisma.secondaryMember.findMany({
        where: {
            OR: orConditions,
        },
        include: {
            will: {
                include: {
                    secondaryMembers: true,
                    wallet: {
                        include: {
                            user: {
                                select: { firstName: true, lastName: true, email: true },
                            },
                        },
                    },
                },
            },
        },
    });

    type WillWithOwner = Omit<typeof secondaryMemberRecords[0]['will'], 'wallet'> & {
        owner: { firstName: string; lastName: string; email: string };
        myMembership: typeof secondaryMemberRecords[0];
    };
    const willsMap = new Map<string, WillWithOwner>();
    for (const sm of secondaryMemberRecords) {
        if (!willsMap.has(sm.willId)) {
            const { wallet, ...willData } = sm.will;
            willsMap.set(sm.willId, {
                ...willData,
                owner: wallet?.user ?? { firstName: 'Unknown', lastName: '', email: '' },
                myMembership: sm,
            });
        }
    }

    return Array.from(willsMap.values());
};

export const createDraftWill = async (input: {
    walletAddress: string;
    willName: string;
    secondaryMembers?: Array<{
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber?: string;
        tempWalletAddress?: string;  // Optionnel
        votingPower: number;
        relationship?: string;       // Optionnel
    }>;
    minSecurityPeriod: number;
    maxSecurityPeriod: number;
}) => {
    const {
        walletAddress,
        willName,
        secondaryMembers = [],
        minSecurityPeriod = 28,        // Valeur par défaut
        maxSecurityPeriod = 154         // Valeur par défaut
    } = input;

    // Vérifier que le wallet existe
    const wallet = await prisma.wallet.findUnique({
        where: { address: walletAddress },
    });

    if (!wallet) {
        throw new NotFoundError('Wallet not found');
    }

    return await prisma.$transaction(async (tx) => {
        // Créer le will en mode DRAFT
        const draftWill = await tx.draftWill.create({
            data: {
                walletAddress,
                willName,
                minSecurityPeriod,
                maxSecurityPeriod
            },
        });

        // S'il y a des secondary members, on les crée
        if (secondaryMembers.length > 0) {
            const membersData = await Promise.all(secondaryMembers.map(async (member) => {
                return {
                    firstName: member.firstName,
                    lastName: member.lastName,
                    email: member.email,
                    phoneNumber: member.phoneNumber ?? null,
                    walletAddress: member.tempWalletAddress ?? null,
                    votingPower: member.votingPower || 1,
                    relationship: member.relationship ?? null,
                    draftWillId: draftWill.draftWillId,
                };
            }));

            await tx.draftSecondaryMember.createMany({
                data: membersData,
            });
        }

        // Retourner le will avec ses membres
        return await tx.draftWill.findUnique({
            where: { draftWillId: draftWill.draftWillId },
            include: { draftsecondarymembers: true },
        });
    });
};

// 2. Mettre à jour un brouillon existant
export const updateDraftWill = async (
    willId: string,
    input: {
        willName?: string;
        secondaryMembers?: Array<{
            firstName?: string;
            lastName?: string;
            email?: string;
            phoneNumber?: string;
            tempWalletAddress?: string;
            votingPower?: number;
            relationship?: string;
        }>;
        minSecurityPeriod?: number;
        maxSecurityPeriod?: number;
    }
) => {


    // Vérifier que le will existe et est DRAFT
    const existingDraftWill = await prisma.draftWill.findUnique({
        where: { draftWillId : willId },
        include: {
            wallet: {  // ← Inclure le wallet pour avoir accès à l'utilisateur
                include: { user: true }
            }
        },
    });

    if (!existingDraftWill) {
        throw new NotFoundError('Draft will not found');
    }

    // Mise à jour avec transaction
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Mettre à jour le nom si fourni
        if (input.willName !== undefined) {
            await tx.draftWill.update({
                where: { draftWillId: willId },
                data: { willName: input.willName },
            });
        }
        // Mettre à jour les périodes si fournies
        if (input.minSecurityPeriod !== undefined || input.maxSecurityPeriod !== undefined) {
            await tx.draftWill.update({
                where: { draftWillId: willId },
                data: {
                    minSecurityPeriod: input.minSecurityPeriod || 1,
                    maxSecurityPeriod: input.maxSecurityPeriod,
                },
            });
        }

        // Mettre à jour les members si fournis
        if (input.secondaryMembers) {
            await tx.draftSecondaryMember.deleteMany({
                where: { draftWillId: willId },
            });

            if (input.secondaryMembers.length > 0) {
                const membersData = await Promise.all(input.secondaryMembers.map(async (member) => {
                    return {
                        firstName: member.firstName!,
                        lastName: member.lastName!,
                        email: member.email!,
                        phoneNumber: member.phoneNumber,
                        walletAddress: member.tempWalletAddress ?? null,
                        votingPower: member.votingPower || 1,
                        relationship: member.relationship,
                        draftWillId: willId,
                    };
                }));

                await tx.draftSecondaryMember.createMany({
                    data: membersData,
                });
            }
        }

        return await tx.draftWill.findUnique({
            where: { draftWillId: willId },
            include: { draftsecondarymembers: true },
        });
    });
};

// 3. Déployer un draft will : copier les données du draftWill vers la table Will
// apres transaction blockchain
export const deployWill = async (
    draftWillId: string,
    input: {
        contractAddressInBlockchain: string;
        chainId: number;
    }
) => {
    const { contractAddressInBlockchain, chainId } = input;

    // Vérifier que le draft will existe
    const draftWill = await prisma.draftWill.findUnique({
        where: { draftWillId },
        include: { draftsecondarymembers: true },
    });

    if (!draftWill) {
        throw new NotFoundError('Draft will not found');
    }

    // Vérifier que les membres ont les infos nécessaires
    for (const member of draftWill.draftsecondarymembers) {
        if (!member.walletAddress) {
            throw new BadRequestError(`Member ${member.email} has no wallet address`);
        }
    }

    // Créer le will en copiant les données du draftWill dans une transaction
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Créer le will principal
        const will = await tx.will.create({
            data: {
                walletAddress: draftWill.walletAddress,
                willName: draftWill.willName,
                contractAddressInBlockchain,
                chainId,
            },
        });

        // Copier les membres secondaires
        if (draftWill.draftsecondarymembers.length > 0) {
            const membersData = await Promise.all(
                draftWill.draftsecondarymembers.map(async (member) => {
                    // Vérifier si le wallet existe dans le système
                    const existingWallet = await tx.wallet.findUnique({
                        where: { address: member.walletAddress! },
                    });

                    return {
                        firstName: member.firstName,
                        lastName: member.lastName,
                        email: member.email,
                        phoneNumber: member.phoneNumber ?? null,
                        walletAddress: existingWallet ? member.walletAddress : null,
                        tempWalletAddress: existingWallet ? null : member.walletAddress,
                        willId: will.willId,
                        relationship: member.relationship ?? null,
                    };
                })
            );

            await tx.secondaryMember.createMany({
                data: membersData,
            });
        }

        // Supprimer le draftWill après déploiement réussi
        // les draftSecondaryMembers seront supprimés automatiquement (cascade)
        await tx.draftWill.delete({
            where: { draftWillId },
        });

        return await tx.will.findUnique({
            where: { willId: will.willId },
            include: { secondaryMembers: true },
        });
    });
};

export const cancelWillOnChain = async (
    willId: string,
    input: {
        minSecurityPeriod: number;
        maxSecurityPeriod: number;
        secondaryMembersVotingPowers: Record<string, number>; // { secondaryMemberId: votingPower }
    }
) => {
    // Vérifier que le will existe
    const will = await prisma.will.findUnique({
        where: { willId },
        include: { secondaryMembers: true },
    });

    if (!will) {
        throw new NotFoundError('Will not found');
    }

    const { minSecurityPeriod, maxSecurityPeriod, secondaryMembersVotingPowers } = input;

    // Vérifier que tous les secondaryMembers ont une votingPower fournie
    for (const member of will.secondaryMembers) {
        if (!(member.secondaryMemberId in secondaryMembersVotingPowers)) {
            throw new BadRequestError(
                `Missing votingPower for secondary member ${member.email}`
            );
        }
    }

    // Supprimer le will et créer un draftWill dans une transaction
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Créer le draftWill avec les mêmes informations
        const draftWill = await tx.draftWill.create({
            data: {
                walletAddress: will.walletAddress,
                willName: will.willName,
                minSecurityPeriod,
                maxSecurityPeriod,
            },
        });

        // Créer les draftSecondaryMembers à partir des secondaryMembers supprimés
        if (will.secondaryMembers.length > 0) {
            const membersData = will.secondaryMembers.map((member) => ({
                firstName: member.firstName,
                lastName: member.lastName,
                email: member.email,
                phoneNumber: member.phoneNumber ?? null,
                walletAddress: member.walletAddress ?? member.tempWalletAddress ?? null,
                votingPower: secondaryMembersVotingPowers[member.secondaryMemberId],
                draftWillId: draftWill.draftWillId,
                relationship: member.relationship ?? null,
            }));

            await tx.draftSecondaryMember.createMany({
                data: membersData,
            });
        }

        // Supprimer le will (les secondaryMembers seront supprimés en cascade)
        await tx.will.delete({
            where: { willId },
        });

        return await tx.draftWill.findUnique({
            where: { draftWillId: draftWill.draftWillId },
            include: { draftsecondarymembers: true },
        });
    });
};

// 4. Supprimer un brouillon (optionnel, pour plus tard)
export const deleteDraftWill = async (draftWillId: string) => {
    const draftWill = await prisma.draftWill.findUnique({
        where: { draftWillId },
    });

    if (!draftWill) {
        throw new NotFoundError('Draft will not found');
    }

    // Les secondaryMembers seront supprimés automatiquement (Cascade dans Prisma)
    return await prisma.draftWill.delete({
        where: { draftWillId },
    });
};

export const updateDeployedWillInDB = async (
    willId: string,
    input: {
        updatedMembers?: Array<{
            secondaryMemberId: string;
            firstName?: string;
            lastName?: string;
            email?: string;
            relationship?: string;
            walletAddress?: string;
        }>;
        addedMembers?: Array<{
            walletAddress: string;
            firstName?: string;
            lastName?: string;
            email?: string;
            relationship?: string;
        }>;
        deletedMemberIds?: string[];
    }
) => {
    const existingWill = await prisma.will.findUnique({ where: { willId } });
    if (!existingWill) throw new NotFoundError('Will not found');

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        if (input.updatedMembers?.length) {
            for (const m of input.updatedMembers) {
                let walletAddress: string | null = null;
                let tempWalletAddress: string | null | undefined = undefined;
                if (m.walletAddress) {
                    const existing = await tx.wallet.findUnique({ where: { address: m.walletAddress } });
                    if (existing) {
                        walletAddress = m.walletAddress;
                        tempWalletAddress = null;
                    } else {
                        walletAddress = null;
                        tempWalletAddress = m.walletAddress;
                    }
                }
                await tx.secondaryMember.update({
                    where: { secondaryMemberId: m.secondaryMemberId },
                    data: {
                        ...(m.firstName !== undefined && { firstName: m.firstName }),
                        ...(m.lastName !== undefined && { lastName: m.lastName }),
                        ...(m.email !== undefined && { email: m.email }),
                        ...(m.relationship !== undefined && { relationship: m.relationship }),
                        ...(m.walletAddress !== undefined && { walletAddress, tempWalletAddress }),
                    },
                });
            }
        }

        if (input.deletedMemberIds?.length) {
            await tx.secondaryMember.deleteMany({
                where: { secondaryMemberId: { in: input.deletedMemberIds } },
            });
        }

        if (input.addedMembers?.length) {
            for (const m of input.addedMembers) {
                const existing = await tx.wallet.findUnique({ where: { address: m.walletAddress } });
                await tx.secondaryMember.create({
                    data: {
                        firstName: m.firstName ?? '',
                        lastName: m.lastName ?? '',
                        email: m.email ?? '',
                        relationship: m.relationship ?? null,
                        walletAddress: existing ? m.walletAddress : null,
                        tempWalletAddress: existing ? null : m.walletAddress,
                        willId,
                    },
                });
            }
        }

        return await tx.will.findUnique({
            where: { willId },
            include: { secondaryMembers: true },
        });
    });
};
