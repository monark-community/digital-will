import React from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  isAuthenticated?: boolean;
  userEmail?: string;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated = false, userEmail }) => {
  return (
    <nav className="bg-[var(--bg-section)]/90 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-[var(--border-section)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href={isAuthenticated ? '/dashboard' : '/landing'} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[var(--accent)] rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">WillChain</h1>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              {!isAuthenticated ? (
                <>
                  <a href="#home" className="text-[var(--text-muted)] hover:text-[var(--accent)] px-3 py-2 text-sm font-medium transition-colors">Home</a>
                  <a href="#features" className="text-[var(--text-muted)] hover:text-[var(--accent)] px-3 py-2 text-sm font-medium transition-colors">Features</a>
                  <a href="#security" className="text-[var(--text-muted)] hover:text-[var(--accent)] px-3 py-2 text-sm font-medium transition-colors">Security</a>
                </>
              ) : (
                <>
                  <a href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--accent)] px-3 py-2 text-sm font-medium transition-colors">Dashboard</a>
                  <a href="/wills" className="text-[var(--text-muted)] hover:text-[var(--accent)] px-3 py-2 text-sm font-medium transition-colors">My Wills</a>
                  <a href="/beneficiaries" className="text-[var(--text-muted)] hover:text-[var(--accent)] px-3 py-2 text-sm font-medium transition-colors">Beneficiaries</a>
                  <a href="/settings" className="text-[var(--text-muted)] hover:text-[var(--accent)] px-3 py-2 text-sm font-medium transition-colors">Settings</a>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isAuthenticated ? (
              <>
                <Link href="/dashboard" className="text-[var(--text-primary)] hover:text-[var(--accent)] px-4 py-2 text-sm font-medium transition-colors">
                  Sign In
                </Link>
                <Link href="/dashboard" className="bg-[var(--accent)] hover:opacity-90 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <button className="bg-[var(--accent)] hover:opacity-90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                  Create Will
                </button>
                <div className="relative">
                  <button className="flex items-center space-x-2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                    <div className="w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </>
            )}
            <ThemeToggle />
            <button className="md:hidden text-[var(--text-muted)] hover:text-[var(--accent)] px-2 py-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;