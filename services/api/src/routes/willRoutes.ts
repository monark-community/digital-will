import { Router } from "express";
import { handleAddWill, handleGetWills } from "../controllers/willController";
import { verifyToken } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @route   POST /wills
 * @desc    Create a new will
 * @access  Private
 */
router.post("/", verifyToken, handleAddWill);


/**
 * @route   GET /wills/:walletAddress
 * @desc    Get wills by wallet address
 * @access  Private
 */
router.get("/:walletAddress", verifyToken, handleGetWills);


export default router;