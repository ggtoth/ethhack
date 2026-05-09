import Link from "next/link";
import { notFound } from "next/navigation";

import { getDummyJobWithContract } from "@/lib/workflow/dummy-endpoints";

type AIReviewPageProps = {
  searchParams: Promise<{ job?: string | string[]; jobId?: string | string[] }>;
};

export default async function AIReviewPage({ searchParams }: AIReviewPageProps) {
  const query = await searchParams;
  const jobId = getFirstQueryValue(query.job) ?? getFirstQueryValue(query.jobId) ?? "job_456";
  const record = getDummyJobWithContract(jobId);

  if (!record) {
    notFound();
  }

  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-4 py-10 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-[1080px] gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-8">
          <p className="text-[13px] font-black uppercase text-[var(--text-muted)]">
            6. AI proof review
          </p>
          <h1 className="mt-3 text-[42px] font-black leading-none sm:text-[62px]">
            {record.job.aiReview ? Math.round(record.job.aiReview.score * 100) : "No"}
            <br />
            {record.job.aiReview ? "score" : "review"}
          </h1>

          <div className="mt-8 grid gap-3">
            <LedgerRow label="Job ID" value={record.job.id} />
            <LedgerRow label="Contract ID" value={record.contract.id} />
            <LedgerRow
              label="Escrow state"
              value={record.contract.status.replaceAll("_", " ")}
            />
            <LedgerRow label="Requirements" value={record.job.requirements} />
            <LedgerRow
              label="Preview file"
              value={record.job.previewFile?.url ?? "No preview file submitted."}
            />
            <LedgerRow
              label="Preview verification"
              value={formatVerification(record.job.previewFile)}
            />
            <LedgerRow
              label="Final file"
              value={record.job.finalFile?.url ?? "No final file submitted."}
            />
            <LedgerRow
              label="Final verification"
              value={formatVerification(record.job.finalFile)}
            />
            <LedgerRow
              label="Submitted source files"
              value={
                record.job.submittedSourceFiles.length > 0
                  ? record.job.submittedSourceFiles.map((file) => file.url).join(", ")
                  : "No source package submitted."
              }
            />
            <LedgerRow
              label="Source verification"
              value={formatVerification(record.job.submittedSourceFiles[0] ?? null)}
            />
            <LedgerRow
              label="Submission notes"
              value={record.job.submissionNotes ?? "No submission notes stored."}
            />
            <LedgerRow
              label="Dispute reason"
              value={record.contract.disputeReason ?? "No dispute is open."}
            />
          </div>
        </div>

        <aside className="grid content-start gap-4 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5">
          <div>
            <p className="text-[13px] font-black uppercase text-[var(--text-muted)]">
              Recommendation
            </p>
            <p className="mt-4 text-[34px] font-black leading-none">
              {record.job.aiReview?.verdict?.replaceAll("_", " ") ?? "Pending"}
            </p>
          </div>
          <p className="text-[14px] leading-6 text-[var(--text-secondary)]">
            {record.job.aiReview?.summary ??
              "No AI review has been stored in the ledger yet. The review route will still use this job and escrow context when you submit files."}
          </p>
          <Link
            className="inline-flex h-[50px] items-center justify-center rounded-[10px] bg-[var(--button)] px-6 text-[15px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)]"
            href={`/submit-work?job=${record.job.id}`}
          >
            Update submission
          </Link>
          <Link
            className="inline-flex h-[50px] items-center justify-center rounded-[10px] border border-[var(--border-strong)] px-6 text-[15px] font-black text-[var(--text-primary)]"
            href="/review"
          >
            Open review console
          </Link>
        </aside>
      </section>
    </main>
  );
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] p-4">
      <p className="text-[12px] font-black uppercase text-[var(--text-muted)]">
        {label}
      </p>
      <p className="text-[15px] leading-6 text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function getFirstQueryValue(value?: string | string[]) {
  const firstValue = Array.isArray(value) ? value[0] : value;
  const trimmed = firstValue?.trim();

  return trimmed ? trimmed : null;
}

function formatVerification(
  file:
    | {
        storageKind?: string;
        verification?: {
          status: string;
          kind: string;
          resolvedReference: string | null;
        } | null;
      }
    | null
    | undefined,
) {
  if (!file) {
    return "No file";
  }

  if (!file.verification) {
    return file.storageKind === "generic_url" || file.storageKind === undefined
      ? "Generic URL"
      : "Not verified";
  }

  const reference = file.verification.resolvedReference
    ? ` (${file.verification.resolvedReference.slice(0, 12)}...)`
    : "";

  return `${file.verification.status} ${file.verification.kind.replaceAll("_", " ")}${reference}`;
}
