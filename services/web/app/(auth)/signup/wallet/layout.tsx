import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connect Wallet",
};

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
