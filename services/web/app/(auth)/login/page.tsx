"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCheckWallet, useWalletSignIn } from "@/lib/hooks";
import { connectWallet, isMetaMaskInstalled } from "@/lib/utils/wallet";
import { authService } from "@/lib/services";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [walletConnecting, setWalletConnecting] = useState(false);

  const { mutateAsync: checkWallet } = useCheckWallet();
  const { mutateAsync: walletSignIn } = useWalletSignIn();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleMetaMaskConnect = async () => {
    let keepConnecting = false;

    try {
      setWalletConnecting(true);
      setErrorMessage(null);

      if (!isMetaMaskInstalled()) {
        setErrorMessage(
          "MetaMask is not installed. Please install MetaMask to continue.",
        );
        return;
      }

      const { address, signature, message } = await connectWallet();

      const data = await checkWallet(address);

      if (data.exists) {
        await walletSignIn({ walletAddress: address, signature, message });
        // On success, the mutation redirects; keep the button in the
        // "Connecting..." state until navigation/unmount.
        keepConnecting = true;
        return;
      }

      const params = new URLSearchParams({
        address,
        signature,
        message,
      });
      const redirectTo = searchParams.get("redirectTo");
      if (redirectTo) {
        params.set("redirectTo", redirectTo);
      }

      // Keep the button disabled/loading until navigation completes.
      keepConnecting = true;
      router.push(`/signup/wallet?${params.toString()}`);
      return;
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to connect to MetaMask");
    } finally {
      if (!keepConnecting) {
        setWalletConnecting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col items-stretch px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row rounded-2xl overflow-hidden border border-[var(--border-section)] bg-[var(--bg-card)]/70 shadow-2xl backdrop-blur flex-1">
        {/* Left: brand / hero */}
        <div className="relative hidden lg:flex lg:w-2/5 flex-col justify-center px-10 py-12 gap-6 bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-page)] to-[var(--bg-card)]">
          <div className="flex items-center gap-3">
            <Link
              href="/landing"
              className="inline-flex items-center justify-center"
            >
              <div className="w-11 h-11 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/40">
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
            <span className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
              WillChain
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
              See your legacy secured for your{" "}
              <span className="text-[var(--accent)]">closest ones.</span>
            </h1>
            <p className="text-sm md:text-base leading-relaxed text-[var(--text-muted)] max-w-md">
              Create, manage, and execute digital wills on the blockchain with
              confidence. Your assets, your wishes, delivered exactly as you
              intend.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 max-w-md">
            <div className="aspect-[4/5] rounded-3xl bg-[var(--bg-card)] border border-[var(--border-section)] shadow-lg shadow-black/20 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-[var(--accent)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div className="aspect-[4/5] rounded-3xl bg-[var(--bg-card)] border border-[var(--border-section)] shadow-lg shadow-black/20 translate-y-4 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-[var(--accent)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"

                />
              </svg>
            </div>
            <div className="aspect-[4/5] rounded-3xl bg-[var(--bg-card)] border border-[var(--border-section)] shadow-lg shadow-black/20 -translate-y-3 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-[var(--accent)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Right: login card */}
        <div className="w-full lg:w-3/5 flex items-center justify-center bg-[var(--bg-page)]/60">
          <div className="w-full max-w-md lg:max-w-xl px-6 py-10 sm:px-10 mx-auto">
            <div className="lg:hidden flex justify-center mb-6">
              <Link
                href="/landing"
                className="inline-flex items-center justify-center"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/40">
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
            </div>

            <div className="space-y-2 text-center">
              <h2 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)]">
                Log in to WillChain
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Use your wallet to securely access your digital will dashboard.
              </p>
            </div>

            <div className="mt-8 space-y-6">
              {errorMessage && (
                <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4">
                  <p className="text-sm text-red-400">{errorMessage}</p>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={handleMetaMaskConnect}
                  disabled={walletConnecting}
                  className="group relative w-full flex justify-center items-center py-4 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-[var(--accent)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
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

              <div className="mt-4 text-center text-xs text-[var(--text-muted)]">
                <p>
                  By connecting your wallet, you agree to the{" "}
                  <span className="font-medium text-[var(--accent)]">
                    Terms
                  </span>{" "}
                  and{" "}
                  <span className="font-medium text-[var(--accent)]">
                    Privacy Policy
                  </span>
                  .
                </p>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-[var(--text-muted)]">
                  Don't have MetaMask?{" "}
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--accent)] hover:opacity-90 transition-opacity"
                  >
                    Install it here
                  </a>
                </p>
              </div>

              <div className="mt-4 flex justify-center">
                <Link
                  href="/landing"
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-section)] bg-[var(--bg-card)]/70 px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center -ml-0.5 border-l border-b border-[var(--text-muted)] rotate-45 self-center" />
                  <span>Back to landing</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
