"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  ensureSepoliaNetwork,
  getEthereumProvider,
  SEPOLIA_CHAIN_ID_DECIMAL,
  type EthereumProvider,
} from "@/lib/wallet/ethereum";

type JobRecord = {
  job: {
    id: string;
    contractId: string;
    title: string;
    description: string;
    budget: number;
    deadline: string;
    requirements: string;
    status: string;
  };
  contract: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    chainId: number | null;
    escrowAddress: string | null;
    fundingTransactionHash: string | null;
  };
};

type PreparedFunding = {
  jobId: string;
  contractId: string;
  transaction: {
    chainId: number;
    chainIdHex: string;
    to: string;
    value?: string;
    data: string;
    contractAddress: string;
  };
  confirmation: {
    href: string;
    body: {
      id: string;
      contractId: string;
      amountEth: string;
    };
  };
};

type FundingState =
  | { status: "loading" }
  | { status: "idle" }
  | { status: "confirming" }
  | { status: "confirming-ledger"; txHash: string }
  | { status: "funded"; txHash: string }
  | { status: "error"; message: string };

export function UsdtPaymentCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job")?.trim() || "";
  const contractId = searchParams.get("contract")?.trim() || "";
  const [record, setRecord] = useState<JobRecord | null>(null);
  const [state, setState] = useState<FundingState>({ status: "loading" });

  const amountEth = useMemo(() => {
    const amount = record?.contract.amount ?? 0;

    return amount > 0 ? String(amount) : "0";
  }, [record?.contract.amount]);

  useEffect(() => {
    let active = true;

    async function loadRecord() {
      if (!jobId) {
        setState({
          status: "error",
          message: "Create a job first so funding knows which escrow to use.",
        });
        return;
      }

      setState({ status: "loading" });

      try {
        const response = await fetch(`/jobs/${encodeURIComponent(jobId)}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as JobRecord | { error?: string };

        if (!response.ok || !("job" in payload)) {
          throw new Error(
            "error" in payload && payload.error ? payload.error : "Job not found.",
          );
        }

        if (!active) {
          return;
        }

        setRecord(payload);
        setState(
          payload.contract.status === "funded"
            ? {
                status: "funded",
                txHash: payload.contract.fundingTransactionHash ?? "",
              }
            : { status: "idle" },
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Could not load job.",
        });
      }
    }

    void loadRecord();

    return () => {
      active = false;
    };
  }, [jobId]);

  async function fundEscrow() {
    if (!record || state.status === "confirming" || state.status === "confirming-ledger") {
      return;
    }

    const provider = getEthereumProvider();

    if (!provider) {
      setState({ status: "error", message: "Install MetaMask or Phantom to fund escrow." });
      return;
    }

    setState({ status: "confirming" });

    try {
      const accounts = await provider.request<string[]>({
        method: "eth_requestAccounts",
      });
      const from = accounts[0];

      if (!from) {
        throw new Error("No wallet account selected.");
      }

      await ensureSepoliaNetwork(provider);

      const prepared = await prepareFunding(record);
      const txHash = await sendPreparedTransaction(provider, from, prepared);

      setState({ status: "confirming-ledger", txHash });

      const confirmed = await confirmFunding(prepared, record, from, txHash);
      setRecord(confirmed);
      setState({ status: "funded", txHash });
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Funding was rejected or could not be confirmed.",
      });
    }
  }

  const txHash =
    state.status === "funded" || state.status === "confirming-ledger"
      ? state.txHash
      : record?.contract.fundingTransactionHash ?? "";
  const funded = record?.contract.status === "funded" || state.status === "funded";

  return (
    <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
            Escrow payment
          </p>
          <h1 className="mt-2 text-[34px] font-black leading-none text-[var(--text-primary)]">
            Fund
            <br />
            escrow
          </h1>
        </div>
        <div className="rounded-[12px] bg-[var(--text-primary)] px-4 py-3 text-[var(--background)]">
          <p className="text-[11px] font-black uppercase opacity-65">Amount</p>
          <p className="mt-1 text-[24px] font-black leading-none">
            {amountEth} ETH
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
        <section className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
          <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
            Ledger-backed details
          </p>
          <div className="mt-4 grid gap-3 text-[13px]">
            <Detail label="Job" value={record?.job.title ?? "Loading job..."} />
            <Detail label="Job ID" value={record?.job.id ?? (jobId || "-")} />
            <Detail
              label="Contract ID"
              value={record?.contract.id ?? (contractId || "-")}
            />
            <Detail label="Network" value="Sepolia" />
            <Detail
              label="Escrow contract"
              value={record?.contract.escrowAddress ?? "Prepared by backend"}
            />
            <Detail
              label="Escrow state"
              value={record?.contract.status.replaceAll("_", " ") ?? "-"}
            />
          </div>
        </section>

        <aside className="grid content-start gap-4">
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
              Status
            </p>

            {state.status === "loading" && (
              <p className="mt-3 text-[20px] font-black text-[var(--text-primary)]">
                Loading
              </p>
            )}

            {(state.status === "idle" || state.status === "confirming") && (
              <>
                <p className="mt-3 text-[20px] font-black text-[var(--text-primary)]">
                  {state.status === "confirming" ? "Confirming" : "Ready"}
                </p>
                <p className="mt-2 text-[12px] leading-5 text-[var(--text-secondary)]">
                  Your wallet will send the blockchain transaction. The backend only
                  prepares metadata and records the confirmed tx hash.
                </p>
              </>
            )}

            {state.status === "confirming-ledger" && (
              <div className="mt-4 flex items-center gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--text-primary)]" />
                <span className="text-[12px] font-black text-[var(--text-primary)]">
                  Recording tx...
                </span>
              </div>
            )}

            {funded && (
              <div className="mt-4 rounded-[12px] border border-[var(--border-strong)] bg-[var(--success-bg)] p-3">
                <p className="text-[12px] font-black uppercase text-[var(--success)]">
                  Funded
                </p>
                <p className="mt-2 text-[13px] font-black text-[var(--text-primary)]">
                  Escrow is funded in the workflow ledger.
                </p>
              </div>
            )}

            {state.status === "error" && (
              <p className="mt-4 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-[12px] font-black text-[var(--text-primary)]">
                {state.message}
              </p>
            )}

            {txHash && (
              <p className="mt-3 break-all text-[11px] text-[var(--text-muted)]">
                Tx: {txHash}
              </p>
            )}

            {record?.contract.chainId && (
              <p className="mt-3 text-[11px] text-[var(--text-muted)]">
                Chain: {record.contract.chainId}
              </p>
            )}
          </div>

          {!funded ? (
            <button
              className="h-11 rounded-[12px] bg-[var(--button)] px-6 text-[13px] font-black text-[var(--button-text)] disabled:opacity-50"
              disabled={
                !record ||
                state.status === "loading" ||
                state.status === "confirming" ||
                state.status === "confirming-ledger"
              }
              type="button"
              onClick={fundEscrow}
            >
              {state.status === "confirming"
                ? "Confirm in wallet..."
                : state.status === "confirming-ledger"
                  ? "Recording..."
                  : "Fund with wallet"}
            </button>
          ) : (
            <Link
              className="inline-flex h-11 items-center justify-center rounded-[12px] bg-[var(--button)] px-6 text-[13px] font-black text-[var(--button-text)]"
              href="/my-jobs"
            >
              Track funded job
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="break-all text-right font-black text-[var(--text-primary)]">
        {value}
      </span>
    </div>
  );
}

async function prepareFunding(record: JobRecord) {
  const response = await fetch("/escrow-contracts/onchain/fund/prepare", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jobId: record.job.id,
      contractId: record.contract.id,
      amountEth: String(record.contract.amount),
    }),
  });
  const payload = (await response.json()) as PreparedFunding | { error?: string };

  if (!response.ok || !("transaction" in payload)) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "Could not prepare funding transaction.",
    );
  }

  return payload;
}

async function sendPreparedTransaction(
  provider: EthereumProvider,
  from: string,
  prepared: PreparedFunding,
) {
  return provider.request<string>({
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
}

async function confirmFunding(
  prepared: PreparedFunding,
  record: JobRecord,
  clientWalletAddress: string,
  transactionHash: string,
) {
  const response = await fetch(prepared.confirmation.href, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      ...prepared.confirmation.body,
      title: record.job.title,
      description: record.job.description,
      budget: record.job.budget,
      deadline: record.job.deadline,
      requirements: record.job.requirements,
      status: record.job.status,
      transactionHash,
      clientWalletAddress,
      escrowAddress: prepared.transaction.contractAddress,
      chainId: SEPOLIA_CHAIN_ID_DECIMAL,
      escrow: {
        amount: record.contract.amount,
        currency: record.contract.currency,
      },
    }),
  });
  const payload = (await response.json()) as
    | (JobRecord["job"] & { contract: JobRecord["contract"] })
    | { error?: string };

  if (!response.ok || !("contract" in payload)) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "Could not confirm funding.",
    );
  }

  return {
    job: {
      id: payload.id,
      contractId: payload.contractId,
      title: payload.title,
      description: payload.description,
      budget: payload.budget,
      deadline: payload.deadline,
      requirements: payload.requirements,
      status: payload.status,
    },
    contract: payload.contract,
  };
}
