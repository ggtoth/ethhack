import type { JobStatus } from "@/lib/marketplace-data";

const tones: Partial<Record<JobStatus, string>> = {
  Open: "bg-[var(--surface-strong)] text-[var(--text-primary)]",
  Funded: "bg-[var(--success-bg)] text-[var(--success)]",
  "In Progress": "bg-[var(--ai-bg)] text-[var(--ai)]",
  Submitted: "bg-[var(--surface-strong)] text-[var(--text-primary)]",
  "AI Reviewing": "bg-[var(--ai-bg)] text-[var(--ai)]",
  "Awaiting Client Decision": "bg-[var(--ai-bg)] text-[var(--ai)]",
  Approved: "bg-[var(--success-bg)] text-[var(--success)]",
  "Payment Released": "bg-[var(--success-bg)] text-[var(--success)]",
  Completed: "bg-[var(--success-bg)] text-[var(--success)]",
  Disputed: "bg-[rgba(245,158,11,0.14)] text-[#d97706]",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-3 text-[11px] font-bold ${tones[status] ?? "bg-[var(--surface-strong)] text-[var(--text-secondary)]"}`}
    >
      {status}
    </span>
  );
}
