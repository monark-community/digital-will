"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services";
import type { SignInRequest, SignUpRequest } from "@/lib/types";
import { AxiosError } from "axios";

/**
 * Hook for sign in mutation
 */
export function useSignIn() {
  const router = useRouter();

  return useMutation({
    mutationFn: (data: SignInRequest) => authService.signIn(data),
    onSuccess: (response) => {
      authService.setToken(response.token);
      authService.setUser(response.user);
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

  return useMutation({
    mutationFn: (data: SignUpRequest) => authService.signUp(data),
    onSuccess: (response) => {
      authService.setToken(response.token);
      authService.setUser(response.user);
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

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      authService.removeToken();
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
