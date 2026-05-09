import Link from "next/link";

import { BidModeSelector } from "@/components/bid-mode-selector";
import { JobTopics } from "@/components/job-topics";

const requirements = ["Responsive landing page", "Deployed preview", "Source link"];

export default function JobDetailPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-4 py-4 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-[920px] gap-3 lg:grid-cols-[1fr_260px]">
        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)] sm:p-5">
          <p className="text-[12px] font-black uppercase text-[var(--success)]">
            Escrow funded
          </p>
          <h1 className="mt-2 text-[34px] font-black leading-none sm:text-[44px]">
            Ready for freelancer
          </h1>

          <div className="mt-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Job</p>
            <p className="mt-1 text-[17px] font-black text-[var(--text-primary)]">
              Landing page design
            </p>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {requirements.map((requirement) => (
              <div
                className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-[12px] font-black"
                key={requirement}
              >
                {requirement}
              </div>
            ))}
          </div>

          <JobTopics />

          <BidModeSelector />

          <Link
            className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-[11px] bg-[var(--button)] px-6 text-[13px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)] sm:w-auto"
            href="/jobs/landing-page-implementation/accepted"
          >
            Accept job
          </Link>
        </div>

        <aside className="grid content-start gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="rounded-[12px] bg-[var(--text-primary)] p-4 text-[var(--background)]">
            <p className="text-[11px] font-black uppercase opacity-65">Locked escrow</p>
            <p className="mt-2 text-[24px] font-black leading-none">1,500 USDT</p>
            <p className="mt-2 text-[11px] font-black opacity-65">Sepolia test funded</p>
          </div>

          <div className="rounded-[12px] border border-[var(--border-strong)] bg-[var(--success-bg)] p-3">
            <p className="text-[12px] font-black uppercase text-[var(--success)]">Funded</p>
            <p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)]">
              Payment is locked. Freelancer can start now.
            </p>
          </div>

          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
            <p className="text-[12px] font-black uppercase text-[var(--text-muted)]">
              Refund protected
            </p>
            <p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)]">
              If the delivery is not approved, the locked amount returns to the
              client.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
