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

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Funded", value: "funded" },
  { label: "Locked", value: "locked" },
  { label: "Submitted", value: "submitted" },
  { label: "Done", value: "completed" },
];

const STATUS_COLOR: Record<string, string> = {
  open: "text-[#60a5fa] bg-[rgba(96,165,250,0.10)] border-[rgba(96,165,250,0.20)]",
  funded: "text-[#a78bfa] bg-[rgba(167,139,250,0.10)] border-[rgba(167,139,250,0.20)]",
  locked: "text-[#fb923c] bg-[rgba(251,146,60,0.10)] border-[rgba(251,146,60,0.20)]",
  submitted: "text-[#facc15] bg-[rgba(250,204,21,0.10)] border-[rgba(250,204,21,0.20)]",
  ai_reviewed: "text-[#4ade80] bg-[rgba(74,222,128,0.10)] border-[rgba(74,222,128,0.20)]",
  release_requested: "text-[#fb923c] bg-[rgba(251,146,60,0.10)] border-[rgba(251,146,60,0.20)]",
  completed: "text-[#4ade80] bg-[rgba(74,222,128,0.12)] border-[rgba(74,222,128,0.22)]",
  disputed: "text-[#f87171] bg-[rgba(248,113,113,0.10)] border-[rgba(248,113,113,0.20)]",
  cancelled: "text-[var(--text-muted)] bg-[var(--surface-strong)] border-[var(--border)]",
};

function statusToTab(job: Job, contract: Contract | null): string {
  const s = contract?.status ?? "pending";
  if (s === "pending") return "open";
  if (s === "funded") return "funded";
  if (s === "locked") return "locked";
  if (s === "release_requested" || job.status === "ai_reviewed" || job.status === "submitted") return "submitted";
  if (s === "released" || job.status === "completed") return "completed";
  return "open";
}

function statusLabel(job: Job, contract: Contract | null): string {
  const s = contract?.status ?? "pending";
  if (s === "pending") return "Open";
  if (s === "funded") return "Funded";
  if (s === "locked") return "In progress";
  if (s === "release_requested") return "Review pending";
  if (s === "released") return "Completed";
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

export default function MyJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("job") ?? "";

  const [items, setItems] = useState<JobWithContract[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedId, setExpandedId] = useState<string>(highlightId);

  useEffect(() => {
    async function load() {
      const [jobsRes, contractsRes] = await Promise.all([
        fetch("/jobs", { cache: "no-store" }),
        fetch("/escrow-contracts", { cache: "no-store" }),
      ]);

      const jobs = jobsRes.ok ? ((await jobsRes.json()) as Job[]) : [];
      const contracts = contractsRes.ok ? ((await contractsRes.json()) as Contract[]) : [];

      const contractMap = new Map(contracts.map((c) => [c.jobId, c]));
      setItems(jobs.map((job) => ({ job, contract: contractMap.get(job.id) ?? null })));
    }

    void load();
  }, []);

  const filtered =
    activeTab === "all"
      ? items
      : items.filter(({ job, contract }) => statusToTab(job, contract) === activeTab);

  const counts = STATUS_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.value] =
      tab.value === "all"
        ? items.length
        : items.filter(({ job, contract }) => statusToTab(job, contract) === tab.value).length;
    return acc;
  }, {});

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-8 sm:px-8">
        <p className="text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)]">
          My Jobs
        </p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Work queue</h1>
        <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
          Track every job from escrow creation to final payout.
        </p>

        <div className="mt-6 flex flex-wrap gap-1.5">
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

      <div className="mx-auto w-full max-w-[860px] px-4 py-6 sm:px-6">
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
            <p className="text-[14px] text-[var(--text-muted)]">No jobs in this category.</p>
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
                  const [jobsRes, contractsRes] = await Promise.all([
                    fetch("/jobs", { cache: "no-store" }),
                    fetch("/escrow-contracts", { cache: "no-store" }),
                  ]);
                  const jobs = jobsRes.ok ? ((await jobsRes.json()) as Job[]) : [];
                  const contracts = contractsRes.ok ? ((await contractsRes.json()) as Contract[]) : [];
                  const contractMap = new Map(contracts.map((c) => [c.jobId, c]));
                  setItems(jobs.map((j) => ({ job: j, contract: contractMap.get(j.id) ?? null })));
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

  useEffect(() => {
    if (highlight && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlight]);

  return (
    <article
      ref={cardRef}
      className={`overflow-hidden rounded-[18px] border bg-[var(--surface)] transition-all ${
        highlight
          ? "border-[var(--text-primary)] shadow-[0_0_0_3px_rgba(255,255,255,0.06)]"
          : "border-[var(--border)]"
      }`}
    >
      {/* Card header — always visible */}
      <button
        className="flex w-full items-center gap-4 px-5 py-4 text-left sm:px-6"
        type="button"
        onClick={onToggle}
      >
        {/* Budget pill */}
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[12px] bg-[var(--surface-strong)]">
          <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">$</span>
          <span className="text-[13px] font-black leading-none text-[var(--text-primary)]">
            {Math.round(job.budget * ETH_USD_RATE / 1000) > 0
              ? `${Math.round(job.budget * ETH_USD_RATE / 1000)}k`
              : String(Math.round(job.budget * ETH_USD_RATE))}
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
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[15px] font-black text-[var(--text-primary)]">
              {budgetToUsd(job.budget)}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Due {job.deadline}
            </p>
          </div>
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

      {/* Expandable details */}
      {isOpen && (
        <div className="border-t border-[var(--border)] px-5 pb-5 pt-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Budget</p>
              <p className="mt-1 text-[20px] font-black text-[var(--text-primary)]">
                {budgetToUsd(job.budget)}
              </p>
              <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                ≈ {job.budget.toFixed(4)} ETH
              </p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Deadline</p>
              <p className="mt-1 text-[15px] font-bold text-[var(--text-primary)]">{job.deadline}</p>
            </div>
            <div>
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Escrow status</p>
              <p className="mt-1 text-[15px] font-bold text-[var(--text-primary)]">
                {contract ? contract.status.replace(/_/g, " ") : "No contract"}
              </p>
            </div>
            {contract?.transactionHash && (
              <div>
                <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Tx</p>
                <p className="mt-1 break-all font-mono text-[11px] text-[var(--text-secondary)]">
                  {contract.transactionHash.slice(0, 20)}…
                </p>
              </div>
            )}
          </div>

          {job.requirements && (
            <div className="mt-4">
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Requirements</p>
              <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
                {job.requirements}
              </p>
            </div>
          )}

          {job.submissionNotes && (
            <div className="mt-4">
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Submission notes</p>
              <p className="mt-1 text-[13px] leading-6 text-[var(--text-secondary)]">
                {job.submissionNotes}
              </p>
            </div>
          )}

          {contract?.clientWalletAddress && (
            <div className="mt-4">
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Client wallet</p>
              <p className="mt-1 break-all font-mono text-[11px] text-[var(--text-secondary)]">
                {contract.clientWalletAddress}
              </p>
            </div>
          )}

          {contract?.freelancerWalletAddress && (
            <div className="mt-4">
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Freelancer wallet</p>
              <p className="mt-1 break-all font-mono text-[11px] text-[var(--text-secondary)]">
                {contract.freelancerWalletAddress}
              </p>
            </div>
          )}

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
