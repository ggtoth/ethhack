"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const ETH_USD_RATE = 3500;

type JobRecord = {
  job: {
    id: string;
    title: string;
    description: string;
    budget: number;
    deadline: string;
    requirements: string;
  };
  contract: {
    amount: number;
    status: string;
  } | null;
};

type JobListItem = {
  id: string;
};

export default function JobDetailPage() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job") ?? "";
  const [record, setRecord] = useState<JobRecord | null>(null);

  useEffect(() => {
    let active = true;

    async function loadJob() {
      const selectedJobId = jobId || (await loadLatestClientJobId());

      if (!selectedJobId) {
        return;
      }

      const response = await fetch(`/jobs/${encodeURIComponent(selectedJobId)}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as JobRecord;

      if (active) {
        setRecord(payload);
      }
    }

    void loadJob();

    return () => {
      active = false;
    };
  }, [jobId]);

  const jobTitle = record?.job.title ?? "Job";
  const jobRequirements =
    record?.job.requirements ?? record?.job.description ?? "Loading job details...";
  const escrowAmount = useMemo(() => {
    const budget = record?.job.budget ?? record?.contract?.amount ?? 0;

    return budgetToUsd(budget);
  }, [record?.contract?.amount, record?.job.budget]);

  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-4 py-4 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-[980px] gap-4 lg:grid-cols-[minmax(0,1fr)_250px]">

        {/* ── Main card ── */}
        <article className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)] sm:p-5">

          {/* Header */}
          <p className="text-[11px] font-black uppercase text-[var(--success)]">
            Escrow funded
          </p>
          <h1 className="mt-1 text-[30px] font-black leading-none sm:text-[38px]">
            Ready for freelancer
          </h1>

          <div className="mt-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Job title</p>
            <p className="mt-1 text-[16px] font-black text-[var(--text-primary)]">
              {jobTitle}
            </p>
          </div>

          <div className="mt-4 rounded-[14px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] p-4 sm:p-5">
            <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                  Client brief
                </p>
                <h2 className="mt-1 text-[22px] font-black leading-tight text-[var(--text-primary)] sm:text-[26px]">
                  What the user needs
                </h2>
              </div>
              <p className="max-w-[260px] text-[11px] font-bold leading-5 text-[var(--text-muted)] sm:text-right">
                Single source of truth for the freelancer.
              </p>
            </div>

            <div className="mt-4 whitespace-pre-wrap break-words rounded-[12px] bg-[var(--surface)] p-4 text-left text-[14px] font-bold leading-6 text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border)] sm:text-[15px] sm:leading-7">
              {jobRequirements}
            </div>
          </div>

          {/* Accept button */}
          <Link
            href={`/jobs/landing-page-implementation/accepted${record?.job.id ? `?job=${encodeURIComponent(record.job.id)}` : ""}`}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-[11px] bg-[var(--button)] px-8 text-[13px] font-black text-[var(--button-text)] transition hover:opacity-90"
          >
            Publish job
          </Link>
        </article>

        {/* ── Sidebar ── */}
        <aside className="grid content-start gap-3">
          {/* Locked escrow */}
          <div className="rounded-[16px] bg-[var(--text-primary)] p-5 text-[var(--background)]">
            <p className="text-[11px] font-black uppercase opacity-65">Locked escrow</p>
            <p className="mt-2 text-[28px] font-black leading-none">{escrowAmount}</p>
            <p className="mt-2 text-[11px] font-black opacity-65">Sepolia test funded</p>
          </div>

          {/* Funded */}
          <div className="rounded-[14px] border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.08)] p-4">
            <p className="text-[11px] font-black uppercase text-[var(--success)]">Funded</p>
            <p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)]">
              Payment is locked. Freelancer can start now.
            </p>
          </div>

          {/* Refund protected */}
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
              Refund protected
            </p>
            <p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)]">
              If the freelancer performs poorly or the delivery is not approved, the locked
              amount returns to the client.
            </p>
          </div>
        </aside>

      </section>
    </main>
  );
}

async function loadLatestClientJobId() {
  const response = await fetch("/users/me/jobs", { cache: "no-store" });

  if (!response.ok) {
    return "";
  }

  const jobs = (await response.json()) as JobListItem[];

  return jobs.at(-1)?.id ?? "";
}

function budgetToUsd(eth: number) {
  const usd = eth * ETH_USD_RATE;

  return usd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
