import Link from "next/link";

export function JobForm() {
  const fields = ["Job title", "Job description", "Requirements", "Budget", "Deadline", "Category"];

  return (
    <form className="grid gap-4 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      {fields.map((field) => (
        <label className="grid gap-2" key={field}>
          <span className="text-[12px] font-bold uppercase text-[var(--text-muted)]">
            {field}
          </span>
          <input
            className="h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)]"
            placeholder={field}
            readOnly
            value={field === "Budget" ? "0.42 ETH" : ""}
          />
        </label>
      ))}
      <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
        <p className="text-[13px] font-bold text-[var(--text-primary)]">Escrow confirmation</p>
        <p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)]">
          Wallet and smart contract integration will lock funds here in the next module.
        </p>
      </div>
      <Link
        className="inline-flex h-11 w-fit items-center rounded-[8px] bg-[var(--accent)] px-5 text-[13px] font-bold text-[var(--accent-contrast)]"
        href="/jobs/landing-page-implementation"
      >
        Review & Publish
      </Link>
    </form>
  );
}

export function SubmissionForm() {
  return (
    <form className="grid gap-4 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <label className="grid gap-2">
        <span className="text-[12px] font-bold uppercase text-[var(--text-muted)]">
          Submission text
        </span>
        <textarea
          className="min-h-32 rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)]"
          readOnly
          value="Implemented the responsive landing page, added reusable sections, and included deployment notes."
        />
      </label>
      <label className="grid gap-2">
        <span className="text-[12px] font-bold uppercase text-[var(--text-muted)]">
          Files and links
        </span>
        <input
          className="h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 text-[14px] text-[var(--text-primary)] outline-none"
          readOnly
          value="github.com/mira/smartjobs-landing"
        />
      </label>
      <Link
        className="inline-flex h-11 w-fit items-center rounded-[8px] bg-[var(--accent)] px-5 text-[13px] font-bold text-[var(--accent-contrast)]"
        href="/ai-review"
      >
        Submit Work
      </Link>
    </form>
  );
}
