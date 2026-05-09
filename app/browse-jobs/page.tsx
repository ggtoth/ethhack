import Link from "next/link";

import { listDummyEscrowContracts, listDummyJobs } from "@/lib/workflow/dummy-endpoints";

export const dynamic = "force-dynamic";

export default function BrowseJobsPage() {
  const jobs = listDummyJobs();
  const contracts = new Map(
    listDummyEscrowContracts().map((contract) => [contract.jobId, contract]),
  );

  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-4 py-8 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-[980px]">
        <p className="text-[13px] font-black uppercase text-[var(--text-muted)]">
          Freelancer
        </p>
        <h1 className="mt-2 text-[40px] font-black leading-none sm:text-[56px]">
          All jobs
        </h1>
        <p className="mt-4 max-w-[720px] text-[14px] leading-6 text-[var(--text-secondary)]">
          This page reads from the live in-memory workflow ledger, so it only shows jobs
          created in the current flow.
        </p>

        <div className="mt-6 grid gap-3">
          {jobs.length === 0 && (
            <article className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 text-[14px] leading-6 text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
              No jobs are in the live ledger yet. Create a job, fund escrow, and it will
              appear here for freelancers.
            </article>
          )}

          {jobs.map((job) => {
            const contract = contracts.get(job.id);
            const href =
              contract?.status === "locked" || contract?.status === "release_requested"
                ? `/submit-work?job=${encodeURIComponent(job.id)}`
                : "/my-jobs";

            return (
              <article
                className="grid gap-4 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:grid-cols-[1fr_160px_132px] sm:items-center"
                key={job.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[17px] font-black">{job.title}</h2>
                    <span className={statusClass(job.status)}>{formatStatus(job.status)}</span>
                    {contract && (
                      <span className={escrowClass(contract.status)}>
                        Escrow {formatStatus(contract.status)}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-[13px] leading-6 text-[var(--text-secondary)]">
                    {job.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase text-[var(--text-muted)]">
                    <span className="rounded-full bg-[var(--surface-strong)] px-2.5 py-1">
                      {job.id}
                    </span>
                    <span className="rounded-full bg-[var(--surface-strong)] px-2.5 py-1">
                      Budget {job.budget} ETH
                    </span>
                    <span className="rounded-full bg-[var(--surface-strong)] px-2.5 py-1">
                      Due {job.deadline}
                    </span>
                    <span className="rounded-full bg-[var(--surface-strong)] px-2.5 py-1">
                      {job.assignedTo ? "Assigned" : "Unassigned"}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                    Requirements
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-[var(--text-primary)]">
                    {job.requirements}
                  </p>
                </div>

                <Link
                  className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[var(--button)] px-4 text-[13px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)]"
                  href={href}
                >
                  {contract?.status === "locked" || contract?.status === "release_requested"
                    ? "Open submission"
                    : "Open workflow"}
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function statusClass(status: string) {
  if (status === "open") {
    return "rounded-full bg-[var(--surface-strong)] px-2.5 py-1 text-[11px] font-black uppercase text-[var(--text-muted)]";
  }

  if (status === "completed") {
    return "rounded-full bg-[var(--success-bg)] px-2.5 py-1 text-[11px] font-black uppercase text-[var(--success)]";
  }

  if (status === "cancelled" || status === "disputed") {
    return "rounded-full bg-rose-500/12 px-2.5 py-1 text-[11px] font-black uppercase text-rose-300";
  }

  return "rounded-full bg-amber-500/12 px-2.5 py-1 text-[11px] font-black uppercase text-amber-300";
}

function escrowClass(status: string) {
  if (status === "funded" || status === "locked" || status === "release_requested") {
    return "rounded-full bg-sky-500/12 px-2.5 py-1 text-[11px] font-black uppercase text-sky-300";
  }

  if (status === "released") {
    return "rounded-full bg-[var(--success-bg)] px-2.5 py-1 text-[11px] font-black uppercase text-[var(--success)]";
  }

  if (status === "refunded" || status === "cancelled") {
    return "rounded-full bg-rose-500/12 px-2.5 py-1 text-[11px] font-black uppercase text-rose-300";
  }

  return "rounded-full bg-[var(--surface-strong)] px-2.5 py-1 text-[11px] font-black uppercase text-[var(--text-muted)]";
}
