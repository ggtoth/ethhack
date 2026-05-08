import Link from "next/link";

import { WorkflowStepper } from "@/components/marketplace/workflow-stepper";
import { workflowSteps } from "@/lib/marketplace-data";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <section className="mx-auto grid w-full max-w-[1180px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8 lg:py-16">
        <div className="max-w-3xl">
          <p className="text-[12px] font-bold uppercase text-[var(--text-muted)]">
            AI Escrow Protocol
          </p>
          <h1 className="mt-4 text-5xl font-bold leading-tight text-[var(--text-primary)] sm:text-6xl">
            AI Escrow Protocol
          </h1>
          <p className="mt-5 text-xl font-semibold text-[var(--text-primary)]">
            Get your work done, resolved by AI.
          </p>
          <p className="mt-5 max-w-2xl text-[16px] leading-8 text-[var(--text-secondary)]">
            SmartJobs is a crypto freelancer marketplace prototype where clients lock
            funds in escrow, freelancers submit work, and AI prepares a structured
            review before the client makes the final decision.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="inline-flex h-11 items-center rounded-[8px] bg-[var(--accent)] px-5 text-[13px] font-bold text-[var(--accent-contrast)]"
              href="/post-job"
            >
              Create Job
            </Link>
            <Link
              className="inline-flex h-11 items-center rounded-[8px] border border-[var(--border-strong)] px-5 text-[13px] font-bold text-[var(--text-primary)]"
              href="/browse-jobs"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
        <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <p className="text-[12px] font-bold uppercase text-[var(--text-muted)]">
                Live MVP flow
              </p>
              <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                Landing page implementation
              </p>
            </div>
            <span className="rounded-full bg-[var(--success-bg)] px-3 py-1 text-[11px] font-bold text-[var(--success)]">
              Funded
            </span>
          </div>
          <div className="mt-5 grid gap-3">
            {workflowSteps.map((step, index) => (
              <div className="flex items-center gap-3" key={step}>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent)] text-[12px] font-bold text-[var(--accent-contrast)]">
                  {index + 1}
                </span>
                <span className="text-[13px] font-bold text-[var(--text-primary)]">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-12 sm:px-6 lg:px-8">
        <WorkflowStepper steps={workflowSteps} activeIndex={5} />
      </section>

      <section className="mx-auto grid w-full max-w-[1180px] gap-4 px-4 pb-14 sm:px-6 md:grid-cols-3 lg:px-8">
        {[
          ["Secure crypto escrow", "Client funds are locked before work begins."],
          ["AI-assisted review", "Submissions are scored against the original brief."],
          ["Human final decision", "The client approves, requests changes, or disputes."],
        ].map(([title, body]) => (
          <article
            className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
            key={title}
          >
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
            <p className="mt-3 text-[14px] leading-6 text-[var(--text-secondary)]">{body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
