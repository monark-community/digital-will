import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wills",
};

export default function WillsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
