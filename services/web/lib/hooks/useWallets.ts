"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { walletService } from "@/lib/services";
import { AxiosError } from "axios";

/**
 * Hook to get all wallets
 */
export function useWallets() {
  return useQuery({
    queryKey: ["wallets"],
    queryFn: () => walletService.getWallets(),
  });
}

/**
 * Hook to add a new wallet
 */
export function useAddWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      walletAddress: string;
      signature: string;
      message: string;
      label?: string;
    }) => walletService.addWallet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Add wallet error:", error.response?.data?.message);
    },
  });
}

/**
 * Hook to remove a wallet
 */
export function useRemoveWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (walletId: string) => walletService.removeWallet(walletId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Remove wallet error:", error.response?.data?.message);
    },
  });
}

/**
 * Hook to update wallet label
 */
export function useUpdateWalletLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ walletId, label }: { walletId: string; label: string }) =>
      walletService.updateWalletLabel(walletId, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Update wallet label error:", error.response?.data?.message);
    },
  });
}
