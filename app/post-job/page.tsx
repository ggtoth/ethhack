import { JobForm } from "@/components/marketplace/forms";
import { PageHeader } from "@/components/page-header";

const steps = ["Job basics", "Requirements", "Budget & deadline", "Escrow", "Review"];

export default function PostJobPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="Post a Job"
        title="Create a funded job brief."
        description="This mock form prepares the future wallet, escrow contract, file upload, and publishing flow without needing backend integration yet."
      />
      <section className="mx-auto grid w-full max-w-[1180px] gap-4 px-4 pb-12 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
        <aside className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5">
          {steps.map((step, index) => (
            <div className="flex gap-3 pb-4 last:pb-0" key={step}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--surface-strong)] text-[12px] font-bold text-[var(--text-primary)]">
                {index + 1}
              </span>
              <span className="pt-2 text-[13px] font-bold text-[var(--text-primary)]">{step}</span>
            </div>
          ))}
        </aside>
        <JobForm />
      </section>
    </main>
  );
}
