"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  ensureSepoliaNetwork,
  getEthereumProvider,
  SEPOLIA_CHAIN_ID_DECIMAL,
  type EthereumProvider,
} from "@/lib/wallet/ethereum";

const ETH_USD_RATE = 3500;
const gasEstimate = "< 0.0001 SepoliaETH";

type CreateState =
  | { status: "idle" }
  | { status: "creating" }
  | { status: "confirming_wallet" }
  | { status: "recording_ledger"; txHash: string }
  | { status: "funded"; jobId: string; txHash: string }
  | { status: "error"; message: string };

type CreatedJobPayload = {
  id: string;
  contractId: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  requirements: string;
  status: string;
  contract: {
    id: string;
    amount: number;
    currency: string;
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

export function CreateJobForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [budgetUsd, setBudgetUsd] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [state, setState] = useState<CreateState>({ status: "idle" });
  const budgetDisplay = budgetUsd.trim() ? Number(budgetUsd).toLocaleString("en-US") : "0";

  const budgetEth = useMemo(() => {
    const parsedBudget = Number(budgetUsd);

    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      return "0.0000";
    }

    return (parsedBudget / ETH_USD_RATE).toFixed(4);
  }, [budgetUsd]);

  const ready = title.trim() && details.trim() && budgetUsd.trim();
  const inputClass =
    "w-full rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-[14px] font-black text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] placeholder:opacity-60 focus:border-[var(--text-primary)]";

  async function createAndFund() {
    if (
      !ready ||
      state.status === "creating" ||
      state.status === "confirming_wallet" ||
      state.status === "recording_ledger"
    ) {
      return;
    }

    setState({ status: "creating" });

    try {
      const budget = Number(budgetUsd);

      if (!Number.isFinite(budget) || budget <= 0) {
        throw new Error("Enter a valid budget before continuing.");
      }

      const response = await fetch("/jobs", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: details.trim(),
          requirements: details.trim(),
          budget: Number(budgetEth),
          sourceFiles: attachedFiles.map((file, index) => ({
            id: `source_${index + 1}_${file.lastModified}`,
            url: `smartjobs-upload://${encodeURIComponent(file.name)}`,
            filename: file.name,
          })),
        }),
      });
      const payload = (await response.json()) as
        | CreatedJobPayload
        | { error?: string };

      if (!response.ok || !isCreatedJobPayload(payload)) {
        throw new Error(
          "error" in payload && payload.error ? payload.error : "Could not create the job.",
        );
      }

      const provider = getEthereumProvider();

      if (!provider) {
        throw new Error("Connect a wallet to fund escrow.");
      }

      setState({ status: "confirming_wallet" });

      const accounts = await provider.request<string[]>({
        method: "eth_requestAccounts",
      });
      const from = accounts[0];

      if (!from) {
        throw new Error("No wallet account selected.");
      }

      await ensureSepoliaNetwork(provider);

      const prepared = await prepareFunding(payload);
      const txHash = await sendPreparedTransaction(provider, from, prepared);

      setState({ status: "recording_ledger", txHash });

      await confirmFunding(prepared, payload, from, txHash);
      setState({ status: "funded", jobId: payload.id, txHash });
      router.push(`/my-jobs?job=${encodeURIComponent(payload.id)}`);
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not create and fund the job.",
      });
    }
  }

  return (
    <div className="col-span-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">New job</p>
          <h1 className="mt-2 text-[30px] font-black leading-none text-[var(--text-primary)]">
            Create escrow
          </h1>
        </div>
        <div className="rounded-[12px] bg-[var(--text-primary)] px-4 py-3 text-[var(--background)]">
          <p className="text-[11px] font-black uppercase opacity-65">Maximum budget</p>
          <p className="mt-1 text-[22px] font-black leading-none">${budgetDisplay}</p>
          <p className="mt-1 text-[11px] font-black opacity-65">{budgetEth} ETH target</p>
        </div>
      </div>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="grid gap-4">
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
              Describe the job
            </p>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2">
                <span className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                  Title
                </span>
                <input
                  className={inputClass}
                  placeholder="Landing page for my product"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                  Brief
                </span>
                <textarea
                  className={`${inputClass} min-h-[130px] resize-none leading-6`}
                  placeholder={"Responsive page\nDeployed preview\nSource link"}
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
              Reference files
            </p>
            <label className="mt-4 grid cursor-pointer gap-2 rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-5 text-center transition hover:border-[var(--text-primary)]">
              <input
                accept="image/*,.pdf,application/pdf,.zip,.rar,.7z,.tar,.gz,.fig,.doc,.docx,.txt,.md"
                className="sr-only"
                multiple
                type="file"
                onChange={(event) => setAttachedFiles(Array.from(event.target.files ?? []))}
              />
              <span className="text-[13px] font-black text-[var(--text-primary)]">
                {attachedFiles.length > 0
                  ? `${attachedFiles.length} files selected`
                  : "Upload files or archive"}
              </span>
              <span className="text-[11px] font-black text-[var(--text-muted)]">
                PDF, images, ZIP, RAR, 7Z, docs
              </span>
            </label>
            {attachedFiles.length > 0 && (
              <div className="mt-3 grid gap-2">
                {attachedFiles.map((file) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-[10px] bg-[var(--surface)] px-3 py-2 text-[12px]"
                    key={`${file.name}-${file.lastModified}`}
                  >
                    <span className="min-w-0 truncate font-black text-[var(--text-primary)]">
                      {file.name}
                    </span>
                    <span className="shrink-0 text-[var(--text-muted)]">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="grid content-start gap-4">
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Budget</p>
            <div className="mt-4 grid grid-cols-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-1 text-[12px] font-black">
              <span className="rounded-[9px] bg-[var(--text-primary)] px-3 py-2 text-center text-[var(--background)]">
                USD
              </span>
              <span className="px-3 py-2 text-center text-[var(--text-muted)]">ETH</span>
            </div>
            <label className="mt-4 flex items-center gap-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 focus-within:border-[var(--text-primary)]">
              <span className="text-[14px] font-black text-[var(--text-muted)]">$</span>
              <input
                className="w-full bg-transparent text-[16px] font-black text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] placeholder:opacity-60"
                inputMode="decimal"
                placeholder="1500"
                value={budgetUsd}
                onChange={(event) => setBudgetUsd(event.target.value)}
              />
            </label>
          </div>

          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
              Summary
            </p>
            <div className="mt-4 grid gap-3 text-[12px] text-[var(--text-secondary)]">
              <p>{title || "Job title..."}</p>
              <p>
                {attachedFiles.length > 0
                  ? `${attachedFiles.length} files attached`
                  : "No files attached"}
              </p>
              <p className="text-[18px] font-black text-[var(--text-primary)]">
                ${budgetDisplay} max budget
              </p>
              <p>{budgetEth} ETH target</p>
              <p>Network fee: {gasEstimate}</p>
            </div>
          </div>

          {state.status === "error" && (
            <p className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-[12px] font-black text-[var(--text-primary)]">
              {state.message}
            </p>
          )}

          {state.status === "recording_ledger" && (
            <p className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-[12px] font-black text-[var(--text-primary)]">
              Recording funding transaction: {state.txHash}
            </p>
          )}

          <button
            className="inline-flex h-11 items-center justify-center rounded-[12px] bg-[var(--button)] px-6 text-[13px] font-black text-[var(--button-text)] disabled:opacity-45"
            disabled={
              !ready ||
              state.status === "creating" ||
              state.status === "confirming_wallet" ||
              state.status === "recording_ledger"
            }
            type="button"
            onClick={createAndFund}
          >
            {state.status === "creating"
              ? "Creating job..."
              : state.status === "confirming_wallet"
                ? "Confirm in wallet..."
                : state.status === "recording_ledger"
                  ? "Recording..."
                  : state.status === "funded"
                    ? "Funded"
                    : "Create job & fund escrow"}
          </button>
        </aside>
      </section>
    </div>
  );
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function isCreatedJobPayload(value: unknown): value is CreatedJobPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "contract" in value &&
    typeof (value as { id?: unknown }).id === "string" &&
    typeof (value as { contract?: { id?: unknown; amount?: unknown; currency?: unknown } }).contract
      ?.id === "string" &&
    typeof (value as { contract?: { id?: unknown; amount?: unknown; currency?: unknown } }).contract
      ?.amount === "number" &&
    typeof (value as { contract?: { id?: unknown; amount?: unknown; currency?: unknown } }).contract
      ?.currency === "string"
  );
}

async function prepareFunding(record: CreatedJobPayload) {
  const response = await fetch("/escrow-contracts/onchain/fund/prepare", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jobId: record.id,
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
  record: CreatedJobPayload,
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
      title: record.title,
      description: record.description,
      budget: record.budget,
      deadline: record.deadline,
      requirements: record.requirements,
      status: record.status,
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
  const payload = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not confirm funding.");
  }
}
