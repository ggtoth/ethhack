import Link from "next/link";

const jobs = [
  ["Landing page design", "0.42 ETH", "Funded"],
  ["Logo animation", "0.12 ETH", "Open"],
  ["Smart contract test", "0.8 ETH", "Open"],
];

export default function BrowseJobsPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-4 py-10 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-[980px]">
        <p className="text-[13px] font-black uppercase text-[var(--text-muted)]">3. Jobs</p>
        <h1 className="mt-3 text-[42px] font-black leading-none sm:text-[62px]">Pick work</h1>

        <div className="mt-8 grid gap-3">
          {jobs.map(([title, budget, status], index) => (
            <article
              className="grid gap-4 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:grid-cols-[1fr_120px_110px_120px] sm:items-center"
              key={title}
            >
              <h2 className="text-[16px] font-black">{title}</h2>
              <p className="text-[15px] font-black">{budget}</p>
              <p className="text-[12px] font-black uppercase text-[var(--success)]">{status}</p>
              <Link
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[var(--button)] px-4 text-[13px] font-black text-[var(--button-text)]"
                href={index === 0 ? "/jobs/landing-page-implementation" : "/post-job"}
              >
                View
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
