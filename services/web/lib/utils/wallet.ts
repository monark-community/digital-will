/**
 * MetaMask wallet utilities
 */

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletConnectionResult {
  address: string;
  chainId: string;
  signature: string;
  message: string;
}

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
}

/**
 * Generate authentication message for wallet signing
 */
export function generateAuthMessage(address: string): string {
  const timestamp = new Date().toISOString();
  return `Welcome to WillChain!\n\nPlease sign this message to authenticate your wallet.\n\nWallet: ${address}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
}

/**
 * Request user to sign a message with their wallet
 */
export async function signMessage(address: string, message: string): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed.");
  }

  try {
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [message, address],
    });

    return signature;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error("User rejected the signature request");
    }
    throw new Error("Failed to sign message: " + (error.message || "Unknown error"));
  }
}

/**
 * Request MetaMask connection and get wallet address with signature
 * This properly authenticates the user by requiring them to sign a message
 * Always prompts user to select an account, even if previously connected
 */
export async function connectWallet(): Promise<WalletConnectionResult> {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });

    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please unlock MetaMask and select an account.");
    }

    if (accounts.length > 1) {
      throw new Error("Please select only one account to connect.");
    }

    const address = accounts[0];

    const chainId = await window.ethereum.request({
      method: "eth_chainId",
    });

    const message = generateAuthMessage(address);

    const signature = await signMessage(address, message);

    return {
      address,
      chainId,
      signature,
      message,
    };
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error("User rejected the connection request");
    }
    throw error;
  }
}

/**
 * Get current connected wallet address (if already connected)
 */
export async function getConnectedWallet(): Promise<string | null> {
  if (!isMetaMaskInstalled()) {
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });

    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error("Error getting connected wallet:", error);
    return null;
  }
}

/**
 * Listen for account changes
 */
export function onAccountsChanged(callback: (accounts: string[]) => void): () => void {
  if (!isMetaMaskInstalled()) {
    return () => {};
  }

  const handleAccountsChanged = (accounts: string[]) => {
    callback(accounts);
  };

  window.ethereum.on("accountsChanged", handleAccountsChanged);

  // Return cleanup function
  return () => {
    window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
  };
}

/**
 * Listen for chain changes
 */
export function onChainChanged(callback: (chainId: string) => void): () => void {
  if (!isMetaMaskInstalled()) {
    return () => {};
  }

  const handleChainChanged = (chainId: string) => {
    callback(chainId);
  };

  window.ethereum.on("chainChanged", handleChainChanged);

  return () => {
    window.ethereum.removeListener("chainChanged", handleChainChanged);
  };
}
