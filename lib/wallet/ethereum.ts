export const SEPOLIA_CHAIN_ID = "0xaa36a7";
export const SEPOLIA_CHAIN_ID_DECIMAL = 11155111;

export const SEPOLIA_PARAMS = {
  chainId: SEPOLIA_CHAIN_ID,
  chainName: "Sepolia",
  nativeCurrency: {
    name: "Sepolia ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.sepolia.org"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

export type EthereumProvider = {
  isMetaMask?: boolean;
  isPhantom?: boolean;
  request: <T = unknown>(args: { method: string; params?: unknown[] }) => Promise<T>;
  on?: (
    event: "accountsChanged" | "chainChanged",
    handler: (...args: unknown[]) => void,
  ) => void;
  removeListener?: (
    event: "accountsChanged" | "chainChanged",
    handler: (...args: unknown[]) => void,
  ) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    phantom?: {
      ethereum?: EthereumProvider;
    };
  }
}

export function getEthereumProvider() {
  if (typeof window === "undefined") {
    return null;
  }

  if (window.ethereum?.isMetaMask) {
    return window.ethereum;
  }

  return window.ethereum ?? window.phantom?.ethereum ?? null;
}

export function getWalletName(provider: EthereumProvider | null) {
  if (provider?.isMetaMask) {
    return "MetaMask";
  }

  if (provider?.isPhantom) {
    return "Phantom";
  }

  return provider ? "wallet" : "wallet";
}

export async function ensureSepoliaNetwork(provider: EthereumProvider) {
  const activeChainId = await provider.request<string>({ method: "eth_chainId" });

  if (activeChainId === SEPOLIA_CHAIN_ID) {
    return;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
  } catch (switchError) {
    const code =
      typeof switchError === "object" && switchError && "code" in switchError
        ? Number((switchError as { code: unknown }).code)
        : 0;

    if (code !== 4902) {
      throw switchError;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [SEPOLIA_PARAMS],
    });
  }
}
