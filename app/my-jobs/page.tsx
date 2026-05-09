import { JobLifecycleActions } from "@/components/job-lifecycle-actions";
import { PageHeader } from "@/components/page-header";
import { listDummyEscrowContracts, listDummyJobs } from "@/lib/workflow/dummy-endpoints";

export const dynamic = "force-dynamic";

const tabs = [
  "Open",
  "Funded",
  "Locked",
  "Submitted",
  "Release Requested",
  "Completed",
  "Disputed",
  "Cancelled",
];

export default function MyJobsPage() {
  const jobs = listDummyJobs();
  const contracts = new Map(
    listDummyEscrowContracts().map((contract) => [contract.jobId, contract]),
  );

  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="My Jobs"
        title="Client and freelancer work queues."
        description="This queue is now backed by the in-memory workflow and escrow ledger instead of static marketplace demo data."
      />
      <section className="mx-auto grid w-full max-w-[1180px] gap-4 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              className="h-9 rounded-[8px] border border-[var(--border)] px-4 text-[12px] font-bold text-[var(--text-secondary)] first:bg-[var(--surface-strong)] first:text-[var(--text-primary)]"
              key={tab}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
        {jobs.length === 0 && (
          <article className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 text-[14px] leading-6 text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
            No live jobs are stored yet. Create and fund a job to start the escrow flow.
          </article>
        )}
        {jobs.map((job) => {
          const contract = contracts.get(job.id);

          return (
            <article
              className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
              key={job.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-bold uppercase text-[var(--text-muted)]">
                    {job.id}
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
                    {job.title}
                  </h2>
                </div>
                <div className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-bold text-[var(--text-secondary)]">
                  {job.status.replaceAll("_", " ")}
                </div>
              </div>

              <p className="mt-4 text-[14px] leading-6 text-[var(--text-secondary)]">
                {job.description}
              </p>

              <div className="mt-6 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-4">
                <Metric label="Budget" value={`${job.budget} ETH`} />
                <Metric label="Deadline" value={job.deadline} />
                <Metric
                  label="Escrow"
                  value={contract?.status.replaceAll("_", " ") ?? "missing"}
                />
                <Metric
                  label="Tx"
                  value={
                    contract?.transactionHash
                      ? `${contract.transactionHash.slice(0, 10)}...`
                      : "pending"
                  }
                />
                <Metric
                  label="Submission"
                  value={job.submissionNotes ? "noted" : "pending"}
                />
              </div>

              <JobLifecycleActions contract={contract ?? null} job={job} />
            </article>
          );
        })}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-[13px] font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
