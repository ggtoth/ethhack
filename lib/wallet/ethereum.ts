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

export type WalletTransactionRequest = {
  from: string;
  to: string;
  value?: string;
  data?: string;
};

export type WalletTransactionReceipt = {
  transactionHash: string;
  status?: string;
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

export async function assertTransactionCanExecute(
  provider: EthereumProvider,
  transaction: WalletTransactionRequest,
  fallbackMessage: string,
) {
  try {
    await provider.request({
      method: "eth_call",
      params: [transaction, "latest"],
    });
  } catch (error) {
    throw new Error(getWalletErrorMessage(error, fallbackMessage));
  }
}

export async function waitForTransactionReceipt(
  provider: EthereumProvider,
  transactionHash: string,
  options: { timeoutMs?: number; pollMs?: number } = {},
): Promise<WalletTransactionReceipt> {
  const timeoutMs = options.timeoutMs ?? 120_000;
  const pollMs = options.pollMs ?? 2_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const receipt = await provider.request<WalletTransactionReceipt | null>({
      method: "eth_getTransactionReceipt",
      params: [transactionHash],
    });

    if (receipt) {
      if (receipt.status && receipt.status !== "0x1") {
        throw new Error("Transaction was mined but failed on-chain. The local escrow state was not updated.");
      }

      return receipt;
    }

    await sleep(pollMs);
  }

  throw new Error("Transaction was submitted, but no receipt was found before timeout. Wait a moment and refresh.");
}

export function getWalletErrorMessage(error: unknown, fallbackMessage: string) {
  const code = getErrorCode(error);
  const message = getNestedMessage(error);

  if (code === 4001) {
    return "Transaction was rejected in the wallet.";
  }

  if (message) {
    const lower = message.toLowerCase();

    if (
      lower.includes("insufficient funds") ||
      lower.includes("exceeds the balance") ||
      lower.includes("not enough funds")
    ) {
      return "This wallet does not have enough SepoliaETH for the transaction and gas.";
    }

    if (
      lower.includes("execution reverted") ||
      lower.includes("gas required exceeds allowance") ||
      lower.includes("cannot estimate gas") ||
      lower.includes("estimate gas")
    ) {
      return "The escrow contract would reject this transaction. Refresh the page; if it still appears funded, create and fund a new escrow because the local ledger may be ahead of the chain.";
    }

    return message;
  }

  return fallbackMessage;
}

function getErrorCode(error: unknown) {
  if (typeof error === "object" && error && "code" in error) {
    return Number((error as { code: unknown }).code);
  }

  return 0;
}

function getNestedMessage(error: unknown): string | null {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error !== "object" || !error) {
    return null;
  }

  const value = error as {
    message?: unknown;
    reason?: unknown;
    data?: { message?: unknown; originalError?: { message?: unknown } };
  };

  if (typeof value.message === "string" && value.message.trim()) {
    return value.message;
  }

  if (typeof value.reason === "string" && value.reason.trim()) {
    return value.reason;
  }

  if (typeof value.data?.message === "string" && value.data.message.trim()) {
    return value.data.message;
  }

  if (
    typeof value.data?.originalError?.message === "string" &&
    value.data.originalError.message.trim()
  ) {
    return value.data.originalError.message;
  }

  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
