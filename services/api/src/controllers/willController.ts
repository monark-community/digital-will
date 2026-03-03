import { Request, Response, NextFunction } from "express";
import * as willService from '../services/willService';
import { AppError } from "../utils/errors";
import { asyncHandler } from "../middlewares/errorMiddleware";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from '../utils/errors';

/**
 * Get wills by wallet address
 */
export const handleGetWills = asyncHandler(async (
    req: Request,
    res: Response,
): Promise<void> => {

    const { walletAddress } = req.params;

    const wills = await willService.getWillsByWalletAddress(walletAddress);

    res.status(StatusCodes.OK).json({
        success: true,
        data: wills,
    });

});

/**
 * Add a new will to account
 */
/* export const handleAddWill = asyncHandler(async (
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

}); */

// 1. Créer un brouillon
export const handleCreateDraft = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { walletAddress, secondaryMembers, minSecurityPeriod, maxSecurityPeriod } = req.body;

    if (!walletAddress) {
      throw new BadRequestError('Wallet address is required');
    }

    const will = await willService.createDraftWill({
      walletAddress,
      secondaryMembers,
      minSecurityPeriod,
      maxSecurityPeriod
    });

    res.status(201).json({
      success: true,
      data: will,
      message: 'Draft will created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 2. Mettre à jour un brouillon
export const handleUpdateDraft = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { willId } = req.params;
    const { secondaryMembers, minSecurityPeriod, maxSecurityPeriod } = req.body;

    if (!willId) {
      throw new BadRequestError('Will ID is required');
    }

    const will = await willService.updateDraftWill(willId, {
      secondaryMembers,
      minSecurityPeriod,
      maxSecurityPeriod
    });

    res.json({
      success: true,
      data: will,
      message: 'Draft will updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 3. Déployer un will (le passer en INACTIVE)
export const handleDeployWill = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { willId } = req.params;
    const { contractAddressInBlockchain, chainId } = req.body;
console.log ("Deploying will with params dans controller:", { willId, contractAddressInBlockchain, chainId });
    if (!willId) {
      throw new BadRequestError('Will ID is required');
    }

    if (!contractAddressInBlockchain) {
      throw new BadRequestError('Contract address is required for deployment');
    }

    if (!chainId) {
      throw new BadRequestError('Chain ID is required for deployment');
    }

    const will = await willService.deployWill(willId, {
      contractAddressInBlockchain,
      chainId
    });

    res.json({
      success: true,
      data: will,
      message: 'Will deployed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// 4. Supprimer un brouillon
export const handleDeleteDraft = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { willId } = req.params;

    if (!willId) {
      throw new BadRequestError('Will ID is required');
    }

    await willService.deleteDraftWill(willId);

    res.json({
      success: true,
      message: 'Draft will deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};