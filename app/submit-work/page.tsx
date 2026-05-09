import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { SubmitWorkForm } from "@/components/submit-work-form";
import { getDummyJobWithContract } from "@/lib/workflow/dummy-endpoints";

export const dynamic = "force-dynamic";

type SubmitWorkPageProps = {
  searchParams: Promise<{ job?: string | string[]; jobId?: string | string[] }>;
};

export default async function SubmitWorkPage({ searchParams }: SubmitWorkPageProps) {
  const query = await searchParams;
  const jobId = getFirstQueryValue(query.job) ?? getFirstQueryValue(query.jobId) ?? "job_456";
  const record = getDummyJobWithContract(jobId);

  if (!record) {
    notFound();
  }

  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-4 py-10 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Submit Work"
        title="Freelancer proof package."
        description="This page keeps the existing proof submission shape, but now reads and writes the in-memory workflow ledger for the selected job."
      />
      <SubmitWorkForm record={record} />
    </main>
  );
}

function getFirstQueryValue(value?: string | string[]) {
  const firstValue = Array.isArray(value) ? value[0] : value;
  const trimmed = firstValue?.trim();

  return trimmed ? trimmed : null;
}
