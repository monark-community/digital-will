"use client";

import React from "react";
import { usePathname } from "next/navigation";

const Footer = () => {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }
  return (
    <footer className="bg-[var(--bg-section)] text-[var(--text-muted)] py-16 border-t border-[var(--border-section)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-[var(--accent)] rounded-md flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
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
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                WillChain
              </h3>
            </div>
            <p className="text-[var(--text-muted-alt)]">
              The future of digital estate planning, secured by blockchain
              technology.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
              Product
            </h4>
            <ul className="space-y-2 text-[var(--text-muted-alt)]">
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  Security
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
              Support
            </h4>
            <ul className="space-y-2 text-[var(--text-muted-alt)]">
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
              Legal
            </h4>
            <ul className="space-y-2 text-[var(--text-muted-alt)]">
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  Compliance
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[var(--border-section)] mt-8 pt-8 text-center text-[var(--text-muted-alt)]">
          <p>&copy; 2026 WillChain. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
