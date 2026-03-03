import { Request, Response, NextFunction } from 'express';
import * as contactsService from '../services/contactsService';
import { asyncHandler } from '../middlewares/errorMiddleware';
import { StatusCodes } from 'http-status-codes';

/**
 * Get all contacts for current user
 */
export const handleGetContacts = asyncHandler(async (req: Request, res: Response) => {
    const contacts = await contactsService.getContactsByUser(req.user?.userId);

    res.status(StatusCodes.OK).json({
        success: true,
        data: { contacts },
    });
});

/**
 * Add new contact to user
 */
export const handleAddContact = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { firstName, lastName, email, walletAddress, phoneNumber, relationship } = req.body;
    
    console.log("BELEK 1", walletAddress);
    const contact = await contactsService.createContact({ userId, firstName, lastName, email, walletAddress: walletAddress?.toLowerCase(), phoneNumber, relationship });

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Contact added successfully',
        data: { contact },
    });
});


/**
 * Remove contact from account
 */
export const handleDeleteContact = asyncHandler(async (req: Request, res: Response) => {
    const { contactId } = req.params;

    await contactsService.deleteContact(contactId);

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Contact removed successfully',
    });

});


/**
 * Update contact details
 */
export const handleUpdateContact = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const { contactId } = req.params;
    const { firstName, lastName, email, walletAddress, phoneNumber, relationship } = req.body;
    
    console.log("BELEK 2", walletAddress);

    const contact = await contactsService.updateContact({ userId, contactId, firstName, lastName, email, walletAddress: walletAddress?.toLowerCase(), phoneNumber, relationship });

    res.status(StatusCodes.OK).json({
        success: true,
        message: 'Contact updated successfully',
        data: { contact },
    });

});

