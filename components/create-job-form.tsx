"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const requirements = ["Responsive landing page", "Deployed preview", "Source link"];
const ETH_USD_RATE = 3500;

export function CreateJobForm() {
  const [budgetUsd, setBudgetUsd] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fieldShell =
    "rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 shadow-[0_1px_0_rgba(255,255,255,0.03)] transition focus-within:border-[var(--text-primary)] lg:p-2.5";
  const fieldLabel = "text-[11px] font-black uppercase text-[var(--text-muted)]";
  const fieldInput =
    "mt-2 w-full bg-transparent text-[15px] font-black text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] placeholder:opacity-45";

  const budgetEth = useMemo(() => {
    const parsedBudget = Number(budgetUsd);

    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      return "0.0000";
    }

    return (parsedBudget / ETH_USD_RATE).toFixed(4);
  }, [budgetUsd]);

  return (
    <>
      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)] sm:p-6 lg:p-5">
        <p className="text-[12px] font-black uppercase text-[var(--text-muted)] sm:text-[13px]">
          2. Job request
        </p>
        <h1 className="mt-2 text-[34px] font-black leading-[0.98] sm:text-[54px] lg:text-[46px]">
          What kind
          <br />
          of job do
          <br />
          you need?
        </h1>
        <p className="mt-3 max-w-[560px] text-[14px] leading-6 text-[var(--text-secondary)] sm:text-[15px] lg:text-[13px] lg:leading-5">
          Add the goal, proof, files, and budget. Escrow will be calculated before funding.
        </p>

        <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-3">
          <label className={fieldShell}>
            <span className={fieldLabel}>What do you need?</span>
            <input
              className={fieldInput}
              placeholder="Landing page, logo, smart contract audit..."
            />
          </label>
          <label className={fieldShell}>
            <span className={fieldLabel}>What should be delivered?</span>
            <textarea
              className="mt-3 min-h-36 w-full resize-none bg-transparent text-[15px] leading-7 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] placeholder:opacity-45 sm:min-h-28 lg:min-h-24 lg:text-[14px] lg:leading-6"
              placeholder={requirements.join("\n")}
            />
          </label>
          <label className="grid cursor-pointer gap-1.5 rounded-[14px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-elevated)] p-4 text-center transition hover:border-[var(--text-primary)] lg:p-3">
            <input
              accept="image/*,.pdf,application/pdf"
              className="sr-only"
              type="file"
              onChange={(event) => setAttachedFile(event.target.files?.[0] ?? null)}
            />
            <span className={fieldLabel}>Add reference file</span>
            <span className="text-[15px] font-black text-[var(--text-primary)]">
              {attachedFile ? attachedFile.name : "Upload PDF or image"}
            </span>
            <span className="text-[12px] leading-5 text-[var(--text-muted)]">
              Screenshot, design brief, PDF spec
            </span>
          </label>
          {attachedFile && (
            <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3">
              <p className={fieldLabel}>
                Attached file
              </p>
              <p className="mt-2 break-all text-[14px] font-black">{attachedFile.name}</p>
              <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                {(attachedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
          <div className="grid gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4 lg:p-3">
            <label className="grid gap-2">
              <span className={fieldLabel}>How much do you want to pay?</span>
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-black text-[var(--text-muted)]">$</span>
                <input
                  className="w-full bg-transparent text-[18px] font-black text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] placeholder:opacity-45"
                  inputMode="decimal"
                  placeholder="1500"
                  value={budgetUsd}
                  onChange={(event) => setBudgetUsd(event.target.value)}
                />
              </div>
            </label>
            <div className="rounded-[14px] bg-[var(--text-primary)] px-4 py-3 text-[var(--background)]">
              <p className="text-[11px] font-black uppercase opacity-65">
                You will fund
              </p>
              <p className="mt-1.5 text-[24px] font-black leading-none">{budgetEth} ETH</p>
              <p className="mt-1.5 text-[12px] opacity-65">
                Demo rate: 1 ETH = ${ETH_USD_RATE}
              </p>
            </div>
          </div>
        </div>

        <Link
          className="mt-3 inline-flex h-[50px] w-full items-center justify-center rounded-[12px] bg-[var(--button)] px-6 text-[15px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)]"
          href="/jobs/landing-page-implementation"
        >
          Create + fund
        </Link>
      </div>

      <aside className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <p className="text-[13px] font-black uppercase text-[var(--text-muted)]">Escrow</p>
        <p className="mt-4 text-[38px] font-black leading-none">{budgetEth} ETH</p>
        <p className="mt-3 text-[14px] leading-6 text-[var(--text-secondary)]">
          Locked until proof is approved.
        </p>
      </aside>
    </>
  );
}
