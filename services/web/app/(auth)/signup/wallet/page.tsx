"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateAccountWithWallet } from "@/lib/hooks";

function WalletSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const walletAddress = searchParams.get("address");
  const signature = searchParams.get("signature");
  const message = searchParams.get("message");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNo: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    mutate: createAccount,
    isPending,
    error,
    reset,
  } = useCreateAccountWithWallet();

  // Update local error state when mutation error changes
  useEffect(() => {
    if (error) {
      const message = error?.response?.data?.message || "An error occurred";
      setErrorMessage(message);
    }
  }, [error]);

  // Redirect if no wallet address or signature
  useEffect(() => {
    if (!walletAddress || !signature || !message) {
      router.push("/login");
    }
  }, [walletAddress, signature, message, router]);

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

    if (!walletAddress || !signature || !message) {
      setErrorMessage("Wallet authentication data is missing");
      return;
    }

    createAccount({
      ...formData,
      walletAddress,
      signature,
      message,
    });
  };

  if (!walletAddress || !signature || !message) {
    return null;
  }

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
            Create your WillChain account
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--text-muted)]">
            Complete your profile to link your wallet
          </p>
          <div className="mt-4 p-3 bg-[var(--bg-section)] rounded-lg border border-[var(--border-section)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Wallet Address</p>
            <p className="text-sm font-mono text-[var(--text-primary)] truncate">
              {walletAddress}
            </p>
          </div>
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
                htmlFor="firstName"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1"
              >
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-[var(--border-section)] bg-[var(--bg-section)] placeholder-[var(--text-muted)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent sm:text-sm"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1"
              >
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-[var(--border-section)] bg-[var(--bg-section)] placeholder-[var(--text-muted)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent sm:text-sm"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>

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
                htmlFor="phoneNo"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1"
              >
                Phone Number (Optional)
              </label>
              <input
                id="phoneNo"
                name="phoneNo"
                type="tel"
                autoComplete="tel"
                className="appearance-none relative block w-full px-4 py-3 border border-[var(--border-section)] bg-[var(--bg-section)] placeholder-[var(--text-muted)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent sm:text-sm"
                placeholder="Enter your phone number"
                value={formData.phoneNo}
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
              {isPending ? "Creating account..." : "Create Account & Link Wallet"}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WalletSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
        <div className="text-[var(--text-primary)]">Loading...</div>
      </div>
    }>
      <WalletSignupContent />
    </Suspense>
  );
}
