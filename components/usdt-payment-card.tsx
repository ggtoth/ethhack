"use client";

import Link from "next/link";
import { useState } from "react";

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
const escrowAddress = "0x1111111111111111111111111111111111111111";
const usdtContractAddress = process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS ?? "";
const testEthValueWei = BigInt("10000000000000");
const testEthValueHex = `0x${testEthValueWei.toString(16)}`;

type EthereumProvider = {
  request: <T = unknown>(args: { method: string; params?: unknown[] }) => Promise<T>;
};

function encodeErc20Transfer(to: string, amountUnits: bigint) {
  const method = "a9059cbb";
  const address = to.replace("0x", "").padStart(64, "0");
  const amount = amountUnits.toString(16).padStart(64, "0");

  return `0x${method}${address}${amount}`;
}

async function ensureSepolia(provider: EthereumProvider) {
  const activeChainId = await provider.request<string>({ method: "eth_chainId" });

  if (activeChainId === SEPOLIA_CHAIN_ID) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
  } catch (switchError) {
    const code = typeof switchError === "object" && switchError && "code" in switchError
      ? Number((switchError as { code: unknown }).code)
      : 0;

    if (code !== 4902) throw switchError;

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [SEPOLIA_PARAMS],
    });
  }
}

export function UsdtPaymentCard() {
  const [status, setStatus] = useState<"idle" | "confirming" | "processing" | "paid">("idle");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  async function pay() {
    setError("");
    const provider = (window as Window & { ethereum?: EthereumProvider }).ethereum;

    if (!provider) {
      setError("MetaMask is not installed.");
      return;
    }

    setStatus("confirming");

    try {
      const accounts = await provider.request<string[]>({
        method: "eth_requestAccounts",
      });
      const from = accounts[0];

      if (!from) {
        throw new Error("No wallet account selected.");
      }

      await ensureSepolia(provider);

      const transaction = usdtContractAddress
        ? {
            from,
            to: usdtContractAddress,
            value: "0x0",
            data: encodeErc20Transfer(escrowAddress, BigInt("1500000000")),
          }
        : {
            from,
            to: escrowAddress,
            value: testEthValueHex,
          };

      const hash = await provider.request<string>({
        method: "eth_sendTransaction",
        params: [transaction],
      });

      setTxHash(hash);
      setStatus("processing");
      window.setTimeout(() => setStatus("paid"), 1800);
    } catch {
      setStatus("idle");
      setError("Payment was rejected or failed.");
    }
  }

  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
            Escrow payment
          </p>
          <h1 className="mt-2 text-[34px] font-black leading-none text-[var(--text-primary)]">
            Fund with
            <br />
            USDT
          </h1>
        </div>
        <div className="rounded-[12px] bg-[var(--text-primary)] px-4 py-3 text-[var(--background)]">
          <p className="text-[11px] font-black uppercase opacity-65">Amount</p>
          <p className="mt-1 text-[24px] font-black leading-none">1,500 USDT</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
        <section className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
          <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
            Payment details
          </p>
          <div className="mt-4 grid gap-3 text-[13px]">
            {[
              ["Token", usdtContractAddress ? "USDT" : "SepoliaETH test"],
              ["Network", "Sepolia"],
              ["Escrow", "0x1111...1111"],
              ["Job", "Landing page for my product"],
            ].map(([label, value]) => (
              <div
                className="flex items-center justify-between gap-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                key={label}
              >
                <span className="text-[var(--text-muted)]">{label}</span>
                <span className="break-all text-right font-black text-[var(--text-primary)]">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <aside className="grid content-start gap-4">
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
              Status
            </p>
            {status === "processing" && (
              <div className="mt-4 flex items-center gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--text-primary)]" />
                <span className="text-[12px] font-black text-[var(--text-primary)]">
                  Checking payment...
                </span>
              </div>
            )}

            {status === "paid" && (
              <div className="mt-4 rounded-[12px] border border-[var(--border-strong)] bg-[var(--success-bg)] p-3">
                <p className="text-[12px] font-black uppercase text-[var(--success)]">
                  Funded
                </p>
                <p className="mt-2 text-[13px] font-black text-[var(--text-primary)]">
                  Escrow payment received.
                </p>
              </div>
            )}

            {status !== "paid" && status !== "processing" && (
              <>
                <p className="mt-3 text-[20px] font-black text-[var(--text-primary)]">
                  {status === "confirming" ? "Confirming" : "Ready"}
                </p>
                <p className="mt-2 text-[12px] leading-5 text-[var(--text-secondary)]">
                  MetaMask will open on Sepolia.
                </p>
              </>
            )}
            {!usdtContractAddress && (
              <p className="mt-3 text-[11px] leading-5 text-[var(--text-muted)]">
                Demo mode: MetaMask sends 0.00001 SepoliaETH to a demo escrow address. Set
                NEXT_PUBLIC_USDT_CONTRACT_ADDRESS for real ERC-20 USDT transfer.
              </p>
            )}
            {txHash && (
              <p className="mt-3 break-all text-[11px] text-[var(--text-muted)]">
                Tx: {txHash}
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-[12px] font-black text-[var(--text-primary)]">
              {error}
            </p>
          )}

          {status !== "paid" ? (
            <button
              className="h-11 rounded-[12px] bg-[var(--button)] px-6 text-[13px] font-black text-[var(--button-text)] disabled:opacity-50"
              disabled={status === "confirming" || status === "processing"}
              type="button"
              onClick={pay}
            >
              {status === "processing"
                ? "Checking..."
                : status === "confirming"
                ? "Confirming..."
                : usdtContractAddress
                  ? "Pay 1,500 USDT"
                  : "Send test payment"}
            </button>
          ) : (
            <Link
              className="inline-flex h-11 items-center justify-center rounded-[12px] bg-[var(--button)] px-6 text-[13px] font-black text-[var(--button-text)]"
              href="/jobs/landing-page-implementation"
            >
              Open funded job
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
