import Link from "next/link";

const requirements = ["Responsive landing page", "Deployed preview", "Source link"];

export default function JobDetailPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-4 py-8 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-[920px] gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-7">
          <p className="text-[12px] font-black uppercase text-[var(--success)]">
            Escrow funded
          </p>
          <h1 className="mt-3 text-[38px] font-black leading-none sm:text-[54px]">
            Ready for
            <br />
            freelancer
          </h1>

          <div className="mt-6 rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Job</p>
            <p className="mt-2 text-[18px] font-black text-[var(--text-primary)]">
              Landing page design
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            {requirements.map((requirement) => (
              <div
                className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-[14px] font-black"
                key={requirement}
              >
                {requirement}
              </div>
            ))}
          </div>

          <Link
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-[var(--button)] px-6 text-[13px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)] sm:w-auto"
            href="/submit-work"
          >
            Accept job
          </Link>
        </div>

        <aside className="grid content-start gap-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="rounded-[14px] bg-[var(--text-primary)] p-4 text-[var(--background)]">
            <p className="text-[11px] font-black uppercase opacity-65">Locked escrow</p>
            <p className="mt-2 text-[26px] font-black leading-none">1,500 USDT</p>
            <p className="mt-2 text-[12px] font-black opacity-65">Sepolia test funded</p>
          </div>

          <div className="rounded-[12px] border border-[var(--border-strong)] bg-[var(--success-bg)] p-4">
            <p className="text-[12px] font-black uppercase text-[var(--success)]">Funded</p>
            <p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)]">
              Payment is locked. Freelancer can start now.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
