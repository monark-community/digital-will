import { Router } from 'express';
import * as contactsController from '../controllers/contactsController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// Toutes les routes sont protégées par le token
router.use(verifyToken);

/**
 * @route   GET /contacts
 * @desc    Get all contacts for a user
 * @access  Private
 */
router.get('/', contactsController.handleGetContacts);

/**
 * @route   POST /contacts
 * @desc    Add new contact
 * @access  Private
 */
router.post('/', contactsController.handleAddContact);

/**
 * @route   DELETE /contacts/:contactId
 * @desc    Delete a contact
 * @access  Private
 */
router.delete('/:contactId', contactsController.handleDeleteContact);

/**
 * @route   PATCH /contacts/:contactId
 * @desc    Update a contact
 * @access  Private
 */
router.patch('/:contactId', contactsController.handleUpdateContact);


export default router;
