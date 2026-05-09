import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import {
  listDummyEscrowContracts,
  listDummyJobs,
} from "@/lib/workflow/dummy-endpoints";

export const dynamic = "force-dynamic";

export default function DebugLedgerPage() {
  const jobs = listDummyJobs();
  const contracts = listDummyEscrowContracts();
  const contractsByJobId = new Map(
    contracts.map((contract) => [contract.jobId, contract]),
  );

  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="Debug ledger"
        title="Current in-memory records."
        description="This page reads the ephemeral in-memory workflow store directly. Records reset when the server process restarts."
        actions={
          <Link
            className="inline-flex h-10 items-center rounded-[8px] border border-[var(--border-strong)] px-4 text-[12px] font-bold text-[var(--text-primary)]"
            href="/my-jobs"
          >
            Back to jobs
          </Link>
        }
      />

      <section className="mx-auto grid w-full max-w-[1180px] gap-6 px-4 pb-12 sm:px-6 lg:px-8">
        <Summary jobsCount={jobs.length} contractsCount={contracts.length} />

        <section className="grid gap-4">
          <SectionTitle
            count={jobs.length}
            title="Jobs"
            description="Workflow/UI state owned by the in-memory ledger."
          />

          {jobs.map((job) => {
            const contract = contractsByJobId.get(job.id);

            return (
              <article
                className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
                key={job.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-bold uppercase text-[var(--text-muted)]">
                      {job.id}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
                      {job.title}
                    </h2>
                  </div>
                  <StatusPill value={job.status} />
                </div>

                <p className="mt-4 text-[14px] leading-6 text-[var(--text-secondary)]">
                  {job.description}
                </p>

                <div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric label="Contract" value={job.contractId} />
                  <Metric label="Escrow state" value={contract?.status ?? "missing"} />
                  <Metric label="Budget" value={`${job.budget} ${contract?.currency ?? "ETH"}`} />
                  <Metric label="Deadline" value={job.deadline} />
                  <Metric label="Client" value={job.createdBy} />
                  <Metric label="Freelancer" value={job.assignedTo ?? "unassigned"} />
                  <Metric label="Preview" value={job.previewFile?.filename ?? "none"} />
                  <Metric
                    label="Preview verify"
                    value={formatVerificationStatus(job.previewFile)}
                  />
                  <Metric label="Final" value={job.finalFile?.filename ?? "none"} />
                  <Metric
                    label="Final verify"
                    value={formatVerificationStatus(job.finalFile)}
                  />
                  <Metric
                    label="Submitted sources"
                    value={String(job.submittedSourceFiles.length)}
                  />
                  <Metric
                    label="Source verify"
                    value={formatVerificationStatus(job.submittedSourceFiles[0] ?? null)}
                  />
                  <Metric
                    label="AI review"
                    value={job.aiReview?.verdict.replaceAll("_", " ") ?? "none"}
                  />
                  <Metric label="Created" value={formatDate(job.createdAt)} />
                  <Metric label="Updated" value={formatDate(job.updatedAt)} />
                </div>

                {job.submissionNotes && (
                  <p className="mt-4 rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-[13px] leading-5 text-[var(--text-secondary)]">
                    {job.submissionNotes}
                  </p>
                )}

                <div className="mt-4 grid gap-3">
                  <FileReferenceCard
                    title="Preview file"
                    file={job.previewFile}
                  />
                  <FileReferenceCard
                    title="Final file"
                    file={job.finalFile}
                  />
                  {job.submittedSourceFiles.map((file, index) => (
                    <FileReferenceCard
                      key={file.id}
                      title={`Submitted source ${index + 1}`}
                      file={file}
                    />
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-4">
          <SectionTitle
            count={contracts.length}
            title="Escrow Contracts"
            description="Local escrow ledger state plus tx hashes confirmed by the frontend wallet."
          />

          {contracts.map((contract) => (
            <article
              className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
              key={contract.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] font-bold uppercase text-[var(--text-muted)]">
                    {contract.id}
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
                    {contract.amount} {contract.currency}
                  </h2>
                </div>
                <StatusPill value={contract.status} />
              </div>

              <div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Job" value={contract.jobId} />
                <Metric label="Client" value={contract.clientId} />
                <Metric label="Freelancer" value={contract.freelancerId ?? "unassigned"} />
                <Metric label="Chain" value={contract.chainId?.toString() ?? "none"} />
                <Metric label="Escrow address" value={contract.escrowAddress ?? "none"} />
                <Metric
                  label="Client wallet"
                  value={contract.clientWalletAddress ?? "none"}
                />
                <Metric
                  label="Freelancer wallet"
                  value={contract.freelancerWalletAddress ?? "none"}
                />
                <Metric label="Latest tx" value={contract.transactionHash ?? "none"} />
                <Metric
                  label="Funding tx"
                  value={contract.fundingTransactionHash ?? "none"}
                />
                <Metric label="Lock tx" value={contract.lockTransactionHash ?? "none"} />
                <Metric
                  label="Release request tx"
                  value={contract.releaseRequestTransactionHash ?? "none"}
                />
                <Metric
                  label="Release tx"
                  value={contract.releaseTransactionHash ?? "none"}
                />
                <Metric label="Funded" value={formatNullableDate(contract.fundedAt)} />
                <Metric label="Locked" value={formatNullableDate(contract.lockedAt)} />
                <Metric
                  label="Release requested"
                  value={formatNullableDate(contract.releaseRequestedAt)}
                />
                <Metric label="Released" value={formatNullableDate(contract.releasedAt)} />
              </div>

              {contract.disputeReason && (
                <p className="mt-4 rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-[13px] leading-5 text-[var(--text-secondary)]">
                  {contract.disputeReason}
                </p>
              )}
            </article>
          ))}
        </section>

        <section className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <SectionTitle
            count={jobs.length + contracts.length}
            title="Raw JSON"
            description="Useful when you want to inspect every field exactly as stored."
          />
          <pre className="mt-4 max-h-[560px] overflow-auto rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-[12px] leading-5 text-[var(--text-secondary)]">
            {JSON.stringify({ jobs, contracts }, null, 2)}
          </pre>
        </section>
      </section>
    </main>
  );
}

function Summary({
  contractsCount,
  jobsCount,
}: {
  contractsCount: number;
  jobsCount: number;
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <SummaryCard label="Jobs" value={String(jobsCount)} />
      <SummaryCard label="Escrow contracts" value={String(contractsCount)} />
      <SummaryCard label="Persistence" value="in memory" />
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-bold uppercase text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-2 break-all text-2xl font-bold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

function SectionTitle({
  count,
  description,
  title,
}: {
  count: number;
  description: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-[12px] font-bold uppercase text-[var(--text-muted)]">
        {count} records
      </p>
      <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
      <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  return (
    <div className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] font-bold text-[var(--text-secondary)]">
      {value.replaceAll("_", " ")}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 truncate text-[13px] font-bold text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

function formatNullableDate(value: string | null) {
  return value ? formatDate(value) : "none";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatVerificationStatus(
  file:
    | {
        storageKind?: string;
        verification?: {
          status: string;
          kind: string;
        } | null;
      }
    | null
    | undefined,
) {
  if (!file) {
    return "none";
  }

  if (!file.verification) {
    return file.storageKind === "generic_url" || file.storageKind === undefined
      ? "generic"
      : "pending";
  }

  return `${file.verification.status} ${file.verification.kind.replaceAll("_", " ")}`;
}

function FileReferenceCard({
  file,
  title,
}: {
  file:
    | {
        id: string;
        filename: string;
        url: string;
        storageKind?: string;
        verification?: {
          status: string;
          kind: string;
          requestedUrl: string;
          gatewayUrl: string;
          resolvedReference: string | null;
          verifiedAt: string;
          details: {
            rootChunkReference?: string;
            manifestPath?: string | null;
            chunkCount?: number | null;
            notes?: string[];
          };
          error?: {
            code: string;
            message: string;
          } | null;
        } | null;
      }
    | null
    | undefined;
  title: string;
}) {
  if (!file) {
    return null;
  }

  const verification = file.verification;

  return (
    <section className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase text-[var(--text-muted)]">
            {title}
          </p>
          <p className="mt-1 text-[14px] font-bold text-[var(--text-primary)]">
            {file.filename}
          </p>
        </div>
        <StatusPill value={formatVerificationStatus(file)} />
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <ReferenceField label="File ID" value={file.id} />
        <ReferenceField label="Storage kind" value={file.storageKind ?? "generic_url"} />
        <ReferenceField label="Stored URL" value={file.url} />
        <ReferenceField
          label="Requested Swarm URL"
          value={verification?.requestedUrl ?? "none"}
        />
        <ReferenceField
          label="Resolved reference"
          value={verification?.resolvedReference ?? "none"}
        />
        <ReferenceField
          label="Root chunk reference"
          value={verification?.details.rootChunkReference ?? "none"}
        />
        <ReferenceField
          label="Gateway"
          value={verification?.gatewayUrl ?? "none"}
        />
        <ReferenceField
          label="Verified at"
          value={verification ? formatDate(verification.verifiedAt) : "none"}
        />
        <ReferenceField
          label="Chunk count"
          value={
            verification?.details.chunkCount === undefined ||
            verification?.details.chunkCount === null
              ? "none"
              : String(verification.details.chunkCount)
          }
        />
        <ReferenceField
          label="Manifest path"
          value={verification?.details.manifestPath ?? "none"}
        />
      </dl>

      {verification?.details.notes && verification.details.notes.length > 0 && (
        <p className="mt-3 text-[12px] leading-5 text-[var(--text-secondary)]">
          {verification.details.notes.join(" ")}
        </p>
      )}

      {verification?.error && (
        <p className="mt-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-3 text-[12px] leading-5 text-[var(--text-secondary)]">
          {verification.error.code}: {verification.error.message}
        </p>
      )}
    </section>
  );
}

function ReferenceField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase text-[var(--text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 break-all text-[13px] font-bold text-[var(--text-primary)]">
        {value}
      </dd>
    </div>
  );
}
