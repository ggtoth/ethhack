"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { JobLifecycleActions } from "@/components/job-lifecycle-actions";

const ETH_USD_RATE = 3500;

type Job = {
  id: string;
  title: string;
  description: string;
  status: string;
  budget: number;
  deadline: string;
  requirements?: string;
  submissionNotes?: string | null;
  sourceFiles?: StoredFile[];
  submittedSourceFiles?: StoredFile[];
};

type Contract = {
  id: string;
  jobId: string;
  status: string;
  clientWalletAddress: string | null;
  freelancerWalletAddress: string | null;
  transactionHash: string | null;
};

type JobWithContract = {
  job: Job;
  contract: Contract | null;
};

type StoredFile = {
  id: string;
  url: string;
  filename: string;
};

const STATUS_TABS = [
  { label: "Ready to accept", value: "funded" },
];

const STATUS_COLOR: Record<string, string> = {
  open: "text-[#2563eb] bg-[rgba(37,99,235,0.09)] border-[rgba(37,99,235,0.20)]",
  funded: "text-[#177d53] bg-[var(--success-bg)] border-[rgba(23,125,83,0.20)]",
  locked: "text-[#b45309] bg-[rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.24)]",
  submitted: "text-[#7c3aed] bg-[var(--ai-bg)] border-[rgba(124,58,237,0.18)]",
  ai_reviewed: "text-[#4ade80] bg-[rgba(74,222,128,0.10)] border-[rgba(74,222,128,0.20)]",
  release_requested: "text-[#fb923c] bg-[rgba(251,146,60,0.10)] border-[rgba(251,146,60,0.20)]",
  completed: "text-[#177d53] bg-[var(--success-bg)] border-[rgba(23,125,83,0.20)]",
  disputed: "text-[#f87171] bg-[rgba(248,113,113,0.10)] border-[rgba(248,113,113,0.20)]",
  cancelled: "text-[var(--text-muted)] bg-[var(--surface-strong)] border-[var(--border)]",
};

function statusToTab(job: Job, contract: Contract | null): string {
  const s = contract?.status ?? "pending";
  if (s === "pending") return "hidden";
  if (s === "funded") return "funded";
  if (s === "locked") return "locked";
  if (s === "release_requested" || job.status === "ai_reviewed" || job.status === "submitted") return "submitted";
  if (s === "released" || job.status === "completed") return "completed";
  return "hidden";
}

function statusLabel(job: Job, contract: Contract | null): string {
  const s = contract?.status ?? "pending";
  if (s === "pending") return "Needs payment";
  if (s === "funded") return "Ready to accept";
  if (s === "locked") return "Working";
  if (s === "release_requested") return "Waiting for review";
  if (s === "released") return "Paid";
  if (s === "refunded") return "Refunded";
  return job.status.replace(/_/g, " ");
}

function statusColorKey(job: Job, contract: Contract | null): string {
  const s = contract?.status ?? "pending";
  if (s === "pending") return "open";
  if (s === "funded") return "funded";
  if (s === "locked") return "locked";
  if (s === "release_requested") return "submitted";
  if (s === "released") return "completed";
  return job.status;
}

