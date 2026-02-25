import { Router } from 'express';
import * as contactsController from '../controllers/contactsController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @route   GET /contacts
 * @desc    Get all contacts for a user
 * @access  Private
 */
router.get('/', verifyToken, contactsController.handleGetContacts);

/**
 * @route   POST /contacts
 * @desc    Add new contact
 * @access  Private
 */
router.post('/', verifyToken, contactsController.handleAddContact);

/**
 * @route   DELETE /contacts/:contactId
 * @desc    Delete a contact
 * @access  Private
 */
router.delete('/:contactId', verifyToken, contactsController.handleDeleteContact);

/**
 * @route   PATCH /contacts/:contactId
 * @desc    Update a contact
 * @access  Private
 */
router.patch('/:contactId', verifyToken, contactsController.handleUpdateContact);


export default router;
