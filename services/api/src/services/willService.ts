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

export const createWill = async (input: CreateWillInput) => {
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
};