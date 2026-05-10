"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const ETH_USD_RATE = 3500;

type StoredFile = {
  id: string;
  url: string;
  filename: string;
};

type Job = {
  id: string;
  contractId: string;
  title: string;
  description: string;
  status: string;
  budget: number;
  deadline: string;
  requirements?: string;
  sourceFiles?: StoredFile[];
};

type Contract = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  freelancerWalletAddress: string | null;
};

type JobWithContract = {
  job: Job;
  contract: Contract | null;
};

async function loadClientJobs(): Promise<JobWithContract[]> {
  const jobsRes = await fetch("/users/me/jobs", { cache: "no-store" });
  const jobs = jobsRes.ok ? ((await jobsRes.json()) as Job[]) : [];

  return Promise.all(
    jobs.map(async (job) => {
      const detailRes = await fetch(`/jobs/${encodeURIComponent(job.id)}`, {
        cache: "no-store",
      });

      if (!detailRes.ok) {
        return { job, contract: null };
      }

      return (await detailRes.json()) as JobWithContract;
    }),
  );
}

export default function MyJobsPage() {
  const [items, setItems] = useState<JobWithContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const nextItems = await loadClientJobs();

      if (active) {
        setItems(nextItems);
        setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <div className="px-4 pt-4 sm:px-8">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-3">
          <p className="inline-flex rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12px] font-black uppercase tracking-wide text-[var(--text-secondary)]">
            {items.length} {items.length === 1 ? "posted job" : "posted jobs"}
          </p>
          <Link
            className="inline-flex h-9 items-center rounded-[9px] bg-[var(--text-primary)] px-4 text-[12px] font-black uppercase text-[var(--background)]"
            href="/post-job"
          >
            Create
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1120px] px-4 py-4 sm:px-6">
        {loading && (
          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-6 text-[13px] font-black text-[var(--text-muted)]">
            Loading jobs...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="rounded-[16px] border border-dashed border-[var(--border)] p-12 text-center">
            <p className="text-[14px] text-[var(--text-muted)]">No posted jobs yet.</p>
            <Link
              className="mt-4 inline-flex h-9 items-center rounded-full bg-[var(--text-primary)] px-5 text-[13px] font-bold text-[var(--background)]"
              href="/post-job"
            >
              Create your first job
            </Link>
          </div>
        )}

        <div className="grid gap-4">
          {items.map(({ job, contract }) => (
            <article
              className="grid gap-5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-5 py-5 shadow-[var(--shadow-card)] sm:grid-cols-[minmax(0,1fr)_140px_150px] sm:items-center sm:px-6"
              key={job.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-[18px] font-black text-[var(--text-primary)]">
                    {job.title}
                  </h2>
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-strong)] px-2.5 py-1 text-[10px] font-black uppercase text-[var(--text-muted)]">
                    {clientStatus(job, contract)}
                  </span>
                </div>
                <p className="mt-1 truncate text-[13px] text-[var(--text-muted)]">
                  {job.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-3 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
                <div>
                  <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">
                    Budget
                  </p>
                  <p className="mt-1 text-[14px] font-black text-[var(--text-primary)]">
                    {budgetToUsd(job.budget)}
                  </p>
                </div>
                <div className="sm:mt-3">
                  <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">
                    Due
                  </p>
                  <p className="mt-1 text-[14px] font-black text-[var(--text-primary)]">
                    {formatDeadline(job.deadline)}
                  </p>
                </div>
              </div>

              <Link
                className="inline-flex h-11 w-full items-center justify-center rounded-[11px] bg-[var(--text-primary)] px-4 text-[13px] font-black text-[var(--background)] sm:w-auto"
                href={clientActionHref(job, contract)}
              >
                {clientActionLabel(job, contract)}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

function budgetToUsd(eth: number): string {
  const usd = eth * ETH_USD_RATE;

  return usd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatDeadline(deadline: string): string {
  const date = new Date(`${deadline}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return deadline;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function clientStatus(job: Job, contract: Contract | null) {
  const status = contract?.status ?? "pending";

  if (status === "pending") return "Needs payment";
  if (status === "funded") return "Waiting for developer";
  if (status === "locked") return "In progress";
  if (status === "release_requested" || job.status === "submitted") return "Needs review";
  if (status === "released" || job.status === "completed") return "Completed";
  if (status === "refunded") return "Refunded";

  return status.replaceAll("_", " ");
}

function clientActionHref(job: Job, contract: Contract | null) {
  const status = contract?.status ?? "pending";

  if (status === "release_requested" || job.status === "submitted" || job.status === "ai_reviewed") {
    return `/review?job=${encodeURIComponent(job.id)}`;
  }

  return `/find-job?job=${encodeURIComponent(job.id)}`;
}

function clientActionLabel(job: Job, contract: Contract | null) {
  const status = contract?.status ?? "pending";

  if (status === "release_requested" || job.status === "submitted" || job.status === "ai_reviewed") {
    return "Review";
  }

  return "View";
}
