import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Associated Wills",
};

export default function AssociatedWillsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
