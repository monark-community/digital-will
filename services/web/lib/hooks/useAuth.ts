"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services";
import type { 
  SignInRequest, 
  SignUpRequest, 
  CreateAccountWithWalletRequest,
  WalletAuthRequest
} from "@/lib/types";
import { AxiosError } from "axios";

/**
 * Hook for sign in mutation
 */
export function useSignIn() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SignInRequest) => authService.signIn(data),
    onSuccess: (response) => {
      authService.setToken(response.token);
      authService.setUser(response.user);
      queryClient.clear(); 
      router.push("/dashboard");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Sign in error:", error.response?.data?.message);
    },
  });
}

/**
 * Hook for sign up mutation
 */
export function useSignUp() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SignUpRequest) => authService.signUp(data),
    onSuccess: (response) => {
      authService.setToken(response.token);
      authService.setUser(response.user);
      queryClient.clear();
      router.push("/dashboard");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Sign up error:", error.response?.data?.message);
    },
  });
}

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
 * Hook to get current user
 */
export function useCurrentUser() {
  return useMutation({
    mutationFn: () => authService.getMe(),
  });
}

/**
 * Hook to check if wallet exists
 */
export function useCheckWallet() {
  return useMutation({
    mutationFn: (walletAddress: string) => authService.checkWallet(walletAddress),
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WalletAuthRequest) => authService.walletSignIn(data),
    onSuccess: (response) => {
      authService.setToken(response.token);
      authService.setUser(response.user);
      queryClient.clear();
      router.push("/dashboard");
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAccountWithWalletRequest) => 
      authService.createAccountWithWallet(data),
    onSuccess: (response) => {
      authService.setToken(response.token);
      authService.setUser(response.user);
      queryClient.clear();
      router.push("/dashboard");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Create account with wallet error:", error.response?.data?.message);
    },
  });
}
