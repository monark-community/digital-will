import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import Footer from "./components/ui/Footer";

const inter = Inter({ subsets: ['latin'] });

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
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('willchain-theme');document.documentElement.setAttribute('data-theme',t==='light'||t==='dark'?t:'dark');})();`,
          }}
        />
      </head>
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
