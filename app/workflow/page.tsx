import { PageHeader } from "@/components/page-header";
import { ReviewWorkbench } from "@/components/review-workbench";

export default function WorkflowPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="Workflow"
        title="Escrow journey storyboard"
        description="The full phone-frame flow is isolated here so the landing page stays readable while the product story remains easy to inspect."
      />
      <ReviewWorkbench />
    </main>
  );
}
