import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { PreviewCard } from "@/components/preview-card";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="AI escrow protocol"
        title="A cleaner workspace for escrow, review, and delivery flows."
        description="SmartJobs is now split into focused pages: a visual workflow storyboard, a real review console, and project states for escrow work."
        actions={
          <>
            <Link
              className="inline-flex h-10 items-center rounded-[8px] bg-[var(--accent)] px-4 text-[12px] font-bold text-[var(--accent-contrast)]"
              href="/workflow"
            >
              View workflow
            </Link>
            <Link
              className="inline-flex h-10 items-center rounded-[8px] border border-[var(--border-strong)] px-4 text-[12px] font-bold text-[var(--text-primary)]"
              href="/review"
            >
              Run review
            </Link>
          </>
        }
      />

      <section className="mx-auto grid w-full max-w-[1120px] gap-4 px-4 pb-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <PreviewCard
          description="The original phone-frame product journey, kept as a dedicated storyboard page."
          href="/workflow"
          meta="Storyboard"
          title="Workflow"
        >
          <MiniWorkflowPreview />
        </PreviewCard>
        <PreviewCard
          description="A focused upload and AI review surface connected to the existing review API."
          href="/review"
          meta="Workbench"
          title="Review console"
        >
          <MiniReviewPreview />
        </PreviewCard>
        <PreviewCard
          description="Project-level escrow states, approval status, budget, and delivery summary."
          href="/projects"
          meta="Operations"
          title="Projects"
        >
          <MiniProjectPreview />
        </PreviewCard>
      </section>
    </main>
  );
}

function MiniWorkflowPreview() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map((item) => (
        <div
          className="aspect-[9/16] rounded-[9px] border border-[var(--border)] bg-[var(--surface-elevated)] p-2"
          key={item}
        >
          <div className="h-2 w-8 rounded-full bg-[var(--surface-strong)]" />
          <div className="mt-8 h-3 rounded-full bg-[var(--accent)]" />
          <div className="mt-3 h-2 rounded-full bg-[var(--surface-strong)]" />
        </div>
      ))}
    </div>
  );
}

function MiniReviewPreview() {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
      <div className="h-20 rounded-[8px] border border-[var(--border)] bg-[var(--surface)]" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="h-10 rounded-[7px] bg-[var(--surface-strong)]" />
        <div className="h-10 rounded-[7px] bg-[var(--surface-strong)]" />
      </div>
      <div className="mt-3 h-9 rounded-[7px] bg-[var(--accent)]" />
    </div>
  );
}

function MiniProjectPreview() {
  return (
    <div className="grid gap-2">
      {["Posted", "Review", "Paid"].map((state) => (
        <div
          className="flex items-center justify-between rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2"
          key={state}
        >
          <span className="text-[11px] font-bold text-[var(--text-primary)]">{state}</span>
          <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
        </div>
      ))}
    </div>
  );
}
