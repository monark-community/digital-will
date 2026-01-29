import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Will",
  description: "WillChain digital will",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
