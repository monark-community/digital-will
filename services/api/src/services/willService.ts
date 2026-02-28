import { PrismaClient } from "@prisma/client";
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

/* export const createWill = async (input: CreateWillInput) => {
    const { userWalletAddress, contractAddressInBlockchain, chainId, secondaryMembers } = input;

    // Verify wallet exists
    const wallet = await prisma.wallet.findUnique({
        where: { address: userWalletAddress },
    });

    if (!wallet) {
        throw new NotFoundError('Wallet not found');
    }


    // Validate each secondary member's fields before creating anything
    for (const member of secondaryMembers) {
        if (!REGEX.EMAIL.test(member.email)) {
            throw new BadRequestError(`Invalid email format for member: ${member.email}`);
        }

        if (member.phoneNumber && !REGEX.PHONE.test(member.phoneNumber)) {
            throw new BadRequestError(`Invalid phone number format for member: ${member.phoneNumber}`);
        }

        validateWalletAddress(member.walletAddress);
    }

    // Create the will first to get the willId
    const will = await prisma.will.create({
        data: {
            walletAddress: userWalletAddress,
            contractAddressInBlockchain,
            chainId,
            
        },
    });

    // Create secondary members with the willId now available
    await prisma.secondaryMember.createMany({
        data: secondaryMembers.map((member) => ({
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            phoneNumber: member.phoneNumber,
            walletAddress: member.walletAddress,
            willId: will.willId,
        })),
    });

    // Return the will with its secondary members
    return await prisma.will.findUnique({
        where: { willId: will.willId },
        include: { secondaryMembers: true },
    });
}; */

export const createDraftWill = async (input: {
    walletAddress: string;
    secondaryMembers?: Array<{
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber?: string;
        tempWalletAddress?: string;  // Optionnel
        votingPower?: number;         // Optionnel en draft
    }>;
    minSecurityPeriod?: number;      // Optionnel en draft
    maxSecurityPeriod?: number;      // Optionnel en draft
}) => {
    const { 
        walletAddress, 
        secondaryMembers = [],
        minSecurityPeriod = 0,        // Valeur par défaut
        maxSecurityPeriod = 0         // Valeur par défaut
    } = input;

    // Vérifier que le wallet existe
    const wallet = await prisma.wallet.findUnique({
        where: { address: walletAddress },
    });

    if (!wallet) {
        throw new NotFoundError('Wallet not found');
    }

    // Créer le will en mode DRAFT
    const will = await prisma.will.create({
        data: {
            walletAddress,
            state: 'DRAFT'
            // contractAddressInBlockchain et chainId sont null en draft
        },
    });

    // S'il y a des secondary members, on les crée
    if (secondaryMembers.length > 0) {
        await prisma.secondaryMember.createMany({
            data: secondaryMembers.map((member) => ({
                walletAddress: member.tempWalletAddress || '', // Utiliser tempWalletAddress ou une chaîne vide
                firstName: member.firstName,
                lastName: member.lastName,
                email: member.email,
                phoneNumber: member.phoneNumber,
                votingPower: member.votingPower || 1,        // Valeur par défaut
                state: 'PENDING',                             // Par défaut PENDING
                willId: will.willId,
            })),
        });
    }

    // Retourner le will avec ses membres
    return await prisma.will.findUnique({
        where: { willId: will.willId },
        include: { secondaryMembers: true },
    });
};

// 2. Mettre à jour un brouillon existant
export const updateDraftWill = async (
    willId: string,
    input: {
        secondaryMembers?: Array<{
            firstName?: string;
            lastName?: string;
            email?: string;
            phoneNumber?: string;
            tempWalletAddress?: string;
            votingPower?: number;
        }>;
        minSecurityPeriod?: number;
        maxSecurityPeriod?: number;
    }
) => {

    //const { secondaryMembers } = input;

    // Vérifier que le will existe et est DRAFT
    const existingWill = await prisma.will.findUnique({
        where: { willId },
    });

    if (!existingWill) {
        throw new NotFoundError('Will not found');
    }

    if (existingWill.willStatus !== 'DRAFT') {
        throw new BadRequestError('Cannot update a will that is already deployed');
    }

    // Mise à jour avec transaction
    return await prisma.$transaction(async (tx) => {
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
                await tx.secondaryMember.createMany({
                    data: input.secondaryMembers.map((member) => ({
                        firstName: member.firstName!,
                        lastName: member.lastName!,
                        email: member.email!,
                        phoneNumber: member.phoneNumber,
                        walletAddress: member.tempWalletAddress || '',
                        votingPower: member.votingPower || 1,
                        state: 'PENDING',
                        willId,
                    })),
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
        if (!member.walletAddress) {
            throw new BadRequestError(`Member ${member.email} has no wallet address`);
        }
    }

    // Mettre à jour avec les infos blockchain
    return await prisma.will.update({
        where: { willId },
        data: {
            contractAddressInBlockchain,
            chainId,
            willStatus: 'DEPLOYED',
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

    if (will.willStatus !== 'DRAFT') {
        throw new BadRequestError('Cannot delete a deployed will');
    }

    // Les secondaryMembers seront supprimés automatiquement (Cascade dans Prisma)
    return await prisma.will.delete({
        where: { willId },
    });
};