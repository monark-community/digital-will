import { PrismaClient } from '@prisma/client';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { REGEX } from '../utils/constants';
import { validateWalletAddress } from '../utils/crypto';

/**
 * Checks if a contact belonging to the same userId and walletAddress exists.
 * Throws ConflictError if found.
 */
async function checkWalletConflict(userId: string, walletAddress: string, contactId?: string) {
    // Check if the wallet address is already used by another contact for this user
    const where: any = { userId, walletAddress };
    if (contactId) {
        where.NOT = { contactId };
    }
    const existingContact = await prisma.contact.findFirst({ where });
    if (existingContact) {
        throw new ConflictError('A contact with this wallet address already exists.');
    }
    // Check if the wallet address belongs to one of the user's own wallets
    const userWallet = await prisma.wallet.findFirst({
        where: {
            userId,
            address: walletAddress,
        },
    });
    if (userWallet) {
        throw new ConflictError('You cannot add your own wallet address as a contact.');
    }
}

const prisma = new PrismaClient();

interface ContactResponse {
    contactId: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    walletAddress: string;
    phoneNumber?: string | null;
    relationship?: string | null;
}

/**
 * Get all contacts for a user
 */
export async function getContactsByUser(userId: string): Promise<ContactResponse[]> {
    const contacts = await prisma.contact.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
    });

    return contacts.map((contact) => ({
        contactId: contact.contactId,
        userId: contact.userId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        walletAddress: contact.walletAddress,
        phoneNumber: contact.phoneNumber,
        relationship: contact.relationship,
    }));
}

/**
 * Create a new contact for a user
 */
export async function createContact(data: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    walletAddress: string;
    phoneNumber?: string;
    relationship?: string;
}): Promise<ContactResponse> {

    if (!REGEX.EMAIL.test(data.email)) {
        throw new BadRequestError("Invalid email format");
    }

    if (data.phoneNumber && !REGEX.PHONE.test(data.phoneNumber)) {
        throw new BadRequestError("Invalid phone number format");
    }

    validateWalletAddress(data.walletAddress);

    await checkWalletConflict(data.userId, data.walletAddress);

    const contact = await prisma.contact.create({ data });

    return {
        contactId: contact.contactId,
        userId: contact.userId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        walletAddress: contact.walletAddress,
        phoneNumber: contact.phoneNumber,
        relationship: contact.relationship,
    };
}

/**
 * Update an existing contact
 */
export async function updateContact(data: {
    userId: string;
    contactId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    walletAddress?: string;
    phoneNumber?: string | null;
    relationship?: string | null;
}): Promise<ContactResponse> {
    const { contactId, ...updateFields } = data;

    const existing = await prisma.contact.findUnique({ where: { contactId } });

    if (!existing) {
        throw new NotFoundError('Contact not found');
    }

    // Only include fields that were actually provided
    const updateData: Partial<typeof updateFields> = {};
    if (updateFields.firstName) updateData.firstName = updateFields.firstName;
    if (updateFields.lastName) updateData.lastName = updateFields.lastName;
    if (updateFields.email) {
        if (!REGEX.EMAIL.test(updateFields.email)) {
            throw new BadRequestError("Invalid email format");
        }
        updateData.email = updateFields.email;
    }
    if (updateFields.walletAddress) {
        validateWalletAddress(updateFields.walletAddress);
        await checkWalletConflict(data.userId, updateFields.walletAddress, contactId);
        updateData.walletAddress = updateFields.walletAddress;
    }
    if (updateFields.phoneNumber !== undefined) {
        if (updateFields.phoneNumber && !REGEX.PHONE.test(updateFields.phoneNumber)) {
            throw new BadRequestError("Invalid phone number format");
        }
        updateData.phoneNumber = updateFields.phoneNumber || null;
    }
    if (updateFields.relationship !== undefined) {
        updateData.relationship = updateFields.relationship || null;
    }

    const contact = await prisma.contact.update({
        where: { contactId },
        data: updateData,
    });

    return {
        contactId: contact.contactId,
        userId: contact.userId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        walletAddress: contact.walletAddress,
        phoneNumber: contact.phoneNumber,
        relationship: contact.relationship,
    };
}

/**
 * Delete a contact
 */
export async function deleteContact(contactId: string): Promise<void> {
    const existing = await prisma.contact.findUnique({ where: { contactId } });

    if (!existing) {
        throw new NotFoundError('Contact not found');
    }

    await prisma.contact.delete({ where: { contactId } });
}

export { prisma };
