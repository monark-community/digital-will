import { Request, Response, NextFunction } from "express";
import { BadRequestError, ConflictError } from "../utils/errors";
import { prisma } from "../services/authService";
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

  // Validate name lengths
  if (firstName.length > 30) {
    throw new BadRequestError("First name must not exceed 30 characters");
  }

  if (lastName.length > 30) {
    throw new BadRequestError("Last name must not exceed 30 characters");
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

  // Validate email length (RFC 5321)
  if (email.length > 254) {
    throw new BadRequestError("Email address must not exceed 254 characters");
  }

  next();
}
