import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { signUp, signIn } from "../services/authService";
import { asyncHandler } from "../middlewares/errorMiddleware";

/**
 * Sign up controller
 */
export const handleSignUp = asyncHandler(
  async (req: Request, res: Response) => {
    const { firstName, lastName, email, phoneNo, password, confirmPassword } =
      req.body;

    const result = await signUp({
      firstName,
      lastName,
      email,
      phoneNo,
      password,
      confirmPassword,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "User created successfully",
      data: result,
    });
  },
);

/**
 * Sign in controller
 */
export const handleSignIn = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await signIn({ email, password });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Sign in successful",
      data: result,
    });
  },
);