function budgetToUsd(eth: number): string {
  const usd = eth * ETH_USD_RATE;
  return usd.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function shortBudget(eth: number): string {
  const usd = eth * ETH_USD_RATE;
  if (usd >= 1000) {
    return `$${Math.round(usd / 1000)}k`;
  }

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

function paymentLabel(contract: Contract | null): string {
  const status = contract?.status ?? "pending";

  if (status === "pending") return "Payment not added yet";
  if (status === "funded") return "Payment is ready";
  if (status === "locked") return "Payment reserved for you";
  if (status === "release_requested") return "Client is reviewing";
  if (status === "released") return "Paid out";
  if (status === "refunded") return "Refunded";
  if (status === "disputed") return "Needs support";
  if (status === "cancelled") return "Cancelled";

  return "Status pending";
}

function nextStep(job: Job, contract: Contract | null): { title: string; detail: string } {
  const status = contract?.status ?? "pending";

  if (status === "pending") {
    return {
      title: "Waiting for payment",
      detail: "The job is visible, but work should not start until the client adds payment.",
    };
  }

  if (status === "funded") {
    return {
      title: "Ready for a developer",
      detail: "Review the brief. If it fits, accept it and start the work.",
    };
  }

  if (status === "locked" || job.status === "in_progress") {
    return {
      title: "Work is active",
      detail: "Build the requested result and submit the finished delivery when ready.",
    };
  }

  if (status === "release_requested" || job.status === "submitted" || job.status === "ai_reviewed") {
    return {
      title: "Waiting for client review",
      detail: "The delivery was sent. The client can review it and release payment.",
    };
  }

  if (status === "released" || job.status === "completed") {
    return {
      title: "Completed",
      detail: "The client approved the work and the payment was released.",
    };
  }

  return {
    title: "Check details",
    detail: "Open the brief to see the latest available action.",
  };
}

async function loadJobRecords(): Promise<JobWithContract[]> {
  const jobsRes = await fetch("/jobs", { cache: "no-store" });
  const jobs = jobsRes.ok ? ((await jobsRes.json()) as Job[]) : [];
  const records = await Promise.all(
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

  return records;
}

export default function MyJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("job") ?? "";

  const [items, setItems] = useState<JobWithContract[]>([]);
  const [activeTab, setActiveTab] = useState("funded");
  const [expandedId, setExpandedId] = useState<string>(highlightId);

  useEffect(() => {
    async function load() {
      setItems(await loadJobRecords());
    }

    void load();
  }, []);

  const visibleItems = items.filter(({ job, contract }) => statusToTab(job, contract) === "funded");
  const counts = STATUS_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.value] =
      tab.value === "funded"
        ? visibleItems.length
        : 0;
    return acc;
  }, {});
  const filtered = visibleItems.filter(({ job, contract }) => statusToTab(job, contract) === activeTab);
  const readyCount = counts["funded"] ?? 0;

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)]">
              My Jobs
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Choose paid work with confidence</h1>
            <p className="mt-2 max-w-xl text-[14px] leading-6 text-[var(--text-secondary)]">
              Only funded jobs appear here, so developers can choose work without checking payment details.
            </p>
          </div>

          <div className="w-full lg:w-[180px]">
            <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3">
              <p className="text-[11px] font-bold uppercase text-[var(--text-muted)]">Ready to accept</p>
              <p className="mt-1 text-2xl font-black text-[var(--text-primary)]">{readyCount}</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 flex w-full max-w-[1120px] flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              className={`flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-bold transition-all ${
                activeTab === tab.value
                  ? "bg-[var(--text-primary)] text-[var(--background)]"
                  : "border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              }`}
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
              {counts[tab.value] > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                    activeTab === tab.value
                      ? "bg-white/20"
                      : "bg-[var(--surface-strong)] text-[var(--text-muted)]"
                  }`}
                >
                  {counts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[980px] px-4 py-6 sm:px-6">
        {items.length === 0 && (
          <div className="rounded-[16px] border border-dashed border-[var(--border)] p-12 text-center">
            <p className="text-[14px] text-[var(--text-muted)]">No jobs yet.</p>
            <Link
              className="mt-4 inline-flex h-9 items-center rounded-full bg-[var(--text-primary)] px-5 text-[13px] font-bold text-[var(--background)]"
              href="/post-job"
            >
              Create your first job
            </Link>
          </div>
        )}

        {filtered.length === 0 && items.length > 0 && (
          <div className="rounded-[16px] border border-dashed border-[var(--border)] p-10 text-center">
            <p className="text-[14px] text-[var(--text-muted)]">
              No paid jobs are ready to accept yet.
            </p>
          </div>
        )}

        <div className="grid gap-3">
          {filtered.map(({ job, contract }) => (
            <JobCard
              key={job.id}
              job={job}
              contract={contract}
              isOpen={expandedId === job.id}
              highlight={highlightId === job.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === job.id ? "" : job.id))
              }
              onRefresh={() => {
                router.refresh();
                void (async () => {
                  setItems(await loadJobRecords());
                })();
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function JobCard({
  job,
  contract,
  isOpen,
  highlight,
  onToggle,
  onRefresh,
}: {
  job: Job;
  contract: Contract | null;
  isOpen: boolean;
  highlight: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const colorKey = statusColorKey(job, contract);
  const colorClass = STATUS_COLOR[colorKey] ?? STATUS_COLOR["open"];
  const label = statusLabel(job, contract);
  const step = nextStep(job, contract);

  useEffect(() => {
    if (highlight && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlight]);

  return (
    <article
      ref={cardRef}
      className={`relative overflow-hidden rounded-[8px] border bg-[var(--surface)] shadow-[var(--shadow-card)] transition-all ${
        highlight
          ? "border-[var(--text-primary)] ring-2 ring-[var(--ring)]"
          : "border-[var(--border)]"
      }`}
    >
      <button
        className="grid w-full gap-4 px-4 py-4 pr-10 text-left transition-colors hover:bg-[var(--surface-elevated)] sm:grid-cols-[72px_minmax(0,1fr)_180px_28px] sm:items-center sm:px-5"
        type="button"
        onClick={onToggle}
      >
        <div className="flex h-[64px] w-[72px] flex-col justify-center rounded-[8px] bg-[var(--surface-strong)] px-3">
          <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Pays</span>
          <span className="mt-1 text-[16px] font-black leading-none text-[var(--text-primary)]">
            {shortBudget(job.budget)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-[15px] font-black text-[var(--text-primary)]">
              {job.title}
            </h2>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${colorClass}`}
            >
              {label}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[12px] text-[var(--text-muted)]">
            {job.description}
          </p>
          <p className="mt-2 text-[12px] font-bold text-[var(--text-secondary)]">
            {step.title}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-3 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
          <div>
            <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Deadline</p>
            <p className="mt-1 text-[13px] font-black text-[var(--text-primary)]">
              {formatDeadline(job.deadline)}
            </p>
          </div>
          <div className="sm:mt-2">
            <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Payment</p>
            <p className="mt-1 text-[12px] font-bold text-[var(--text-secondary)]">
              {paymentLabel(contract)}
            </p>
          </div>
        </div>

        <div className="absolute right-4 top-5 sm:static sm:flex sm:justify-end">
          <svg
            className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-[var(--border)] px-5 pb-5 pt-4 sm:px-6">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Work details</p>
              <p className="mt-1 text-[16px] font-black text-[var(--text-primary)]">{job.title}</p>
              <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
                {job.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:block sm:text-right">
              <div>
                <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Budget</p>
                <p className="mt-1 text-[18px] font-black text-[var(--text-primary)]">
                  {budgetToUsd(job.budget)}
                </p>
              </div>
              <div className="sm:mt-4">
                <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Due</p>
                <p className="mt-1 text-[14px] font-bold text-[var(--text-primary)]">
                  {formatDeadline(job.deadline)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 border-t border-[var(--border)] pt-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Conditions</p>
              <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
                {job.requirements ?? "No extra conditions were added by the client."}
              </p>
            </div>

            {job.submissionNotes && (
              <div>
                <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Latest note</p>
                <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
                  {job.submissionNotes}
                </p>
              </div>
            )}

            <div>
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Client files</p>
              {job.sourceFiles && job.sourceFiles.length > 0 ? (
                <div className="mt-2 grid gap-2">
                  {job.sourceFiles.map((file) => (
                    <a
                      className="inline-flex min-h-9 items-center justify-between gap-3 rounded-[8px] border border-[var(--border)] px-3 text-[12px] font-bold text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                      href={file.url}
                      key={file.id}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="truncate">{file.filename}</span>
                      <span className="shrink-0 text-[var(--text-muted)]">Open</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
                  No client files attached.
                </p>
              )}
            </div>

            <div className="rounded-[8px] bg-[var(--surface-strong)] p-4 sm:col-span-2">
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Next step</p>
              <p className="mt-1 text-[14px] font-black text-[var(--text-primary)]">{step.title}</p>
              <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
                {step.detail}
              </p>
            </div>

            {job.submittedSourceFiles && job.submittedSourceFiles.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Submitted files</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {job.submittedSourceFiles.map((file) => (
                    <a
                      className="inline-flex h-9 items-center rounded-[8px] border border-[var(--border)] px-3 text-[12px] font-bold text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                      href={file.url}
                      key={file.id}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {file.filename}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5">
            <JobLifecycleActions
              contract={contract}
              job={job}
              onSuccess={onRefresh}
            />
          </div>
        </div>
      )}
    </article>
  );
}
