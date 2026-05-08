import { PageHeader } from "@/components/page-header";
import { SubmitWorkForm } from "@/components/submit-work-form";

type SubmitWorkPageProps = {
  searchParams: Promise<{ job?: string | string[]; jobId?: string | string[] }>;
};

export default async function SubmitWorkPage({ searchParams }: SubmitWorkPageProps) {
  const query = await searchParams;
  const jobId = getFirstQueryValue(query.job) ?? getFirstQueryValue(query.jobId) ?? "job_456";

  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="Submit Work"
        title="Submit work for AI review."
        description="Send delivered files for review. Job requirements are loaded from the protected job endpoint."
      />
      <SubmitWorkForm initialJobId={jobId} />
    </main>
  );
}

function getFirstQueryValue(value?: string | string[]) {
  const firstValue = Array.isArray(value) ? value[0] : value;
  const trimmed = firstValue?.trim();

  return trimmed ? trimmed : null;
}
