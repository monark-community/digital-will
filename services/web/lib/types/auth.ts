/**
 * Auth types for frontend
 */

export interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNo?: string | null;
  walletAddress?: string | null;
}

export interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNo?: string;
  password: string;
  confirmPassword: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface WalletCheckResponse {
  exists: boolean;
  userId?: string;
}

export interface WalletAuthRequest {
  walletAddress: string;
  signature: string;
  message: string;
}

export interface CreateAccountWithWalletRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNo?: string;
  walletAddress: string;
  signature: string;
  message: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  success: boolean;
  message: string;
  statusCode: number;
}
