import { PrismaClient, Prisma, SMState, WillState } from "@prisma/client";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { REGEX } from "../utils/constants";
import { validateWalletAddress } from "../utils/crypto";

const prisma = new PrismaClient();

interface SecondaryMemberInput {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    walletAddress: string;
    votingPower: number;
    state: SMState;
    relationship?: string;
}

interface CreateWillInput {
    userWalletAddress: string;
    contractAddressInBlockchain: string;
    chainId: number;
    secondaryMembers: SecondaryMemberInput[];
}

export const getWillsByWalletAddress = async (walletAddress: string) => {
    const wallet = await prisma.wallet.findUnique({
        where: { address: walletAddress },
    });

    if (!wallet) {
        throw new NotFoundError('Wallet not found');
    }

    return await prisma.will.findMany({
        where: { walletAddress },
        include: { secondaryMembers: true },
    });
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
    console.log(willName);

    // Vérifier que le wallet existe
    const wallet = await prisma.wallet.findUnique({
        where: { address: walletAddress },
    });

    if (!wallet) {
        throw new NotFoundError('Wallet not found');
    }

    return await prisma.$transaction(async (tx) => {
    // Créer le will en mode DRAFT
    const will = await tx.will.create({
        data: {
            walletAddress,
            willName,
            state: 'DRAFT',
            minSecurityPeriod,
            maxSecurityPeriod
        },
    });

    // S'il y a des secondary members, on les crée
    if (secondaryMembers.length > 0) {
        const membersData = await Promise.all(secondaryMembers.map(async (member) => {
            // Vérifier si l'adresse wallet existe dans la table Wallet
            let walletAddressToUse = null;
            let tempWalletAddressToUse = member.tempWalletAddress;

            if (member.tempWalletAddress) {
                const existingWallet = await tx.wallet.findUnique({
                    where: { address: member.tempWalletAddress }
                });

                if (existingWallet) {
                    walletAddressToUse = member.tempWalletAddress;
                    tempWalletAddressToUse = undefined; // Pas besoin de temp
                } else {
                    walletAddressToUse = null;
                    tempWalletAddressToUse = member.tempWalletAddress;
                }
            }

            return {
                firstName: member.firstName,
                lastName: member.lastName,
                email: member.email,
                phoneNumber: member.phoneNumber,
                tempWalletAddress: tempWalletAddressToUse,
                walletAddress: walletAddressToUse,
                votingPower: member.votingPower || 1,
                state: SMState.PENDING,
                relationship: member.relationship,
                willId: will.willId,
            };
        }));

        await tx.secondaryMember.createMany({
            data: membersData,
        });
    }

    // Retourner le will avec ses membres
    return await tx.will.findUnique({
        where: { willId: will.willId },
        include: { secondaryMembers: true },
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
    const existingWill = await prisma.will.findUnique({
        where: { willId },
        include: { 
            wallet: {  // ← Inclure le wallet pour avoir accès à l'utilisateur
                include: { user: true }
            }
        },
    });

    if (!existingWill) {
        throw new NotFoundError('Will not found');
    }

    if (existingWill.state !== WillState.DRAFT) {
        throw new BadRequestError('Cannot update a will that is already deployed');
    }

    // Récupérer l'utilisateur propriétaire du wallet
    const userId = existingWill.wallet.userId;

    // Mise à jour avec transaction
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Mettre à jour le nom si fourni
        if (input.willName !== undefined) {
            await tx.will.update({
                where: { willId },
                data: { willName: input.willName },
            });
        }
        // Mettre à jour les périodes si fournies
        if (input.minSecurityPeriod !== undefined || input.maxSecurityPeriod !== undefined) {
            await tx.will.update({
                where: { willId },
                data: {
                    minSecurityPeriod: input.minSecurityPeriod || 1,
                    maxSecurityPeriod: input.maxSecurityPeriod,
                },
            });
        }

        // Mettre à jour les members si fournis
        if (input.secondaryMembers) {
            await tx.secondaryMember.deleteMany({
                where: { willId },
            });

            if (input.secondaryMembers.length > 0) {
                const membersData = await Promise.all(input.secondaryMembers.map(async (member) => {
                    let walletAddressToUse = null;
                    let tempWalletAddressToUse = member.tempWalletAddress;

                    if (member.tempWalletAddress) {
                        // Vérifier si le wallet existe DANS LA TRANSACTION
                        const existingWallet = await tx.wallet.findUnique({
                            where: { address: member.tempWalletAddress }
                        });

                        if (existingWallet) {
                            walletAddressToUse = member.tempWalletAddress;
                            tempWalletAddressToUse = undefined;
                        } else {
                            walletAddressToUse = null;
                            tempWalletAddressToUse = member.tempWalletAddress;
                        }
                    }

                    return {
                        firstName: member.firstName!,
                        lastName: member.lastName!,
                        email: member.email!,
                        phoneNumber: member.phoneNumber,
                        tempWalletAddress: tempWalletAddressToUse,
                        walletAddress: walletAddressToUse,  // ← Sera null si wallet n'existe pas
                        votingPower: member.votingPower || 1,
                        state: SMState.PENDING,
                        relationship: member.relationship,
                        willId,
                    };
                }));

                await tx.secondaryMember.createMany({
                    data: membersData,
                });
            }
        }

        return await tx.will.findUnique({
            where: { willId },
            include: { secondaryMembers: true },
        });
    });
};

// 3. Marquer un will comme déployé (après transaction blockchain)
export const deployWill = async (
    willId: string,
    input: {
        contractAddressInBlockchain: string;
        chainId: number;
    }
) => {
    const { contractAddressInBlockchain, chainId } = input;

    // Vérifier que le will existe
    const will = await prisma.will.findUnique({
        where: { willId },
        include: { secondaryMembers: true },
    });

    if (!will) {
        throw new NotFoundError('Will not found');
    }
    if (will.state !== 'DRAFT') {
        throw new BadRequestError('Can only deploy DRAFT wills');
    }

    // Au déploiement, on peut valider que les membres ont les infos nécessaires
    for (const member of will.secondaryMembers) {
        const hasAddress = member.walletAddress || member.tempWalletAddress;
        if (!hasAddress) {
            throw new BadRequestError(`Member ${member.email} has no wallet address`);
        }
    }

    // Mettre à jour avec les infos blockchain
    return await prisma.will.update({
        where: { willId },
        data: {
            contractAddressInBlockchain,
            chainId,
            state: WillState.INACTIVE,
        },
        include: { secondaryMembers: true },
    });
};

export const cancelWillOnChain = async (willId: string) => {
    const will = await prisma.will.findUnique({ where: { willId } });

    if (!will) throw new NotFoundError('Will not found');
    if (will.state === WillState.DRAFT) throw new BadRequestError('Will is already a draft');
    if (will.state === WillState.EXECUTED) throw new BadRequestError('Cannot revert an executed will');

    return await prisma.will.update({
        where: { willId },
        data: {
            state: WillState.DRAFT,
            contractAddressInBlockchain: null,
            chainId: null,
        },
        include: { secondaryMembers: true },
    });
};

// 4. Supprimer un brouillon (optionnel, pour plus tard)
export const deleteDraftWill = async (willId: string) => {
    const will = await prisma.will.findUnique({
        where: { willId },
    });

    if (!will) {
        throw new NotFoundError('Will not found');
    }

    if (will.state !== WillState.DRAFT) {
        throw new BadRequestError('Cannot delete a deployed will');
    }

    // Les secondaryMembers seront supprimés automatiquement (Cascade dans Prisma)
    return await prisma.will.delete({
        where: { willId },
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
            votingPower?: number;
        }>;
        addedMembers?: Array<{
            walletAddress: string;
            votingPower: number;
            firstName?: string;
            lastName?: string;
            email?: string;
            relationship?: string;
        }>;
        deletedMemberIds?: string[];
        minSecurityPeriod?: number;
        maxSecurityPeriod?: number;
    }
) => {
    const existingWill = await prisma.will.findUnique({ where: { willId } });
    if (!existingWill) throw new NotFoundError('Will not found');
    if (existingWill.state === WillState.DRAFT) throw new BadRequestError('Use the draft update endpoint for draft wills');
    if (existingWill.state === WillState.CANCELED || existingWill.state === WillState.EXECUTED)
        throw new BadRequestError('Cannot update a canceled or executed will');

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        if (input.minSecurityPeriod !== undefined || input.maxSecurityPeriod !== undefined) {
            await tx.will.update({
                where: { willId },
                data: {
                    ...(input.minSecurityPeriod !== undefined && { minSecurityPeriod: input.minSecurityPeriod }),
                    ...(input.maxSecurityPeriod !== undefined && { maxSecurityPeriod: input.maxSecurityPeriod }),
                },
            });
        }

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
                        ...(m.votingPower !== undefined && { votingPower: m.votingPower }),
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
                        votingPower: m.votingPower,
                        state: 'PENDING',
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
