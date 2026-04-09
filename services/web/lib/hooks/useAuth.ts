"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/services";
import type {
  CreateAccountWithWalletRequest,
  WalletAuthRequest,
} from "@/lib/types";
import { AxiosError } from "axios";

/**
 * Hook for logout
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      authService.removeToken();
      queryClient.clear();
      router.push("/login");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      // Even if API call fails, remove token and redirect
      authService.removeToken();
      router.push("/login");
    },
  });
}

/**
 * Hook to get current user (auto-fetches and caches)
 */
export function useCurrentUser() {
  const query = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => authService.getMe(),
    enabled: typeof window !== "undefined" && !!authService.getToken(),
    staleTime: 5 * 60 * 1000,
    retry: false,
    initialData: () => {
      if (typeof window === "undefined") return undefined;
      const cached = authService.getUser();
      // Only use localStorage data if it has a full profile (firstName present)
      return cached?.firstName ? cached : undefined;
    },
    initialDataUpdatedAt: 0,
  });

  // Keep localStorage in sync so initialData is always fresh on next mount
  useEffect(() => {
    if (query.data) {
      authService.setUser(query.data);
    }
  }, [query.data]);

  return query;
}

/**
 * Hook to check if wallet exists
 */
export function useCheckWallet() {
  return useMutation({
    mutationFn: (walletAddress: string) =>
      authService.checkWallet(walletAddress),
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Check wallet error:", error.response?.data?.message);
    },
  });
}

/**
 * Hook for wallet sign in
 */
export function useWalletSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WalletAuthRequest) => authService.walletSignIn(data),
    onSuccess: (response) => {
      authService.setToken(response.token);
      authService.setUser(response.user);
      queryClient.clear();
      const redirectTo = searchParams.get("redirectTo");
      router.push(redirectTo || "/dashboard");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Wallet sign in error:", error.response?.data?.message);
    },
  });
}

/**
 * Hook to create account with wallet
 */
export function useCreateAccountWithWallet() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAccountWithWalletRequest) =>
      authService.createAccountWithWallet(data),
    onSuccess: (response) => {
      authService.setToken(response.token);
      authService.setUser(response.user);
      queryClient.clear();
      const redirectTo = searchParams.get("redirectTo");
      router.push(redirectTo || "/dashboard");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error(
        "Create account with wallet error:",
        error.response?.data?.message,
      );
    },
  });
}
