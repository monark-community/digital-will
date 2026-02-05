import { apiClient } from "../api-client";
import { API_ROUTES } from "../config";
import type { Wallet } from "../types";

/**
 * Wallet service - handles all wallet API calls
 */
export const walletService = {
  /**
   * Get all wallets for current user
   */
  getWallets: async (): Promise<Wallet[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { wallets: Wallet[] };
    }>(API_ROUTES.WALLETS.BASE);
    return response.data.data.wallets;
  },

  /**
   * Add new wallet to account
   */
  addWallet: async (data: {
    walletAddress: string;
    signature: string;
    message: string;
    label?: string;
  }): Promise<Wallet> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { wallet: Wallet };
    }>(API_ROUTES.WALLETS.BASE, data);
    return response.data.data.wallet;
  },

  /**
   * Remove wallet from account
   */
  removeWallet: async (walletId: string): Promise<void> => {
    await apiClient.delete(API_ROUTES.WALLETS.BY_ID(walletId));
  },

  /**
   * Update wallet label
   */
  updateWalletLabel: async (
    walletId: string,
    label: string
  ): Promise<Wallet> => {
    const response = await apiClient.patch<{
      success: boolean;
      data: { wallet: Wallet };
    }>(API_ROUTES.WALLETS.UPDATE_LABEL(walletId), { label });
    return response.data.data.wallet;
  },
};
