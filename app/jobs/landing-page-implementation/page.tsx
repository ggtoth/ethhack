import Link from "next/link";

const requirements = ["Responsive landing page", "Deployed preview", "Source link"];

export default function JobDetailPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-4 py-10 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-[980px] gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-8">
          <p className="text-[13px] font-black uppercase text-[var(--text-muted)]">
            4. Job detail
          </p>
          <h1 className="mt-3 text-[42px] font-black leading-none sm:text-[62px]">
            Landing
            <br />
            page design
          </h1>

          <div className="mt-8 grid gap-3">
            {requirements.map((requirement) => (
              <div
                className="rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-4 py-3 text-[15px] font-black"
                key={requirement}
              >
                {requirement}
              </div>
            ))}
          </div>

          <Link
            className="mt-6 inline-flex h-[50px] w-full items-center justify-center rounded-[10px] bg-[var(--button)] px-6 text-[15px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)] sm:w-auto"
            href="/submit-work"
          >
            Accept job
          </Link>
        </div>

        <aside className="grid content-start gap-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5">
          <div>
            <p className="text-[13px] font-black uppercase text-[var(--text-muted)]">
              Escrow
            </p>
            <p className="mt-4 text-[38px] font-black leading-none">0.42 ETH</p>
          </div>
          <div className="rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] p-4">
            <p className="text-[12px] font-black uppercase text-[var(--success)]">Funded</p>
            <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
              Ready for freelancer proof.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
