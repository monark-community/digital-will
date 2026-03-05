import { Router } from "express";
import { handleGetWills, handleCreateDraft, handleUpdateDraft, handleDeployWill, handleDeleteDraft, handleCancelWillOnChain } from "../controllers/willController";
import { verifyToken } from "../middlewares/authMiddleware";

const router = Router();
// Toutes les routes sont protégées par le token
router.use(verifyToken);

/**
 * @route   GET /wills/:walletAddress
 * @desc    Get all wills (drafts and deployed) by wallet address
 * @access  Private
 */
router.get("/:walletAddress", handleGetWills);

/**
 * @route   POST /wills/draft
 * @desc    Create a new draft will (off-chain only)
 * @access  Private
 */
router.post("/draft", handleCreateDraft);

/**
 * @route   PUT /wills/draft/:willId
 * @desc    Update an existing draft will
 * @access  Private
 */
router.put("/draft/:willId", handleUpdateDraft);

/**
 * @route   POST /wills/:willId/deploy
 * @desc    Deploy a will to blockchain and mark as INACTIVE
 * @access  Private
 */
router.post("/:willId/deploy", handleDeployWill);

/**
 * @route   DELETE /wills/draft/:willId
 * @desc    Delete a draft will
 * @access  Private
 */
router.delete("/draft/:willId", handleDeleteDraft);

/**
 * @route   POST /wills/:willId/cancel
 * @desc    Revert a canceled on-chain will back to DRAFT in the DB
 * @access  Private
 */
router.post("/:willId/cancel", handleCancelWillOnChain);

export default router;