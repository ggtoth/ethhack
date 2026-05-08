import Link from "next/link";

import { JobStatusBadge } from "@/components/marketplace/status-badge";
import type { Job } from "@/lib/marketplace-data";

export function JobCard({ job }: { job: Job }) {
  return (
    <article className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold uppercase text-[var(--text-muted)]">
            {job.category}
          </p>
          <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">{job.title}</h2>
        </div>
        <JobStatusBadge status={job.status} />
      </div>
      <p className="mt-4 text-[14px] leading-6 text-[var(--text-secondary)]">
        {job.description}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {job.skills.map((skill) => (
          <span
            className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-semibold text-[var(--text-secondary)]"
            key={skill}
          >
            {skill}
          </span>
        ))}
      </div>
      <div className="mt-6 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-4">
        <Metric label="Budget" value={job.budget} />
        <Metric label="Deadline" value={job.deadline} />
        <Metric label="Client" value={job.client} />
        <Metric label="Rating" value={job.clientRating} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          className="inline-flex h-10 items-center rounded-[8px] bg-[var(--accent)] px-4 text-[12px] font-bold text-[var(--accent-contrast)]"
          href={`/jobs/${job.id}`}
        >
          View Job
        </Link>
        <Link
          className="inline-flex h-10 items-center rounded-[8px] border border-[var(--border-strong)] px-4 text-[12px] font-bold text-[var(--text-primary)]"
          href="/submit-work"
        >
          Apply
        </Link>
      </div>
    </article>
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
