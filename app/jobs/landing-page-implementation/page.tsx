import Link from "next/link";

const deliverables = ["Responsive page", "Preview link", "Source files"];
const tags = ["Landing page", "Frontend", "Web3 UI"];

export default function JobDetailPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-4 py-6 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-[940px] gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <article className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--success-bg)] px-3 py-1 text-[11px] font-black uppercase text-[var(--success)]">
              Funded
            </span>
            <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-[11px] font-black uppercase text-[var(--text-muted)]">
              Fixed escrow
            </span>
          </div>

          <h1 className="mt-4 max-w-[620px] text-[34px] font-black leading-none sm:text-[46px]">
            Landing page design
          </h1>
          <p className="mt-4 max-w-[620px] text-[15px] leading-7 text-[var(--text-secondary)]">
            Orbit Labs needs a polished responsive landing page for a Web3
            product. The work should include a deployed preview and the final
            source package for AI review.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                className="rounded-full bg-[var(--surface-strong)] px-3 py-1.5 text-[12px] font-black"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {deliverables.map((deliverable) => (
              <div
                className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3"
                key={deliverable}
              >
                <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                  Deliverable
                </p>
                <p className="mt-1 text-[14px] font-black">{deliverable}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <p className="text-[12px] font-black uppercase text-[var(--text-muted)]">
              Client note
            </p>
            <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
              Keep the design clean, fast, and mobile-ready. Final files can be
              submitted through the freelancer delivery screen.
            </p>
          </div>

          <Link
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-[11px] bg-[var(--button)] px-6 text-[13px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)] sm:w-auto"
            href="/submit-work"
          >
            Accept job
          </Link>
        </article>

        <aside className="grid content-start gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="rounded-[12px] bg-[var(--text-primary)] p-4 text-[var(--background)]">
            <p className="text-[11px] font-black uppercase opacity-65">Escrow</p>
            <p className="mt-2 text-[24px] font-black leading-none">1,500 USDT</p>
            <p className="mt-2 text-[11px] font-black opacity-65">Locked</p>
          </div>

          <div className="rounded-[12px] border border-[var(--border-strong)] bg-[var(--success-bg)] p-3">
            <p className="text-[12px] font-black uppercase text-[var(--success)]">Ready</p>
            <p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)]">
              Payment is locked before work starts.
            </p>
          </div>

          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
            <p className="text-[12px] font-black uppercase text-[var(--text-muted)]">Protected</p>
            <p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)]">
              If the work is not approved, escrow can be returned to the client.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
