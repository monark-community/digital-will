import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import {
  ConflictError,
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
} from "../utils/errors";
import { PASSWORD } from "../utils/constants";
import {
  verifyWalletSignature,
  validateMessageTimestamp,
  validateWalletAddress,
} from "../utils/crypto";
import { linkSecondaryMembersByTempAddress } from "./secondaryMemberService";

const prisma = new PrismaClient();

/** Generate a signed JWT for the given user. */
function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, String(config.jwt.secret), {
    expiresIn: config.jwt.expiresIn as any,
  });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      userId: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNo: true,
      wantToReceiveMails: true,
    },
  });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

interface UserResponse {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNo?: string | null;
  walletAddress?: string | null;
  wantToReceiveMails: boolean;
}

interface AuthResponse {
  user: UserResponse;
  token: string;
}

/**
 * Check if wallet exists and get associated user
 */
export async function checkWalletExists(
  walletAddress: string,
): Promise<{ exists: boolean; userId?: string }> {
  const wallet = await prisma.wallet.findUnique({
    where: { address: walletAddress.toLowerCase() },
    include: { user: true },
  });

  return {
    exists: !!wallet,
    userId: wallet?.userId,
  };
}

/**
 * Authenticate with wallet (sign in if exists)
 */
export async function walletSignIn(
  walletAddress: string,
  signature: string,
  message: string,
): Promise<AuthResponse> {
  // Validate wallet address format
  validateWalletAddress(walletAddress);

  // Verify the signature
  verifyWalletSignature(message, signature, walletAddress);

  // Validate timestamp to prevent replay attacks
  validateMessageTimestamp(message);

  const wallet = await prisma.wallet.findUnique({
    where: { address: walletAddress.toLowerCase() },
    include: { user: true },
  });

  if (!wallet) {
    throw new NotFoundError("No account found with this wallet address");
  }

  const user = wallet.user;

  // Generate JWT token
  const token = generateToken(user.userId, user.email);

  return {
    user: {
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNo: user.phoneNo,
      walletAddress: wallet.address,
      wantToReceiveMails: user.wantToReceiveMails,
    },
    token,
  };
}

/**
 * Link wallet to existing user account
 */
export async function linkWallet(
  userId: string,
  walletAddress: string,
): Promise<UserResponse> {
  const existingWallet = await prisma.wallet.findUnique({
    where: { address: walletAddress.toLowerCase() },
    include: { user: true },
  });

  if (existingWallet && existingWallet.userId !== userId) {
    throw new ConflictError("This wallet is already linked to another account");
  }

  const user = await prisma.user.findUnique({
    where: { userId },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return {
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNo: user.phoneNo,
    walletAddress: walletAddress.toLowerCase(),
    wantToReceiveMails: user.wantToReceiveMails,
  };
}

/**
 * Create account with wallet address
 */
export async function createAccountWithWallet(data: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNo?: string;
  wantToReceiveMails?: boolean;
  walletAddress: string;
  signature: string;
  message: string;
}): Promise<AuthResponse> {
  const {
    firstName,
    lastName,
    email,
    phoneNo,
    wantToReceiveMails,
    walletAddress,
    signature,
    message,
  } = data;

  validateWalletAddress(walletAddress);

  verifyWalletSignature(message, signature, walletAddress);

  validateMessageTimestamp(message);

  const existingWallet = await prisma.wallet.findUnique({
    where: { address: walletAddress.toLowerCase() },
  });

  if (existingWallet) {
    throw new ConflictError("This wallet is already linked to an account");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError("An account with this email already exists");
  }

  const randomPassword = Math.random().toString(36).substring(2, 15);
  const passwordHash = await bcrypt.hash(randomPassword, PASSWORD.SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phoneNo,
      passwordHash,
      wantToReceiveMails: wantToReceiveMails ?? false,
      wallets: {
        create: {
          address: walletAddress.toLowerCase(),
        },
      },
    },
    include: {
      wallets: true,
    },
  });

  const primaryWallet = user.wallets[0];

  // Link any SecondaryMember records that were created with this address
  // before the user had an account (tempWalletAddress → walletAddress)
  await linkSecondaryMembersByTempAddress(walletAddress);

  const token = generateToken(user.userId, user.email);

  return {
    user: {
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNo: user.phoneNo,
      walletAddress: primaryWallet.address,
      wantToReceiveMails: user.wantToReceiveMails,
    },
    token,
  };
}

/**
 * Refresh an existing valid token — issues a new token with a fresh expiry.
 * The caller must already be authenticated (verifyToken middleware).
 */
export async function refreshToken(userId: string): Promise<{ token: string }> {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: { userId: true, email: true },
  });

  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  const token = generateToken(user.userId, user.email);

  return { token };
}

export { prisma };
