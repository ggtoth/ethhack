import Link from "next/link";

export default function Home() {
  const steps = [
    {
      title: "Create brief",
      body: "Describe the work and set the ETH budget.",
      action: "Start",
      href: "/wallet",
    },
    {
      title: "Fund escrow",
      body: "Connect wallet and lock payment before work starts.",
      action: "Connect",
      href: "/wallet",
    },
    {
      title: "Submit work",
      body: "Freelancer adds proof links and notes.",
      action: "Proof",
      href: "/submit-work",
    },
    {
      title: "Review and release",
      body: "AI checks proof. Client releases escrow.",
      action: "Review",
      href: "/ai-review",
    },
  ];

  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] font-mono text-[var(--text-primary)]">
      <section className="mx-auto flex w-full max-w-[1040px] flex-col items-center px-4 pb-10 pt-12 text-center sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
        <h1 className="max-w-[620px] text-[44px] font-black leading-[0.98] tracking-normal text-[var(--text-primary)] sm:text-[64px] lg:text-[68px]">
          Crypto
          <br />
          freelance
          <br />
          escrow
        </h1>
        <p className="mt-6 max-w-[760px] text-[15px] leading-7 text-[var(--text-secondary)] sm:text-[16px]">
          Hire work. Lock payment. Approve proof.
        </p>
        <div className="mt-5 flex w-full max-w-[340px] gap-3 sm:w-auto sm:max-w-none">
          <Link
            className="inline-flex h-[50px] flex-1 items-center justify-center rounded-[10px] bg-[var(--button)] px-10 text-[15px] font-black text-[var(--button-text)] shadow-none transition hover:bg-[var(--accent-hover)] sm:w-40 sm:flex-none"
            href="/wallet"
          >
            Start
          </Link>
          <Link
            className="inline-flex h-[50px] flex-1 items-center justify-center rounded-[10px] border border-[var(--border-strong)] bg-transparent px-9 text-[15px] font-black text-[var(--text-primary)] transition hover:bg-[var(--surface)] sm:w-40 sm:flex-none"
            href="/browse-jobs"
          >
            Jobs
          </Link>
        </div>

        <div className="mt-8 w-full rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 text-left shadow-[var(--shadow-soft)] sm:mt-9 sm:p-6">
          <div className="text-center">
            <p className="text-[13px] text-[var(--text-muted)]">Demo flow</p>
            <h2 className="mt-2 text-[15px] font-black text-[var(--text-primary)]">
              Step by step
            </h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <article className="rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] p-4 sm:p-5">
              <h3 className="text-[14px] font-black uppercase text-[var(--text-primary)]">
                How it works
              </h3>
              <p className="mt-3 text-[15px] leading-7 text-[var(--text-secondary)]">
                Client posts a job. Freelancer submits proof. AI checks it. Escrow gets
                released.
              </p>
            </article>
            <article className="rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] p-4 sm:p-5">
              <h3 className="text-[14px] font-black uppercase text-[var(--text-primary)]">
                Why escrow
              </h3>
              <p className="mt-3 text-[15px] leading-7 text-[var(--text-secondary)]">
                Payment is locked before work starts. Release happens after proof review.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[980px] px-4 pb-16 sm:px-6 lg:px-8">
        <p className="mb-4 text-center text-[13px] text-[var(--text-muted)]">
          One path. One job. One escrow release.
        </p>
        <div className="relative grid gap-3 pl-5 sm:gap-4 sm:pl-7">
          <span className="absolute bottom-8 left-[9px] top-3 w-px bg-[var(--border)] sm:left-[13px]" />
          {steps.map((step, index) => (
            <article
              className="relative rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] p-4 text-left sm:p-5"
              key={step.title}
            >
              <span className="absolute -left-[26px] top-4 h-5 w-5 rounded-full border-[6px] border-[var(--surface-strong)] bg-[var(--text-primary)] sm:-left-[34px]" />
              <h3 className="text-[15px] font-black text-[var(--text-primary)]">
                {index + 1}. {step.title}
              </h3>
              <p className="mt-2 text-[15px] leading-7 text-[var(--text-secondary)]">
                {step.body}
              </p>
              <Link
                className="mt-4 inline-flex h-[42px] items-center rounded-[9px] bg-[var(--button)] px-4 text-[13px] font-black uppercase text-[var(--button-text)] transition hover:bg-[var(--accent-hover)]"
                href={step.href}
              >
                {step.action}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
