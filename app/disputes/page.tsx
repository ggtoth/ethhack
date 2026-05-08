import { PageHeader } from "@/components/page-header";

export default function DisputesPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="Disputes"
        title="Evidence-ready dispute queue."
        description="Future arbitrators will review client messages, freelancer submissions, AI review output, and payment state here."
      />
      <section className="mx-auto w-full max-w-[960px] px-4 pb-12 sm:px-6 lg:px-8">
        <article className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Footer contrast disagreement</h2>
              <p className="mt-2 text-[14px] text-[var(--text-secondary)]">Landing page implementation</p>
            </div>
            <span className="rounded-full bg-[rgba(245,158,11,0.14)] px-3 py-1 text-[11px] font-bold text-[#d97706]">
              Evidence collecting
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {["Client message", "Freelancer submission", "AI review", "Payment status"].map((item) => (
              <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-[13px] font-bold text-[var(--text-primary)]" key={item}>
                {item}
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
