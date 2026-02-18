import { PrismaClient } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { REGEX } from '../utils/constants';
import { validateWalletAddress } from '../utils/crypto';

const prisma = new PrismaClient();

interface ContactResponse {
    contactId: number;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    walletAddress: string;
    phoneNumber?: string | null;
}

/**
 * Get all contacts for a user
 */
export async function getContactsByUser(userId: string): Promise<ContactResponse[]> {
    const contacts = await prisma.contact.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
    });

    return contacts.map(contact => ({
        contactId: contact.contactId,
        userId: contact.userId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        walletAddress: contact.walletAddress,
        phoneNumber: contact.phoneNumber,
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
}): Promise<ContactResponse> {

    if (!REGEX.EMAIL.test(data.email)) {
        throw new BadRequestError("Invalid email format");
    }

    if (data.phoneNumber && !REGEX.PHONE.test(data.phoneNumber)) {
        throw new BadRequestError("Invalid phone number format");
    }

    validateWalletAddress(data.walletAddress);

    const contact = await prisma.contact.create({ data });

    return {
        contactId: contact.contactId,
        userId: contact.userId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        walletAddress: contact.walletAddress,
        phoneNumber: contact.phoneNumber,
    };
}

/**
 * Update an existing contact
 */
export async function updateContact(data: {
    contactId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    walletAddress?: string;
    phoneNumber?: string;
}): Promise<ContactResponse> {
    const { contactId, ...updateFields } = data;

    const existing = await prisma.contact.findUnique({ where: { contactId } });

    if (!existing) {
        throw new NotFoundError('Contact not found');
    }

    // Only include fields that were actually provided
    const updateData: Partial<typeof updateFields> = {};
    if (updateFields.firstName !== undefined) updateData.firstName = updateFields.firstName;
    if (updateFields.lastName !== undefined) updateData.lastName = updateFields.lastName;
    if (updateFields.email !== undefined) {
        if (!REGEX.EMAIL.test(updateFields.email)) {
            throw new BadRequestError("Invalid email format");
        }
        updateData.email = updateFields.email;
    }
    if (updateFields.walletAddress !== undefined) {
        validateWalletAddress(updateFields.walletAddress);
        updateData.walletAddress = updateFields.walletAddress;
    }
    if (updateFields.phoneNumber !== undefined) {
        if (!REGEX.PHONE.test(updateFields.phoneNumber)) {
            throw new BadRequestError("Invalid phone number format");
        }
        updateData.phoneNumber = updateFields.phoneNumber;
    }

    const contact = await prisma.contact.update({
        where: { contactId: contactId },
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
