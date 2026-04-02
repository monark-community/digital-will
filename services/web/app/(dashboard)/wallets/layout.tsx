import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wallets",
};

export default function WalletsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
