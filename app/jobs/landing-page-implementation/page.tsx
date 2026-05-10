"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const ALL_TOPICS = [
  "Web Design",
  "Landing Page",
  "Frontend",
  "Responsive",
  "No-code",
  "Branding",
  "Bug Fix",
  "Smart Contract",
];

const BID_MODES = [
  { id: "fixed", label: "Fixed escrow", description: "Client locks one price." },
  { id: "open", label: "Open bids", description: "Freelancers send offers." },
  { id: "dutch", label: "Dutch bid", description: "Freelancers can underbid." },
  { id: "hybrid", label: "Hybrid", description: "Fixed cap + underbids." },
];

const DEFAULT_TOPICS = ["Web Design", "Landing Page", "Frontend"];
const DEFAULT_MODES = ["fixed", "hybrid"];
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
  const [selectedTopics, setSelectedTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [selectedModes, setSelectedModes] = useState<string[]>(DEFAULT_MODES);
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
  const jobDescription = record?.job.description ?? "Loading job details...";
  const jobRequirements = record?.job.requirements ?? jobDescription;
  const escrowAmount = useMemo(() => {
    const budget = record?.job.budget ?? record?.contract?.amount ?? 0;

    return budgetToUsd(budget);
  }, [record?.contract?.amount, record?.job.budget]);

  function toggleTopic(topic: string) {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  }

  function toggleMode(id: string) {
    setSelectedModes((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  }

  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-4 py-6 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-[940px] gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">

        {/* ── Main card ── */}
        <article className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">

          {/* Header */}
          <p className="text-[11px] font-black uppercase text-[var(--success)]">
            Escrow funded
          </p>
          <h1 className="mt-1 text-[36px] font-black leading-none sm:text-[48px]">
            Ready for freelancer
          </h1>

          {/* Job title */}
          <div className="mt-5 rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Job</p>
            <p className="mt-1 text-[16px] font-black text-[var(--text-primary)]">
              {jobTitle}
            </p>
            <p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)]">
              {jobDescription}
            </p>
          </div>

          {/* Deliverables */}
          <div className="mt-4 flex flex-wrap gap-2">
            {buildBriefTags(jobRequirements).map((d) => (
              <span
                key={d}
                className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2 text-[13px] font-black text-[var(--text-primary)]"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Topics */}
          <div className="mt-5">
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Topics</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ALL_TOPICS.map((topic) => {
                const active = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={`rounded-full px-4 py-1.5 text-[13px] font-black transition ${
                      active
                        ? "bg-[var(--text-primary)] text-[var(--background)]"
                        : "border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)]"
                    }`}
                  >
                    {active ? `✓ ${topic}` : `+ ${topic}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bid Mode */}
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                Bid mode
              </p>
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                {selectedModes.length} selected
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {BID_MODES.map((mode) => {
                const active = selectedModes.includes(mode.id);
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => toggleMode(mode.id)}
                    className={`flex items-start gap-3 rounded-[12px] border p-3 text-left transition ${
                      active
                        ? "border-[var(--text-primary)] bg-[var(--surface-elevated)]"
                        : "border-[var(--border)] bg-[var(--surface-elevated)]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        active
                          ? "border-[var(--text-primary)] bg-[var(--text-primary)]"
                          : "border-[var(--border-strong)]"
                      }`}
                    >
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--background)]" />
                      )}
                    </span>
                    <span>
                      <span className="block text-[13px] font-black text-[var(--text-primary)]">
                        {mode.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                        {mode.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accept button */}
          <Link
            href={`/jobs/landing-page-implementation/accepted${record?.job.id ? `?job=${encodeURIComponent(record.job.id)}` : ""}`}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-[11px] bg-[var(--button)] px-8 text-[13px] font-black text-[var(--button-text)] transition hover:opacity-90"
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

function buildBriefTags(requirements: string) {
  const tags = requirements
    .split(/\n|,|\./)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 3);

  return tags.length > 0 ? tags : ["Client brief"];
}
