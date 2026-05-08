import Link from "next/link";

const checks = [
  ["Responsive landing page", "Matched"],
  ["Deployed preview", "Matched"],
  ["Source link", "Matched"],
];

export default function AIReviewPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-4 py-10 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-[980px] gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-8">
          <p className="text-[13px] font-black uppercase text-[var(--text-muted)]">
            6. AI proof review
          </p>
          <h1 className="mt-3 text-[42px] font-black leading-none sm:text-[62px]">
            Score
            <br />
            92/100
          </h1>

          <div className="mt-8 grid gap-3">
            {checks.map(([label, status]) => (
              <div
                className="grid gap-2 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] p-4 sm:grid-cols-[1fr_100px] sm:items-center"
                key={label}
              >
                <p className="text-[15px] font-black">{label}</p>
                <p className="text-[12px] font-black uppercase text-[var(--success)]">
                  {status}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="grid content-start gap-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5">
          <div>
            <p className="text-[13px] font-black uppercase text-[var(--text-muted)]">
              Recommendation
            </p>
            <p className="mt-4 text-[34px] font-black leading-none">Approve</p>
          </div>
          <Link
            className="inline-flex h-[50px] items-center justify-center rounded-[10px] bg-[var(--button)] px-6 text-[15px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)]"
            href="/dashboard"
          >
            Release 0.42 ETH
          </Link>
          <button
            className="h-[50px] rounded-[10px] border border-[var(--border-strong)] text-[15px] font-black text-[var(--text-primary)]"
            type="button"
          >
            Request changes
          </button>
        </aside>
      </section>
    </main>
  );
}
