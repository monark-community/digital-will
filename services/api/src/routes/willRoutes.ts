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
  handleGetEnrichedWills
} from "../controllers/willController";
import { verifyToken } from "../middlewares/authMiddleware";

const router = Router();
// Toutes les routes sont protégées par le token
router.use(verifyToken);

/**
 * @route   GET /wills/associated
 * @desc    Get all wills where the authenticated user is a secondary member
 * @access  Private
 */
router.get("/associated", handleGetAssociatedWills);

/**
 * @route   GET /wills/:walletAddress
 * @desc    Get all wills (drafts and deployed) by wallet address
 * @access  Private
 */
router.get("/:walletAddress", handleGetWills);

/**
 * @route   GET /wills/:walletAddress/enriched
 * @desc    Get all wills enriched with blockchain state
 * @access  Private
 */
router.get("/:walletAddress/enriched", handleGetEnrichedWills);

/**
 * @route   GET /wills/validate/:willId
 * @desc    Validate a will for deployment readiness
 * @access  Private
 */
router.get("/validate/:willId", handleValidateForDeployment);

/**
 * @route   GET /wills/balance/:contractAddress
 * @desc    Get contract balance
 * @access  Private
 */
router.get("/balance/:contractAddress", handleGetContractBalance);

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

/**
 * @route   PUT /wills/:willId/members
 * @desc    Update members of a deployed (INACTIVE/ACTIVE) will
 * @access  Private
 */
router.put("/:willId/members", handleUpdateDeployedWill);

export default router;