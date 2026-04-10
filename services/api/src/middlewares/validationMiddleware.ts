import { Request, Response, NextFunction } from "express";
import { BadRequestError, ConflictError } from "../utils/errors";
import prisma from "../lib/prisma";
import { REGEX, PASSWORD } from "../utils/constants";

/**
 * Validate sign up request data
 */
export async function validateSignUp(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { firstName, lastName, email, phoneNo, password, confirmPassword } =
    req.body;

  // Validate required fields
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    throw new BadRequestError(
      "Missing required fields: firstName, lastName, email, password, confirmPassword",
    );
  }

  // Validate email format
  if (!REGEX.EMAIL.test(email)) {
    throw new BadRequestError("Invalid email format");
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  // Validate password strength
  if (password.length < PASSWORD.MIN_LENGTH) {
    throw new BadRequestError(
      `Password must be at least ${PASSWORD.MIN_LENGTH} characters long`,
    );
  }

  // Validate password confirmation
  if (password !== confirmPassword) {
    throw new BadRequestError("Passwords do not match");
  }

  // Optional: Validate phone number format if provided
  if (phoneNo && !REGEX.PHONE.test(phoneNo)) {
    throw new BadRequestError("Invalid phone number format");
  }

  next();
}

/**
 * Validate sign in request data
 */
export function validateSignIn(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    throw new BadRequestError("Email and password are required");
  }

  // Validate email format
  if (!REGEX.EMAIL.test(email)) {
    throw new BadRequestError("Invalid email format");
  }

  next();
}
