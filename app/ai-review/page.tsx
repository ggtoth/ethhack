import Link from "next/link";

import { AIReviewCard } from "@/components/marketplace/ai-review-card";
import { PageHeader } from "@/components/page-header";

export default function AIReviewPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="AI Review Result"
        title="Review the recommendation before releasing escrow."
        description="AI prepares the score, matched requirements, missing elements, and risk flags. The client still makes the final decision."
      />
      <section className="mx-auto grid w-full max-w-[1180px] gap-4 px-4 pb-12 sm:px-6 lg:grid-cols-[1fr_300px] lg:px-8">
        <AIReviewCard />
        <aside className="grid content-start gap-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <Link className="inline-flex h-11 items-center justify-center rounded-[8px] bg-[var(--accent)] px-5 text-[13px] font-bold text-[var(--accent-contrast)]" href="/wallet">
            Approve & Pay
          </Link>
          <button className="h-11 rounded-[8px] border border-[var(--border-strong)] text-[13px] font-bold text-[var(--text-primary)]" type="button">
            Request Changes
          </button>
          <Link className="inline-flex h-11 items-center justify-center rounded-[8px] border border-[var(--border-strong)] px-5 text-[13px] font-bold text-[var(--text-primary)]" href="/disputes">
            Open Dispute
          </Link>
        </aside>
      </section>
    </main>
  );
}
