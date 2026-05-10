"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { EnsAddress } from "@/components/ens-address";
import { JobLifecycleActions } from "@/components/job-lifecycle-actions";

const ETH_USD_RATE = 3500;

type Job = {
  id: string;
  title: string;
  description: string;
  status: string;
  budget: number;
  deadline: string;
  createdAt?: string;
  updatedAt?: string;
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

function statusToTab(job: Job, contract: Contract | null): string {
  const s = contract?.status ?? "pending";
  if (s === "pending") return "hidden";
  if (s === "funded") return "funded";
  if (s === "locked") return "locked";
  if (s === "release_requested" || job.status === "ai_reviewed" || job.status === "submitted") return "submitted";
  if (s === "released" || job.status === "completed") return "completed";
  return "hidden";
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

function compareNewestFirst(a: Job, b: Job, aIndex: number, bIndex: number): number {
  const aTime = Date.parse(a.createdAt ?? a.updatedAt ?? "");
  const bTime = Date.parse(b.createdAt ?? b.updatedAt ?? "");
  const aHasTime = Number.isFinite(aTime);
  const bHasTime = Number.isFinite(bTime);

  if (aHasTime && bHasTime && aTime !== bTime) {
    return bTime - aTime;
  }

  if (aHasTime !== bHasTime) {
    return bHasTime ? 1 : -1;
  }

  return bIndex - aIndex;
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

export function AvailableJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("job") ?? "";

  const [items, setItems] = useState<JobWithContract[]>([]);
  const [expandedId, setExpandedId] = useState<string>(highlightId);

  useEffect(() => {
    async function load() {
      setItems(await loadJobRecords());
    }

    void load();
  }, []);

  const visibleItems = items
    .filter(({ job, contract }) => statusToTab(job, contract) === "funded")
    .map((item, index) => ({ item, index }))
    .sort((a, b) => compareNewestFirst(a.item.job, b.item.job, a.index, b.index))
    .map(({ item }) => item);
  const readyCount = visibleItems.length;
  const availableLabel = readyCount === 1 ? "available job" : "available jobs";

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <div className="px-4 pt-4 sm:px-8">
        <div className="mx-auto w-full max-w-[1120px]">
          <p className="inline-flex rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12px] font-black uppercase tracking-wide text-[var(--text-secondary)]">
            {readyCount} {availableLabel}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1120px] px-4 py-4 sm:px-6">
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

        {visibleItems.length === 0 && items.length > 0 && (
          <div className="rounded-[16px] border border-dashed border-[var(--border)] p-10 text-center">
            <p className="text-[14px] text-[var(--text-muted)]">
              No paid jobs are ready to accept yet.
            </p>
          </div>
        )}

        <div className="grid gap-4">
          {visibleItems.map(({ job, contract }) => (
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
        className="grid w-full gap-5 px-5 py-5 text-left transition-colors hover:bg-[var(--surface-elevated)] sm:grid-cols-[96px_minmax(0,1fr)_170px_128px] sm:items-center sm:px-6"
        type="button"
        onClick={onToggle}
      >
        <div className="flex h-[78px] w-[96px] flex-col justify-center rounded-[10px] bg-[var(--surface-strong)] px-4">
          <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">Pays</span>
          <span className="mt-1 text-[20px] font-black leading-none text-[var(--text-primary)]">
            {shortBudget(job.budget)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[18px] font-black text-[var(--text-primary)]">
            {job.title}
          </h2>
          <p className="mt-1 truncate text-[13px] text-[var(--text-muted)]">
            {job.description}
          </p>
        </div>

        <div className="border-t border-[var(--border)] pt-3 sm:border-t-0 sm:pt-0 sm:text-right">
          <div>
            <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">Deadline</p>
            <p className="mt-1 text-[14px] font-black text-[var(--text-primary)]">
              {formatDeadline(job.deadline)}
            </p>
          </div>
        </div>

        <div className="sm:flex sm:justify-end">
          <span className="inline-flex h-11 w-full items-center justify-center rounded-[11px] bg-[var(--text-primary)] px-4 text-[13px] font-black text-[var(--background)] sm:w-auto">
            {isOpen ? "Close" : "View job"}
          </span>
          <svg
            className="sr-only"
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

          <ReferencePreviewPanel files={job.sourceFiles ?? []} />

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

            {contract?.clientWalletAddress && (
              <div>
                <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Client</p>
                <EnsAddress
                  address={contract.clientWalletAddress}
                  className="mt-1 text-[13px] font-bold text-[var(--text-primary)]"
                  showAvatar
                />
              </div>
            )}

            {contract?.freelancerWalletAddress && (
              <div>
                <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Freelancer</p>
                <EnsAddress
                  address={contract.freelancerWalletAddress}
                  className="mt-1 text-[13px] font-bold text-[var(--text-primary)]"
                  showAvatar
                />
              </div>
            )}

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

function ReferencePreviewPanel({ files }: { files: StoredFile[] }) {
  const primaryImage = files.find(isPreviewableImage);

  if (files.length === 0) {
    return (
      <section className="mt-5 rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface-elevated)] p-5">
        <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
          Reference preview
        </p>
        <div className="mt-3 grid min-h-[220px] place-items-center rounded-[10px] bg-[var(--surface-strong)] px-4 text-center">
          <div>
            <p className="text-[14px] font-black text-[var(--text-primary)]">
              No reference files attached
            </p>
            <p className="mt-1 text-[12px] leading-5 text-[var(--text-muted)]">
              The client did not upload an image or document for this job.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
          Reference preview
        </p>
        <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
          {files.length} {files.length === 1 ? "file" : "files"}
        </p>
      </div>

      {primaryImage ? (
        <a
          className="mt-3 block overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface-strong)]"
          href={primaryImage.url}
          rel="noreferrer"
          target="_blank"
        >
          <div className="grid max-h-[420px] min-h-[260px] place-items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={primaryImage.filename}
              className="max-h-[420px] w-full object-contain"
              src={primaryImage.url}
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--surface)] px-3 py-2">
            <span className="min-w-0 truncate text-[12px] font-black text-[var(--text-primary)]">
              {primaryImage.filename}
            </span>
            <span className="shrink-0 text-[11px] font-black uppercase text-[var(--text-muted)]">
              Open
            </span>
          </div>
        </a>
      ) : (
        <div className="mt-3 grid min-h-[220px] place-items-center rounded-[10px] bg-[var(--surface-strong)] px-4 text-center">
          <div>
            <p className="text-[14px] font-black text-[var(--text-primary)]">
              No image preview
            </p>
            <p className="mt-1 text-[12px] leading-5 text-[var(--text-muted)]">
              The client attached files, but no image preview is available.
            </p>
          </div>
        </div>
      )}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {files.map((file) => (
          <a
            className="flex min-h-10 items-center justify-between gap-3 rounded-[9px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12px] font-black text-[var(--text-primary)] hover:border-[var(--border-strong)]"
            href={file.url}
            key={file.id}
            rel="noreferrer"
            target="_blank"
          >
            <span className="min-w-0 truncate">{file.filename}</span>
            <span className="shrink-0 text-[var(--text-muted)]">
              {isPreviewableImage(file) ? "Image" : "Open"}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function isPreviewableImage(file: StoredFile) {
  const value = `${file.filename} ${file.url}`.toLowerCase();

  return (
    file.url.startsWith("data:image/") ||
    value.includes(".png") ||
    value.includes(".jpg") ||
    value.includes(".jpeg") ||
    value.includes(".gif") ||
    value.includes(".webp") ||
    value.includes(".svg")
  );
}
