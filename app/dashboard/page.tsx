import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-4 py-10 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-[860px] rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 text-center shadow-[var(--shadow-soft)] sm:p-8">
        <p className="text-[13px] font-black uppercase text-[var(--success)]">
          Payment released
        </p>
        <h1 className="mt-3 text-[42px] font-black leading-none sm:text-[62px]">
          0.42 ETH
          <br />
          paid
        </h1>

        <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
          {[
            ["Job", "Landing page"],
            ["Proof", "Approved"],
            ["Escrow", "Released"],
          ].map(([label, value]) => (
            <div
              className="rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] p-4"
              key={label}
            >
              <p className="text-[12px] font-black uppercase text-[var(--text-muted)]">
                {label}
              </p>
              <p className="mt-2 text-[15px] font-black">{value}</p>
            </div>
          ))}
        </div>

        <Link
          className="mt-6 inline-flex h-[50px] w-full items-center justify-center rounded-[10px] border border-[var(--border-strong)] px-6 text-[15px] font-black text-[var(--text-primary)] sm:w-auto"
          href="/"
        >
          Back to start
        </Link>
      </section>
    </main>
  );
}
