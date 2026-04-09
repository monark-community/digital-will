import { Router } from "express";
import {
  handleGetWills,
  handleGetAssociatedWills,
  handleCreateDraft,
  handleUpdateDraft,
  handleDeployWill,
  handleDeleteDraft,
  handleCancelWillOnChain,
  handleUpdateDeployedWill,
  handleValidateForDeployment,
  handleGetContractBalance,
  handleGetEnrichedWills,
  handleRemoveSecondaryMember,
} from "../controllers/willController";
import { verifyToken } from "../middlewares/authMiddleware";
import {
  authorizeWillOwner,
  authorizeDraftWillOwner,
  authorizeWalletOwner,
} from "../middlewares/authorizationMiddleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Wills
 *   description: Will creation, deployment, and management
 */

// All routes require authentication
router.use(verifyToken);

/**
 * @swagger
 * /wills/associated:
 *   get:
 *     summary: Get all wills where the authenticated user is a secondary member
 *     tags: [Wills]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of associated wills
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/associated", handleGetAssociatedWills);

/**
 * @swagger
 * /wills/{walletAddress}:
 *   get:
 *     summary: Get all wills (drafts and deployed) by wallet address
 *     tags: [Wills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: The wallet address to retrieve wills for
 *     responses:
 *       200:
 *         description: List of wills for the wallet
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — wallet does not belong to user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:walletAddress", authorizeWalletOwner, handleGetWills);

/**
 * @swagger
 * /wills/{walletAddress}/enriched:
 *   get:
 *     summary: Get wills enriched with live blockchain state
 *     tags: [Wills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enriched wills list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/:walletAddress/enriched",
  authorizeWalletOwner,
  handleGetEnrichedWills,
);

/**
 * @swagger
 * /wills/validate/{willId}:
 *   get:
 *     summary: Validate a draft will for deployment readiness
 *     tags: [Wills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: willId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         isValid:
 *                           type: boolean
 *                         errors:
 *                           type: array
 *                           items:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Draft will not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/validate/:willId",
  authorizeDraftWillOwner,
  handleValidateForDeployment,
);

/**
 * @swagger
 * /wills/balance/{contractAddress}:
 *   get:
 *     summary: Get the ETH balance of a deployed will contract
 *     tags: [Wills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contractAddress
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contract balance
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         balance:
 *                           type: string
 *                           description: Balance in wei as a string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/balance/:contractAddress", handleGetContractBalance);

/**
 * @swagger
 * /wills/draft:
 *   post:
 *     summary: Create a new draft will (off-chain only)
 *     tags: [Wills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DraftWillRequest'
 *     responses:
 *       201:
 *         description: Draft will created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — wallet not owned by user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/draft", authorizeWalletOwner, handleCreateDraft);

/**
 * @swagger
 * /wills/draft/{willId}:
 *   put:
 *     summary: Update an existing draft will
 *     tags: [Wills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: willId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DraftWillUpdateRequest'
 *     responses:
 *       200:
 *         description: Draft will updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Draft will not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete a draft will
 *     tags: [Wills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: willId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Draft will deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Draft will not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/draft/:willId", authorizeDraftWillOwner, handleUpdateDraft);

router.post("/:willId/deploy", authorizeDraftWillOwner, handleDeployWill);

router.delete("/draft/:willId", authorizeDraftWillOwner, handleDeleteDraft);

/**
 * @swagger
 * /wills/{willId}/deploy:
 *   post:
 *     summary: Deploy a draft will to the blockchain
 *     tags: [Wills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: willId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeployWillRequest'
 *     responses:
 *       200:
 *         description: Will deployed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Draft will not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /wills/{willId}/cancel:
 *   post:
 *     summary: Revert a canceled on-chain will back to DRAFT in the database
 *     tags: [Wills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: willId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CancelWillRequest'
 *     responses:
 *       200:
 *         description: Will reverted to draft
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:willId/cancel", authorizeWillOwner, handleCancelWillOnChain);

/**
 * @swagger
 * /wills/{willId}/members:
 *   put:
 *     summary: Update secondary members of a deployed will
 *     tags: [Wills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: willId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDeployedWillRequest'
 *     responses:
 *       200:
 *         description: Members updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Will not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/:willId/members", authorizeWillOwner, handleUpdateDeployedWill);

/**
 * @swagger
 * /wills/{willId}/secondary-member:
 *   delete:
 *     summary: Remove the authenticated user as a secondary member from a will
 *     description: Used after the user has desisted from the will on-chain.
 *     tags: [Wills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: willId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Secondary member removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: No wallet addresses found for user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:willId/secondary-member", handleRemoveSecondaryMember);

export default router;
