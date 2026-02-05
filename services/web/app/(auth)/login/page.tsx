"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn, useCheckWallet, useWalletSignIn } from "@/lib/hooks";
import { connectWallet, isMetaMaskInstalled } from "@/lib/utils/wallet";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [walletConnecting, setWalletConnecting] = useState(false);

  const { mutate: signIn, isPending, error, reset } = useSignIn();
  const { mutate: checkWallet } = useCheckWallet();
  const { mutate: walletSignIn } = useWalletSignIn();

  // Update local error state when mutation error changes
  useEffect(() => {
    if (error) {
      const message = error?.response?.data?.message || "An error occurred";
      setErrorMessage(message);
    }
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage(null);
      reset();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    signIn(formData);
  };

  const handleMetaMaskConnect = async () => {
    try {
      setWalletConnecting(true);
      setErrorMessage(null);

      if (!isMetaMaskInstalled()) {
        setErrorMessage("MetaMask is not installed. Please install MetaMask to continue.");
        return;
      }

      const { address, signature, message } = await connectWallet();

      checkWallet(address, {
        onSuccess: (data) => {
          if (data.exists) {
            walletSignIn(
              { walletAddress: address, signature, message },
              {
                onError: (error: any) => {
                  const message = error?.response?.data?.message || "Failed to sign in with wallet";
                  setErrorMessage(message);
                },
              }
            );
          } else {
            const params = new URLSearchParams({
              address,
              signature,
              message,
            });
            router.push(`/signup/wallet?${params.toString()}`);
          }
        },
        onError: (error: any) => {
          const message = error?.response?.data?.message || "Failed to check wallet";
          setErrorMessage(message);
        },
      });
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to connect to MetaMask");
    } finally {
      setWalletConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[var(--bg-card)] p-8 rounded-lg border border-[var(--border-section)] shadow-lg">
        <div>
          <Link href="/landing" className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-[var(--accent)] rounded-md flex items-center justify-center">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              </svg>
            </div>
          </Link>
          <h2 className="text-center text-3xl font-extrabold text-[var(--text-primary)]">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--text-muted)]">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-[var(--accent)] hover:opacity-90 transition-opacity"
            >
              Sign up
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errorMessage && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-sm text-red-400">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-[var(--border-section)] bg-[var(--bg-section)] placeholder-[var(--text-muted)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent sm:text-sm"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-[var(--border-section)] bg-[var(--bg-section)] placeholder-[var(--text-muted)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent sm:text-sm"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-[var(--accent)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isPending ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-section)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[var(--bg-card)] text-[var(--text-muted)]">
                Or continue with
              </span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleMetaMaskConnect}
              disabled={walletConnecting || isPending}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-[var(--border-section)] text-sm font-semibold rounded-lg text-[var(--text-primary)] bg-[var(--bg-section)] hover:bg-[var(--bg-page)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M32.5 5L20.5 13.5L22.5 8.5L32.5 5Z"
                  fill="#E17726"
                  stroke="#E17726"
                  strokeWidth="0.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7.5 5L19.5 13.5L17.5 8.5L7.5 5Z"
                  fill="#E27625"
                  stroke="#E27625"
                  strokeWidth="0.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M28 26L24.5 31.5L31.5 33.5L33.5 26H28Z"
                  fill="#E27625"
                  stroke="#E27625"
                  strokeWidth="0.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.5 26L8.5 33.5L15.5 31.5L12 26H6.5Z"
                  fill="#E27625"
                  stroke="#E27625"
                  strokeWidth="0.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {walletConnecting ? "Connecting..." : "Connect with MetaMask"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
