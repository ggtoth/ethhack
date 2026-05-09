import Link from "next/link";

const jobs = [
  {
    budget: "1,500 USDT",
    href: "/jobs/landing-page-implementation",
    status: "Funded",
    tags: ["Landing page", "Frontend", "Escrow"],
    title: "Landing page design",
  },
  {
    budget: "420 USDT",
    href: "/jobs/landing-page-implementation",
    status: "Open",
    tags: ["Motion", "Branding"],
    title: "Logo animation",
  },
  {
    budget: "800 USDT",
    href: "/jobs/landing-page-implementation",
    status: "Open",
    tags: ["Smart contract", "Testing"],
    title: "Smart contract test",
  },
];

export default function BrowseJobsPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-4 py-8 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-[980px]">
        <p className="text-[13px] font-black uppercase text-[var(--text-muted)]">
          Freelancer
        </p>
        <h1 className="mt-2 text-[40px] font-black leading-none sm:text-[56px]">
          Available jobs
        </h1>

        <div className="mt-6 grid gap-3">
          {jobs.map((job, index) => (
            <article
              className={`grid gap-4 rounded-[14px] border bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:grid-cols-[1fr_140px_116px] sm:items-center ${
                index === 0 ? "border-[var(--border-strong)]" : "border-[var(--border)]"
              }`}
              key={job.title}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[17px] font-black">{job.title}</h2>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${
                      job.status === "Funded"
                        ? "bg-[var(--success-bg)] text-[var(--success)]"
                        : "bg-[var(--surface-strong)] text-[var(--text-muted)]"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.tags.map((tag) => (
                    <span
                      className="rounded-full bg-[var(--surface-strong)] px-2.5 py-1 text-[11px] font-black"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                  Escrow
                </p>
                <p className="mt-1 text-[17px] font-black">{job.budget}</p>
              </div>

              <Link
                className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[var(--button)] px-4 text-[13px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)]"
                href={job.href}
              >
                View job
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
