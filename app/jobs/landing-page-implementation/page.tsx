import Link from "next/link";

import { JobStatusBadge } from "@/components/marketplace/status-badge";
import { WorkflowStepper } from "@/components/marketplace/workflow-stepper";
import { PageHeader } from "@/components/page-header";
import { jobs, workflowSteps } from "@/lib/marketplace-data";

const job = jobs[0];

export default function JobDetailPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="Job detail"
        title={job.title}
        description={job.description}
        actions={<JobStatusBadge status={job.status} />}
      />
      <section className="mx-auto grid w-full max-w-[1180px] gap-4 px-4 pb-12 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <div className="grid gap-4">
          <WorkflowStepper steps={workflowSteps} activeIndex={2} />
          <article className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Requirements</h2>
            <ul className="mt-4 grid gap-3">
              {job.requirements.map((requirement) => (
                <li className="text-[14px] leading-6 text-[var(--text-secondary)]" key={requirement}>
                  {requirement}
                </li>
              ))}
            </ul>
          </article>
        </div>
        <aside className="grid gap-4">
          <article className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Escrow status</h2>
            <p className="mt-4 text-3xl font-bold text-[var(--text-primary)]">{job.budget}</p>
            <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
              Funds locked, release pending client approval.
            </p>
          </article>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-[8px] bg-[var(--accent)] px-5 text-[13px] font-bold text-[var(--accent-contrast)]"
            href="/submit-work"
          >
            Submit Work
          </Link>
        </aside>
      </section>
    </main>
  );
}
