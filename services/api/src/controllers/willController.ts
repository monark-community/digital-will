import { Request, Response, NextFunction } from "express";
import * as willService from '../services/willService';
import { AppError, UnauthorizedError } from "../utils/errors";
import { asyncHandler } from "../middlewares/errorMiddleware";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from '../utils/errors';
import { validateForDeployment } from '../utils/willValidation';
import { getContractBalance } from '../utils/blockchain';
import { enrichWillsWithChainState } from '../services/chainStateService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all wills (drafts and deployed) by wallet address
 */
export const handleGetWills = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {

  const { walletAddress } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const wallet = await prisma.wallet.findFirst({
    where: {
      address: walletAddress,
      userId: userId
    }
  });

  if (!wallet) {
    throw new UnauthorizedError('You do not own this wallet');
  }

  const wills = await willService.getWillsByWalletAddress(walletAddress);

  res.status(StatusCodes.OK).json({
    success: true,
    data: wills,
  });

});

/**
 * Get all wills where the authenticated user is a secondary member
 */
export const handleGetAssociatedWills = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const wills = await willService.getAssociatedWills(userId);

  const enrichedWills = await enrichWillsWithChainState(wills);

  res.status(StatusCodes.OK).json({
    success: true,
    data: enrichedWills,
  });
});

// 1. Créer un brouillon
export const handleCreateDraft = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { walletAddress, willName, secondaryMembers, minSecurityPeriod, maxSecurityPeriod } = req.body;

    if (!walletAddress) {
      throw new BadRequestError('Wallet address is required');
    }

    const will = await willService.createDraftWill({
      walletAddress,
      willName,
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
    const { willName, secondaryMembers, minSecurityPeriod, maxSecurityPeriod } = req.body;

    if (!willId) {
      throw new BadRequestError('Will ID is required');
    }

    const will = await willService.updateDraftWill(willId, {
      willName,
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

// 3. Déployer un will
export const handleDeployWill = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { willId } = req.params;
    const { contractAddressInBlockchain, chainId } = req.body;
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

export const handleCancelWillOnChain = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { willId } = req.params;
    const { minSecurityPeriod, maxSecurityPeriod, secondaryMembersVotingPowers } = req.body;

    if (!willId) throw new BadRequestError('Will ID is required');
    if (minSecurityPeriod === undefined) throw new BadRequestError('minSecurityPeriod is required');
    if (maxSecurityPeriod === undefined) throw new BadRequestError('maxSecurityPeriod is required');
    if (!secondaryMembersVotingPowers) throw new BadRequestError('secondaryMembersVotingPowers is required');

    const will = await willService.cancelWillOnChain(willId, {
      minSecurityPeriod,
      maxSecurityPeriod,
      secondaryMembersVotingPowers,
    });

    res.json({
      success: true,
      data: will,
      message: 'Will reverted to draft successfully',
    });
  } catch (error) {
    next(error);
  }
};

// 4. Supprimer un brouillon -- OK
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

export const handleUpdateDeployedWill = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { willId } = req.params;
    if (!willId) throw new BadRequestError('Will ID is required');

    const { updatedMembers, addedMembers, deletedMemberIds } = req.body;

    const will = await willService.updateDeployedWillInDB(willId, {
      updatedMembers,
      addedMembers,
      deletedMemberIds,
    });

    res.json({
      success: true,
      data: will,
      message: 'Will members updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate a draft will for deployment readiness -- ok
 */
export const handleValidateForDeployment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { willId } = req.params;
    if (!willId) throw new BadRequestError('Will ID is required');

    const draftWill = await willService.getDraftWillById(willId);
    if (!draftWill) throw new BadRequestError('Will not found');

    const validation = validateForDeployment({
      secondaryMembers: draftWill.draftsecondarymembers,
      minSecurityPeriod: draftWill.minSecurityPeriod,
      maxSecurityPeriod: draftWill.maxSecurityPeriod,
    });

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get contract balance for a will
 */
export const handleGetContractBalance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { contractAddress } = req.params;
    if (!contractAddress) throw new BadRequestError('Contract address is required');

    const balance = await getContractBalance(contractAddress);

    res.json({
      success: true,
      data: { balance },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all wills - the deployed ones enriched with blockchain state
 */
export const handleGetEnrichedWills = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { walletAddress } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const wallet = await prisma.wallet.findFirst({
    where: {
      address: walletAddress,
      userId: userId
    }
  });

  if (!wallet) {
    throw new UnauthorizedError('You do not own this wallet');
  }

  const wills = await willService.getWillsByWalletAddress(walletAddress);
  const enrichedWills = await enrichWillsWithChainState(wills);

  res.status(StatusCodes.OK).json({
    success: true,
    data: enrichedWills,
  });
});