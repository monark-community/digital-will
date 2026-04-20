import { apiClient } from "../api-client";
import { API_ROUTES } from "../config";
import type {
  AuthResponse,
  User,
  WalletCheckResponse,
  CreateAccountWithWalletRequest,
} from "../types";

/**
 * Auth service - handles all authentication API calls
 */
export const authService = {
  /**
   * Get current user profile
   */
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { user: User };
    }>(API_ROUTES.AUTH.ME);
    return response.data.data.user;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await apiClient.post(API_ROUTES.AUTH.LOGOUT);
  },

  /**
   * Save token to localStorage
   */
  setToken: (token: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
  },

  /**
   * Remove token from localStorage
   */
  removeToken: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },

  /**
   * Save user to localStorage
   */
  setUser: (user: User): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
    }
  },

  /**
   * Get user from localStorage
   */
  getUser: (): User | null => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  /**
   * Get token from localStorage
   */
  getToken: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!authService.getToken();
  },

  /**
   * Check if wallet address exists
   */
  checkWallet: async (walletAddress: string): Promise<WalletCheckResponse> => {
    const response = await apiClient.post<{
      success: boolean;
      data: WalletCheckResponse;
    }>(API_ROUTES.AUTH.WALLET_CHECK, { walletAddress });
    return response.data.data;
  },

  /**
   * Sign in with wallet address
   */
  walletSignIn: async (data: {
    walletAddress: string;
    signature: string;
    message: string;
  }): Promise<AuthResponse> => {
    const response = await apiClient.post<{
      success: boolean;
      data: AuthResponse;
    }>(API_ROUTES.AUTH.WALLET_SIGNIN, data);
    return response.data.data;
  },

  /**
   * Create account with wallet
   */
  createAccountWithWallet: async (
    data: CreateAccountWithWalletRequest,
  ): Promise<AuthResponse> => {
    const response = await apiClient.post<{
      success: boolean;
      data: AuthResponse;
    }>(API_ROUTES.AUTH.WALLET_CREATE, data);
    return response.data.data;
  },

  /**
   * Refresh JWT token — get a new token with fresh expiry
   */
  refreshToken: async (): Promise<string> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { token: string };
    }>(API_ROUTES.AUTH.REFRESH);
    return response.data.data.token;
  },
};
