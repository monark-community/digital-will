import { Request, Response, NextFunction } from "express";
import { createWill, getWillsByWalletAddress } from "../services/willService";
import { AppError } from "../utils/errors";
import { asyncHandler } from "../middlewares/errorMiddleware";
import { StatusCodes } from "http-status-codes";

/**
 * Get wills by wallet address
 */
export const handleGetWills = asyncHandler(async (
    req: Request,
    res: Response,
): Promise<void> => {

    const { walletAddress } = req.params;

    const wills = await getWillsByWalletAddress(walletAddress);

    res.status(StatusCodes.OK).json({
        success: true,
        data: wills,
    });

});

/**
 * Add a new will to account
 */
export const handleAddWill = asyncHandler(async (
    req: Request,
    res: Response,
): Promise<void> => {

    const userId = req.user?.userId;

    const { will, secondaryMembers } = req.body;

    if (!will) {
        throw new AppError("Will data is required", StatusCodes.BAD_REQUEST);
    }

    if (!secondaryMembers || !Array.isArray(secondaryMembers)) {
        throw new AppError("secondaryMembers must be an array", StatusCodes.BAD_REQUEST);
    }

    const createdWill = await createWill({
        userWalletAddress: will.walletAddress,
        contractAddressInBlockchain: will.contractAddressInBlockchain,
        chainId: will.chainId,
        secondaryMembers,
    });

    res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Will created successfully",
        data: createdWill,
    });

});