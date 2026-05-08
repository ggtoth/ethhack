"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const SEPOLIA_CHAIN_ID = "0xaa36a7";
const SEPOLIA_PARAMS = {
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

type EthereumProvider = {
  isMetaMask?: boolean;
  request: <T = unknown>(args: { method: string; params?: unknown[] }) => Promise<T>;
  on?: (event: "accountsChanged" | "chainChanged", handler: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: "accountsChanged" | "chainChanged",
    handler: (...args: unknown[]) => void,
  ) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatEth(hexWei: string) {
  const wei = BigInt(hexWei);
  const ethUnit = BigInt("1000000000000000000");
  const whole = wei / ethUnit;
  const fraction = (wei % ethUnit).toString().padStart(18, "0").slice(0, 4);

  return `${whole}.${fraction} ETH`;
}

export function WalletConnectCard() {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState("");
  const [balance, setBalance] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const hasMetaMask = typeof window !== "undefined" && Boolean(window.ethereum?.isMetaMask);
  const connected = Boolean(account);
  const onSepolia = chainId === SEPOLIA_CHAIN_ID;

  const status = useMemo(() => {
    if (!hasMetaMask) return "MetaMask missing";
    if (!connected) return "Not connected";
    if (!onSepolia) return "Wrong network";
    return "Connected";
  }, [connected, hasMetaMask, onSepolia]);

  const readWallet = useCallback(async () => {
    if (!window.ethereum) return;

    const [accounts, activeChainId] = await Promise.all([
      window.ethereum.request<string[]>({ method: "eth_accounts" }),
      window.ethereum.request<string>({ method: "eth_chainId" }),
    ]);

    const nextAccount = accounts[0] ?? "";
    setAccount(nextAccount);
    setChainId(activeChainId);

    if (nextAccount) {
      const hexBalance = await window.ethereum.request<string>({
        method: "eth_getBalance",
        params: [nextAccount, "latest"],
      });
      setBalance(formatEth(hexBalance));
    } else {
      setBalance("");
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    void readWallet();

    const handleAccountsChanged = () => void readWallet();
    const handleChainChanged = () => void readWallet();

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [readWallet]);

  async function connect() {
    setError("");

    if (!window.ethereum) {
      setError("Install MetaMask to continue.");
      return;
    }

    setBusy(true);
    try {
      await window.ethereum.request<string[]>({ method: "eth_requestAccounts" });
      await readWallet();
    } catch {
      setError("Connection rejected.");
    } finally {
      setBusy(false);
    }
  }

  async function switchToSepolia() {
    setError("");

    if (!window.ethereum) {
      setError("Install MetaMask to continue.");
      return;
    }

    setBusy(true);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      await readWallet();
    } catch (switchError) {
      const code = typeof switchError === "object" && switchError && "code" in switchError
        ? Number((switchError as { code: unknown }).code)
        : 0;

      if (code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [SEPOLIA_PARAMS],
          });
          await readWallet();
        } catch {
          setError("Could not add Sepolia.");
        }
      } else {
        setError("Network switch rejected.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-8">
      <p className="text-[13px] font-black uppercase text-[var(--text-muted)]">Wallet login</p>
      <h1 className="mt-3 text-[42px] font-black leading-none sm:text-[62px]">
        Connect
        <br />
        MetaMask
      </h1>

      <div className="mt-8 grid gap-3 rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] text-[var(--text-muted)]">Status</span>
          <span
            className={`text-right text-[14px] font-black ${
              connected && onSepolia ? "text-[var(--success)]" : "text-[var(--text-primary)]"
            }`}
          >
            {status}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] text-[var(--text-muted)]">Wallet</span>
          <span className="break-all text-right text-[14px] font-black">
            {account ? shortAddress(account) : "-"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] text-[var(--text-muted)]">Network</span>
          <span className="text-right text-[14px] font-black">
            {chainId === SEPOLIA_CHAIN_ID ? "Sepolia" : chainId || "-"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] text-[var(--text-muted)]">Balance</span>
          <span className="text-right text-[14px] font-black">{balance || "-"}</span>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-4 py-3 text-[13px] font-black text-[var(--text-primary)]">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {!connected && (
          <button
            className="inline-flex h-[50px] items-center justify-center rounded-[10px] bg-[var(--button)] px-6 text-[15px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
            disabled={busy}
            type="button"
            onClick={connect}
          >
            {busy ? "Connecting..." : "Connect wallet"}
          </button>
        )}

        {connected && !onSepolia && (
          <button
            className="inline-flex h-[50px] items-center justify-center rounded-[10px] bg-[var(--button)] px-6 text-[15px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
            disabled={busy}
            type="button"
            onClick={switchToSepolia}
          >
            {busy ? "Switching..." : "Switch to Sepolia"}
          </button>
        )}

        {connected && onSepolia && (
          <Link
            className="inline-flex h-[50px] items-center justify-center rounded-[10px] bg-[var(--button)] px-6 text-[15px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)]"
            href="/post-job"
          >
            Create job
          </Link>
        )}
      </div>
    </div>
  );
}
