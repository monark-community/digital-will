import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { ConflictError, UnauthorizedError, BadRequestError, NotFoundError } from '../utils/errors';
import { PASSWORD } from '../utils/constants';

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
    },
    token,
  };
}

export { prisma };
