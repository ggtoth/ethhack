import Link from "next/link";

const steps = [
  ["Published", "Your job is visible to freelancers."],
  ["Wait", "We will notify you about every bid, offer, and message."],
];

export default function AcceptedJobPage() {
  return (
    <main className="flex flex-1 bg-[var(--background)] px-4 py-8 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-[760px] gap-4 lg:grid-cols-[1fr_240px]">
        <div className="accepted-card rounded-[16px] p-5 sm:p-6">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--text-primary)] text-xl font-black text-[var(--background)]">
            ✓
          </div>

          <p className="mt-5 text-[12px] font-black uppercase text-[var(--text-muted)]">
            Success
          </p>
          <h1 className="mt-2 max-w-[520px] text-3xl font-black leading-tight sm:text-4xl">
            Now wait for a freelancer.
          </h1>
          <p className="mt-4 max-w-[500px] text-[15px] leading-6 text-[var(--text-secondary)]">
            Your job is live. We will notify you as soon as someone sends a
            bid, offer, or message.
          </p>

          <div className="mt-6 grid gap-3">
            {steps.map(([title, body], index) => (
              <article
                className="flex items-start gap-3 rounded-[12px] bg-[var(--surface-strong)] p-3.5"
                key={title}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--text-primary)] text-[12px] font-black text-[var(--background)]">
                  {index + 1}
                </span>
                <div>
                  <h2 className="text-[14px] font-black">{title}</h2>
                  <p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]">
                    {body}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-[12px] bg-[var(--button)] px-5 text-[13px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)]"
              href="/messages"
            >
              Open inbox
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-5 text-[13px] font-black text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
              href="/profile?view=customer"
            >
              Back to profile
            </Link>
          </div>
        </div>

        <aside className="accepted-card self-start rounded-[16px] p-4">
          <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
            Active job
          </p>
          <h2 className="mt-2 text-lg font-black leading-tight">
            Landing page design
          </h2>
          <div className="mt-4 rounded-[12px] bg-[var(--text-primary)] p-4 text-[var(--background)]">
            <p className="text-[11px] font-black uppercase opacity-65">
              Escrow
            </p>
            <p className="mt-1 text-2xl font-black leading-none">1,500 USDT</p>
            <p className="mt-2 text-[11px] font-black uppercase opacity-70">
              Funded
            </p>
          </div>
          <p className="mt-4 rounded-[12px] bg-[var(--surface-strong)] p-3 text-[13px] font-black leading-5 text-[var(--text-primary)]">
            Notifications are on.
          </p>
        </aside>
      </section>

      <AcceptedStyles />
    </main>
  );
}

function AcceptedStyles() {
  return (
    <style>{`
      .accepted-card {
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.58)),
          color-mix(in srgb, var(--surface) 88%, white);
        border: 1px solid rgba(20, 26, 35, 0.08);
        box-shadow:
          0 24px 64px rgba(15, 23, 42, 0.055),
          inset 0 1px 0 rgba(255, 255, 255, 0.72);
      }

      :root[data-theme="dark"] .accepted-card {
        background:
          linear-gradient(180deg, rgba(32, 36, 43, 0.72), rgba(25, 27, 32, 0.58)),
          var(--surface);
        border-color: var(--border);
      }
    `}</style>
  );
}
