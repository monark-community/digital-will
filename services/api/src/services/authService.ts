import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { ConflictError, UnauthorizedError, BadRequestError, NotFoundError } from '../utils/errors';
import { PASSWORD } from '../utils/constants';
import { verifyWalletSignature, validateMessageTimestamp, validateWalletAddress } from '../utils/crypto';

const prisma = new PrismaClient();

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNo?: string;
  password: string;
  confirmPassword: string;
}

interface SignInData {
  email: string;
  password: string;
}

interface UserResponse {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNo?: string | null;
}

interface AuthResponse {
  user: UserResponse;
  token: string;
}

/**
 * Sign up a new user
 */
export async function signUp(data: SignUpData): Promise<AuthResponse> {
  const { firstName, lastName, email, phoneNo, password } = data;

  // Hash password
  const passwordHash = await bcrypt.hash(password, PASSWORD.SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phoneNo,
      passwordHash,
    },
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.userId, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return {
    user: {
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNo: user.phoneNo,
    },
    token,
  };
}

/**
 * Sign in an existing user
 */
export async function signIn(data: SignInData): Promise<AuthResponse> {
  const { email, password } = data;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.userId, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return {
    user: {
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNo: user.phoneNo,
      walletAddress: user.walletAddress,
    },
    token,
  };
}

/**
 * Check if wallet exists and get associated user
 */
export async function checkWalletExists(walletAddress: string): Promise<{ exists: boolean; userId?: string }> {

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
  message: string
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
    throw new NotFoundError('No account found with this wallet address');
  }

  const user = wallet.user;

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.userId, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return {
    user: {
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNo: user.phoneNo,
      walletAddress: user.walletAddress,
    },
    token,
  };
}

/**
 * Link wallet to existing user account
 */
export async function linkWallet(userId: string, walletAddress: string): Promise<UserResponse> {

  const existingWallet = await prisma.user.findUnique({
    where: { walletAddress: walletAddress.toLowerCase() },
  });

  if (existingWallet && existingWallet.userId !== userId) {
    throw new ConflictError('This wallet is already linked to another account');

  const user = await prisma.user.update({
    where: { userId },
    data: { walletAddress: walletAddress.toLowerCase() },
  });

  return {
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNo: user.phoneNo,
    walletAddress: user.walletAddress,
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
  walletAddress: string;
  signature: string;
  message: string;
}): Promise<AuthResponse> {
  const { firstName, lastName, email, phoneNo, walletAddress, signature, message } = data;

  validateWalletAddress(walletAddress);

  verifyWalletSignature(message, signature, walletAddress);

  validateMessageTimestamp(message);

  const existingWallet = await prisma.wallet.findUnique({
    where: { address: walletAddress.toLowerCase() },
  });

  if (existingWallet) {
    throw new ConflictError('This wallet is already linked to an account');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
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

  const token = jwt.sign(
    { userId: user.userId, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return {
    user: {
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNo: user.phoneNo,
      walletAddress: primaryWallet.address,
    },
    token,
  };
}

export { prisma };