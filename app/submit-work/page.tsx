import { SubmissionForm } from "@/components/marketplace/forms";
import { PageHeader } from "@/components/page-header";

export default function SubmitWorkPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="Submit Work"
        title="Send the delivery package to review."
        description="Freelancers can attach notes, links, and files. The next module will connect uploads and trigger the AI review API."
      />
      <section className="mx-auto w-full max-w-[860px] px-4 pb-12 sm:px-6 lg:px-8">
        <SubmissionForm />
      </section>
    </main>
  );
}
