"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getAddress } from "viem";

import { ensureSepoliaNetwork, getEthereumProvider } from "@/lib/wallet/ethereum";

type JobLifecycleActionsProps = {
  job: {
    id: string;
    status: string;
  };
  contract: {
    id: string;
    status: string;
    clientWalletAddress?: string | null;
    freelancerWalletAddress?: string | null;
  } | null;
};

type ActionState =
  | { status: "idle" }
  | { status: "working"; label: string }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

export function JobLifecycleActions({ contract, job }: JobLifecycleActionsProps) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>({ status: "idle" });

  async function lockEscrow() {
    if (!contract) {
      return;
    }

    setState({ status: "working", label: "Locking escrow..." });

    try {
      const provider = getEthereumProvider();

      if (!provider) {
        throw new Error("Connect a wallet to lock escrow.");
      }

      const accounts = await provider.request<string[]>({
        method: "eth_requestAccounts",
      });
      const clientWalletAddress = accounts[0];

      if (!clientWalletAddress) {
        throw new Error("No wallet account selected.");
      }

      if (
        contract.clientWalletAddress &&
        getAddress(clientWalletAddress) !== getAddress(contract.clientWalletAddress)
      ) {
        throw new Error(
          `Connect the client wallet (${contract.clientWalletAddress}) that funded this escrow before locking it.`,
        );
      }

      const freelancerWalletAddress = window.prompt(
        "Freelancer wallet address on Sepolia.",
      )?.trim();

      if (!freelancerWalletAddress) {
        throw new Error("Enter the freelancer wallet address to lock escrow.");
      }

      const normalizedFreelancerWalletAddress = getAddress(freelancerWalletAddress);

      const bidAmountEth = window.prompt(
        "Accepted bid in ETH. Leave blank to use the full funded amount.",
      );
      const normalizedBidAmountEth = bidAmountEth?.trim() || undefined;

      await ensureSepoliaNetwork(provider);
      const prepared = await postJson(
        `/escrow-contracts/${contract.id}/onchain/prepare`,
        {
          action: "lock",
          freelancerId: "freelancer_123",
          freelancerWalletAddress: normalizedFreelancerWalletAddress,
          bidAmountEth: normalizedBidAmountEth,
        },
      );

      if (!isPreparedTransaction(prepared)) {
        throw new Error("Escrow lock could not be prepared.");
      }

      const transactionHash = await provider.request<string>({
        method: "eth_sendTransaction",
        params: [
          {
            from: clientWalletAddress,
            to: prepared.transaction.to,
            value: prepared.transaction.value ?? "0x0",
            data: prepared.transaction.data,
          },
        ],
      });

      await postJson(`/escrow-contracts/${contract.id}/onchain/confirm`, {
        action: "lock",
        transactionHash,
        freelancerId: "freelancer_123",
        freelancerWalletAddress: normalizedFreelancerWalletAddress,
        bidAmountEth: normalizedBidAmountEth,
      });

      setState({ status: "success", message: "Escrow locked for work." });
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Could not lock escrow.",
      });
    }
  }

  async function requestAiReview() {
    setState({ status: "working", label: "Running AI review..." });

    try {
      await postJson(`/jobs/${job.id}/request-ai-review`, {});
      setState({ status: "success", message: "AI review saved to the ledger." });
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Could not run AI review.",
      });
    }
  }

  async function releaseEscrow() {
    if (!contract) {
      return;
    }

    setState({ status: "working", label: "Releasing escrow..." });

    try {
      const provider = getEthereumProvider();

      if (!provider) {
        throw new Error("Connect a wallet to release escrow.");
      }

      const accounts = await provider.request<string[]>({
        method: "eth_requestAccounts",
      });
      const from = accounts[0];

      if (!from) {
        throw new Error("No wallet account selected.");
      }

      if (
        contract.clientWalletAddress &&
        getAddress(from) !== getAddress(contract.clientWalletAddress)
      ) {
        throw new Error(
          `Connect the client wallet (${contract.clientWalletAddress}) before releasing funds.`,
        );
      }

      await ensureSepoliaNetwork(provider);
      const prepared = await postJson(
        `/escrow-contracts/${contract.id}/onchain/prepare`,
        {
          action: "release",
        },
      );

      if (!isPreparedTransaction(prepared)) {
        throw new Error("Escrow release could not be prepared.");
      }

      const transactionHash = await provider.request<string>({
        method: "eth_sendTransaction",
        params: [
          {
            from,
            to: prepared.transaction.to,
            value: prepared.transaction.value ?? "0x0",
            data: prepared.transaction.data,
          },
        ],
      });

      await postJson(`/escrow-contracts/${contract.id}/onchain/confirm`, {
        action: "release",
        transactionHash,
      });

      setState({ status: "success", message: "Escrow released and job completed." });
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Could not release escrow.",
      });
    }
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {contract?.status === "pending" && (
        <Link
          className="inline-flex h-10 items-center rounded-[8px] bg-[var(--accent)] px-4 text-[12px] font-bold text-[var(--accent-contrast)]"
          href={`/fund-escrow?job=${encodeURIComponent(job.id)}&contract=${encodeURIComponent(
            contract.id,
          )}`}
        >
          Fund escrow
        </Link>
      )}

      {contract?.status === "funded" && (
        <button className={buttonClass} type="button" onClick={lockEscrow}>
          Accept + lock
        </button>
      )}

      {(contract?.status === "locked" || job.status === "in_progress") && (
        <Link className={buttonClass} href={`/submit-work?job=${job.id}`}>
          Submit work
        </Link>
      )}

      {job.status === "submitted" && (
        <button className={buttonClass} type="button" onClick={requestAiReview}>
          Run AI review
        </button>
      )}

      {(contract?.status === "release_requested" || job.status === "ai_reviewed") && (
        <button className={buttonClass} type="button" onClick={releaseEscrow}>
          Release funds
        </button>
      )}

      <Link className={secondaryClass} href={`/ai-review?job=${job.id}`}>
        Review context
      </Link>

      {state.status === "working" && (
        <span className="text-[12px] font-bold text-[var(--text-secondary)]">
          {state.label}
        </span>
      )}

      {(state.status === "error" || state.status === "success") && (
        <span className="text-[12px] font-bold text-[var(--text-secondary)]">
          {state.message}
        </span>
      )}
    </div>
  );
}

const buttonClass =
  "inline-flex h-10 items-center rounded-[8px] bg-[var(--accent)] px-4 text-[12px] font-bold text-[var(--accent-contrast)]";
const secondaryClass =
  "inline-flex h-10 items-center rounded-[8px] border border-[var(--border-strong)] px-4 text-[12px] font-bold text-[var(--text-primary)]";

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload;
}

function isPreparedTransaction(value: unknown): value is {
  transaction: { to: string; value?: string; data: string };
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "transaction" in value &&
    typeof (value as { transaction?: { to?: unknown; data?: unknown } }).transaction?.to ===
      "string" &&
    typeof (value as { transaction?: { to?: unknown; data?: unknown } }).transaction
      ?.data === "string"
  );
}
