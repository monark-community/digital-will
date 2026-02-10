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

/**
 * Get wallet balance in ETH for a specific address and chain
 */
export async function getWalletBalance(address: string, chainId?: string): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }

  try {
    const balance = await window.ethereum.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    });

    const balanceInEth = parseInt(balance, 16) / 1e18;
    return balanceInEth.toFixed(6);
  } catch (error: any) {
    console.error("Error getting wallet balance:", error);
    return "0";
  }
}

/**
 * Get current network chain ID
 */
export async function getCurrentChainId(): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }

  try {
    const chainId = await window.ethereum.request({
      method: "eth_chainId",
    });
    return chainId;
  } catch (error: any) {
    console.error("Error getting chain ID:", error);
    throw new Error("Failed to get chain ID");
  }
}

/**
 * Network configuration
 */
export const NETWORKS = {
  SEPOLIA: {
    chainId: "0xaa36a7",
    name: "Sepolia",
    symbol: "ETH",
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    iconBg: "from-purple-500 to-pink-600",
  },
  MAINNET: {
    chainId: "0x1",
    name: "Ethereum",
    symbol: "ETH",
    rpcUrl: "https://eth.llamarpc.com",
    iconBg: "from-blue-500 to-indigo-600",
  },
  BNB: {
    chainId: "0x38",
    name: "BNB Smart Chain",
    symbol: "BNB",
    rpcUrl: "https://bsc-dataseed.binance.org",
    iconBg: "from-yellow-500 to-orange-600",
  },
  AVAX: {
    chainId: "0xa86a",
    name: "Avalanche",
    symbol: "AVAX",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    iconBg: "from-red-500 to-pink-600",
  },
} as const;

/**
 * Get balance from a specific network using RPC
 */
async function getBalanceFromRPC(address: string, rpcUrl: string): Promise<string> {
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [address, "latest"],
        id: 1,
      }),
    });

    const data = await response.json();
    if (data.result) {
      const balanceInEth = parseInt(data.result, 16) / 1e18;
      return balanceInEth.toFixed(6);
    }
    return "0";
  } catch (error) {
    console.error(`Error fetching balance from ${rpcUrl}:`, error);
    return "0";
  }
}

/**
 * Get balances for a wallet on multiple networks
 */
export async function getMultiNetworkBalances(address: string): Promise<{
  sepolia: string;
  mainnet: string;
  bnb: string;
  avax: string;
  total: number;
  totalCAD: number;
}> {
  try {
    const [sepoliaBalance, mainnetBalance, bnbBalance, avaxBalance, prices] = await Promise.all([
      getBalanceFromRPC(address, NETWORKS.SEPOLIA.rpcUrl),
      getBalanceFromRPC(address, NETWORKS.MAINNET.rpcUrl),
      getBalanceFromRPC(address, NETWORKS.BNB.rpcUrl),
      getBalanceFromRPC(address, NETWORKS.AVAX.rpcUrl),
      getCryptoPrices(),
    ]);

    const total = parseFloat(sepoliaBalance) + parseFloat(mainnetBalance) + parseFloat(bnbBalance) + parseFloat(avaxBalance);
    // For testing purposes, let's assume that 1 sepolia ETH is worth the same as 1 mainnet ETH, even though in reality it has no value.
    const ethCAD = (parseFloat(sepoliaBalance) + parseFloat(mainnetBalance)) * prices.ethereum;
    const bnbCAD = parseFloat(bnbBalance) * prices.binancecoin;
    const avaxCAD = parseFloat(avaxBalance) * prices.avalanche;
    const totalCAD = ethCAD + bnbCAD + avaxCAD;

    return {
      sepolia: sepoliaBalance,
      mainnet: mainnetBalance,
      bnb: bnbBalance,
      avax: avaxBalance,
      total,
      totalCAD,
    };
  } catch (error: any) {
    console.error("Error getting multi-network balances:", error);
    return {
      sepolia: "0",
      mainnet: "0",
      bnb: "0",
      avax: "0",
      total: 0,
      totalCAD: 0,
    };
  }
}

/**
 * Get current cryptocurrency prices from CoinGecko in CAD
 */
async function getCryptoPrices(): Promise<{
  ethereum: number;
  binancecoin: number;
  avalanche: number;
}> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,binancecoin,avalanche-2&vs_currencies=cad"
    );
    
    const data = await response.json();
    
    return {
      ethereum: data.ethereum?.cad || 0,
      binancecoin: data.binancecoin?.cad || 0,
      avalanche: data["avalanche-2"]?.cad || 0,
    };
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
    // fallback prices in CAD if API fails
    return {
      ethereum: 2800,
      binancecoin: 855,
      avalanche: 12,
    };
  }
}
