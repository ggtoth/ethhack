import Link from "next/link";

export default function AcceptedJobPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-4 py-10 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-[860px] gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">

        {/* Main card */}
        <article className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">

          {/* Checkmark */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--text-primary)]">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 11.5L9 16.5L18 7" stroke="var(--background)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <p className="mt-4 text-[11px] font-black uppercase text-[var(--success)]">Success</p>
          <h1 className="mt-1 text-[36px] font-black leading-tight sm:text-[42px]">
            Now wait for a<br />freelancer.
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-[var(--text-secondary)]">
            Your job is live. We will notify you as soon as someone sends a bid, offer, or message.
          </p>

          {/* Steps */}
          <div className="mt-6 grid gap-3">
            <div className="flex items-start gap-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--text-primary)] text-[11px] font-black text-[var(--background)]">
                1
              </span>
              <div>
                <p className="text-[13px] font-black text-[var(--text-primary)]">Published</p>
                <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">Your job is visible to freelancers.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--text-primary)] text-[11px] font-black text-[var(--background)]">
                2
              </span>
              <div>
                <p className="text-[13px] font-black text-[var(--text-primary)]">Wait</p>
                <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">We will notify you about every bid, offer, and message.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Link
              href="/inbox"
              className="inline-flex h-11 items-center justify-center rounded-[11px] bg-[var(--button)] px-6 text-[13px] font-black text-[var(--button-text)] transition hover:opacity-90"
            >
              Open inbox
            </Link>
            <Link
              href="/my-jobs"
              className="inline-flex h-11 items-center justify-center rounded-[11px] border border-[var(--border)] bg-[var(--surface-elevated)] px-6 text-[13px] font-black text-[var(--text-primary)] transition hover:border-[var(--text-primary)]"
            >
              Back to profile
            </Link>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="grid content-start gap-3">
          <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Active job</p>
            <p className="mt-2 text-[15px] font-black text-[var(--text-primary)]">Landing page design</p>

            <div className="mt-4 rounded-[12px] bg-[var(--text-primary)] p-4 text-[var(--background)]">
              <p className="text-[11px] font-black uppercase opacity-65">Escrow</p>
              <p className="mt-1 text-[24px] font-black leading-none">1,500 USDT</p>
              <p className="mt-1 text-[11px] font-black uppercase opacity-65">Funded</p>
            </div>

            <div className="mt-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3">
              <p className="text-[13px] font-black text-[var(--text-primary)]">Notifications are on.</p>
            </div>
          </div>
        </aside>

      </section>
    </main>
  );
}
