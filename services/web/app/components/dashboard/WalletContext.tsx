'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useWallets } from '@/lib/hooks';
import type { Wallet } from '@/lib/types';

interface WalletContextType {
  selectedWallet: Wallet | null;
  setSelectedWallet: (wallet: Wallet | null) => void;
  wallets: Wallet[] | undefined;
  isLoading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { data: wallets, isLoading } = useWallets();
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    if (!wallets || wallets.length === 0) {
      setSelectedWallet(null);
      return;
    }
    if (!selectedWallet || !wallets.find(w => w.walletId === selectedWallet.walletId)) {
      setSelectedWallet(wallets[0]);
    }
  }, [wallets, selectedWallet]);

  return (
    <WalletContext.Provider value={{ selectedWallet, setSelectedWallet, wallets, isLoading }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}
