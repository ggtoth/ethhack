import { PageHeader } from "@/components/page-header";
import { WorkflowStepper } from "@/components/marketplace/workflow-stepper";
import { clientWorkflow, freelancerWorkflow, workflowSteps } from "@/lib/marketplace-data";

export default function HowItWorksPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="How it works"
        title="Escrow first, AI review second, client decision last."
        description="The platform protects both sides: payment is locked before work starts, AI summarizes delivery quality, and the client keeps the final approval decision."
      />
      <section className="mx-auto w-full max-w-[1180px] px-4 pb-8 sm:px-6 lg:px-8">
        <WorkflowStepper steps={workflowSteps} activeIndex={5} />
      </section>
      <section className="mx-auto grid w-full max-w-[1180px] gap-4 px-4 pb-12 sm:px-6 md:grid-cols-2 lg:px-8">
        <WorkflowList title="Client workflow" items={clientWorkflow} />
        <WorkflowList title="Freelancer workflow" items={freelancerWorkflow} />
      </section>
    </main>
  );
}

function WorkflowList({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
      <ol className="mt-5 grid gap-3">
        {items.map((item, index) => (
          <li className="flex gap-3 text-[14px] text-[var(--text-secondary)]" key={item}>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--surface-strong)] text-[11px] font-bold text-[var(--text-primary)]">
              {index + 1}
            </span>
            <span className="pt-1">{item}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
