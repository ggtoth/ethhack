"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getAddress } from "viem";

import {
  assertTransactionCanExecute,
  ensureSepoliaNetwork,
  getEthereumProvider,
  getWalletErrorMessage,
  waitForTransactionReceipt,
} from "@/lib/wallet/ethereum";

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
  onSuccess?: () => void;
};

type ActionState =
  | { status: "idle" }
  | { status: "working"; label: string }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

export function JobLifecycleActions({ contract, job, onSuccess }: JobLifecycleActionsProps) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>({ status: "idle" });

  async function lockEscrow() {
    if (!contract) {
      return;
    }

    setState({ status: "working", label: "Accepting job..." });

    try {
      const provider = getEthereumProvider();

      if (!provider) {
        throw new Error("Connect a wallet to accept this job.");
      }

      const accounts = await provider.request<string[]>({
        method: "eth_requestAccounts",
      });
      const freelancerWalletAddress = accounts[0];

      if (!freelancerWalletAddress) {
        throw new Error("No wallet account selected.");
      }

      if (
        contract.freelancerWalletAddress &&
        getAddress(freelancerWalletAddress) !== getAddress(contract.freelancerWalletAddress)
      ) {
        throw new Error(
          `Connect the accepted freelancer wallet (${contract.freelancerWalletAddress}) before continuing.`,
        );
      }
      const normalizedFreelancerWalletAddress = getAddress(freelancerWalletAddress);

      await ensureSepoliaNetwork(provider);
      const prepared = await postJson(
        `/escrow-contracts/${contract.id}/onchain/prepare`,
        {
          action: "lock",
          freelancerWalletAddress: normalizedFreelancerWalletAddress,
        },
      );

      if (!isPreparedTransaction(prepared)) {
        throw new Error("Escrow lock could not be prepared.");
      }

      const transaction = {
        from: freelancerWalletAddress,
        to: prepared.transaction.to,
        value: prepared.transaction.value ?? "0x0",
        data: prepared.transaction.data,
      };

      await assertTransactionCanExecute(
        provider,
        transaction,
        "Escrow lock would fail on-chain.",
      );

      const transactionHash = await provider.request<string>({
        method: "eth_sendTransaction",
        params: [transaction],
      });

      setState({ status: "working", label: "Waiting for confirmation..." });
      await waitForTransactionReceipt(provider, transactionHash);

      await postJson(`/escrow-contracts/${contract.id}/onchain/confirm`, {
        action: "lock",
        transactionHash,
        freelancerWalletAddress: normalizedFreelancerWalletAddress,
      });

      setState({ status: "success", message: "Job accepted and escrow locked to your wallet." });
      onSuccess?.();
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: getWalletErrorMessage(error, "Could not lock escrow."),
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

      const transaction = {
        from,
        to: prepared.transaction.to,
        value: prepared.transaction.value ?? "0x0",
        data: prepared.transaction.data,
      };

      await assertTransactionCanExecute(
        provider,
        transaction,
        "Escrow release would fail on-chain.",
      );

      const transactionHash = await provider.request<string>({
        method: "eth_sendTransaction",
        params: [transaction],
      });

      setState({ status: "working", label: "Waiting for confirmation..." });
      await waitForTransactionReceipt(provider, transactionHash);

      await postJson(`/escrow-contracts/${contract.id}/onchain/confirm`, {
        action: "release",
        transactionHash,
      });

      setState({ status: "success", message: "Escrow released and job completed." });
      onSuccess?.();
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: getWalletErrorMessage(error, "Could not release escrow."),
      });
    }
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {contract?.status === "pending" && (
        <Link
          className={buttonClass}
          href={`/fund-escrow?job=${encodeURIComponent(job.id)}&contract=${encodeURIComponent(
            contract.id,
          )}`}
        >
          Add payment
        </Link>
      )}

      {contract?.status === "funded" && (
        <button className={buttonClass} type="button" onClick={lockEscrow}>
          Accept work
        </button>
      )}

      {(contract?.status === "locked" || job.status === "in_progress") && (
        <Link className={buttonClass} href={`/submit-work?job=${job.id}`}>
          Submit delivery
        </Link>
      )}

      {(contract?.status === "release_requested" || job.status === "ai_reviewed") && (
        <button className={buttonClass} type="button" onClick={releaseEscrow}>
          Approve payout
        </button>
      )}

      <Link className={secondaryClass} href={`/ai-review?job=${job.id}`}>
        View files
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
