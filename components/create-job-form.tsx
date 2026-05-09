"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const ETH_USD_RATE = 3500;

export function CreateJobForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [budgetUsd, setBudgetUsd] = useState("");
  const [deadline, setDeadline] = useState("2026-06-30");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [state, setState] = useState<{
    status: "idle" | "creating" | "created" | "error";
    message?: string;
    jobId?: string;
    contractId?: string;
  }>({ status: "idle" });
  const budgetDisplay = budgetUsd.trim() ? Number(budgetUsd).toLocaleString("en-US") : "0";

  const budgetEth = useMemo(() => {
    const parsedBudget = Number(budgetUsd);

    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      return "0.0000";
    }

    return (parsedBudget / ETH_USD_RATE).toFixed(4);
  }, [budgetUsd]);

  const ready =
    title.trim() &&
    details.trim() &&
    budgetUsd.trim() &&
    Number.isFinite(Number(budgetUsd)) &&
    Number(budgetUsd) > 0;
  const inputClass =
    "w-full rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-[14px] font-black text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] placeholder:opacity-60 focus:border-[var(--text-primary)]";

  async function createJob() {
    if (!ready || state.status === "creating") {
      return;
    }

    setState({ status: "creating" });

    try {
      const budget = Number(budgetUsd);
      const response = await fetch("/jobs", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: details.trim(),
          requirements: details.trim(),
          budget,
          deadline,
          sourceFiles: attachedFile
            ? [
                {
                  id: `source_${Date.now()}`,
                  url: `local-upload://${attachedFile.name}`,
                  filename: attachedFile.name,
                },
              ]
            : undefined,
          escrow: {
            amount: Number(budgetEth),
            currency: "ETH",
            status: "pending",
            fundedAt: null,
            transactionHash: null,
            chainId: null,
            escrowAddress: null,
            fundingTransactionHash: null,
          },
        }),
      });
      const payload = (await response.json()) as
        | {
            id: string;
            contractId: string;
            contract: { id: string; amount: number };
          }
        | { error?: string };

      if (!response.ok || !("id" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Could not create the job.",
        );
      }

      setState({
        status: "created",
        message: "Job saved. Continue to wallet funding.",
        jobId: payload.id,
        contractId: payload.contract.id,
      });
      router.push(
        `/fund-escrow?job=${encodeURIComponent(payload.id)}&contract=${encodeURIComponent(
          payload.contract.id,
        )}`,
      );
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Could not create the job.",
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
          <p className="text-[11px] font-black uppercase opacity-65">You will fund</p>
          <p className="mt-1 text-[22px] font-black leading-none">${budgetDisplay}</p>
          <p className="mt-1 text-[11px] font-black opacity-65">{budgetEth} ETH estimate</p>
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

              <label className="grid gap-2">
                <span className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                  Deadline
                </span>
                <input
                  className={inputClass}
                  type="date"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
              Reference file
            </p>
            <label className="mt-4 grid cursor-pointer gap-2 rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-5 text-center transition hover:border-[var(--text-primary)]">
              <input
                accept="image/*,.pdf,application/pdf"
                className="sr-only"
                type="file"
                onChange={(event) => setAttachedFile(event.target.files?.[0] ?? null)}
              />
              <span className="truncate text-[13px] font-black text-[var(--text-primary)]">
                {attachedFile ? attachedFile.name : "Upload PDF or image"}
              </span>
            </label>
          </div>
        </div>

        <aside className="grid content-start gap-4">
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Budget</p>
            <div className="mt-4 grid grid-cols-2 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-1 text-[12px] font-black">
              <span className="rounded-[9px] bg-[var(--text-primary)] px-3 py-2 text-center text-[var(--background)]">
                USDT
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
              <p>{attachedFile?.name || "No file attached"}</p>
              <p className="text-[18px] font-black text-[var(--text-primary)]">
                ${budgetDisplay} USDT
              </p>
              <p>{budgetEth} ETH estimate</p>
            </div>
          </div>

          {state.message && (
            <p className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-[12px] font-black text-[var(--text-primary)]">
              {state.message}
            </p>
          )}

          <button
            className="inline-flex h-11 items-center justify-center rounded-[12px] bg-[var(--button)] px-6 text-[13px] font-black text-[var(--button-text)] disabled:opacity-45"
            disabled={!ready || state.status === "creating"}
            type="button"
            onClick={createJob}
          >
            {state.status === "creating" ? "Creating..." : "Create + fund"}
          </button>

          {state.status === "created" && state.jobId && state.contractId && (
            <Link
              className="inline-flex h-11 items-center justify-center rounded-[12px] border border-[var(--border-strong)] px-6 text-[13px] font-black text-[var(--text-primary)]"
              href={`/fund-escrow?job=${encodeURIComponent(
                state.jobId,
              )}&contract=${encodeURIComponent(state.contractId)}`}
            >
              Continue to funding
            </Link>
          )}
        </aside>
      </section>
    </div>
  );
}
