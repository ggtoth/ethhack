"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import type { ReviewResult } from "@/lib/review/schema";

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; result: ReviewResult }
  | { status: "error"; message: string };

type JobDetails = {
  id: string;
  contractId: string;
  title: string;
  description: string;
  requirements: string;
};

const verdictTone = {
  MATCH: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  PARTIAL_MATCH: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  MISMATCH: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  INSUFFICIENT_EVIDENCE:
    "border-[var(--border-strong)] bg-[var(--surface-strong)] text-[var(--text-secondary)]",
};

export function SubmitWorkForm({ initialJobId }: { initialJobId: string }) {
  const jobId = initialJobId;
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [jobDetailsError, setJobDetailsError] = useState<string | null>(null);
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [submission, setSubmission] = useState<SubmissionState>({
    status: "idle",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadJobDetails() {
      try {
        const response = await fetch(`/jobs/${encodeURIComponent(jobId)}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as JobDetails | { error?: string };

        if (!response.ok || !isJobDetails(payload)) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : "The job details could not be loaded.",
          );
        }

        if (isMounted) {
          setJobDetails(payload);
          setJobDetailsError(null);
        }
      } catch (error) {
        if (isMounted) {
          setJobDetails(null);
          setJobDetailsError(
            error instanceof Error
              ? error.message
              : "The job details could not be loaded.",
          );
        }
      }
    }

    loadJobDetails();

    return () => {
      isMounted = false;
    };
  }, [jobId]);

  const canSubmit =
    Boolean(jobDetails) && sourceFiles.length > 0 && submission.status !== "submitting";

  const packageSummary = useMemo(
    () =>
      `${sourceFiles.length} work file${sourceFiles.length === 1 ? "" : "s"} / ${
        previewFiles.length
      } preview${previewFiles.length === 1 ? "" : "s"}`,
    [previewFiles.length, sourceFiles.length],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || !jobDetails) {
      setSubmission({
        status: "error",
        message: "Load the job details and add at least one submitted work file.",
      });
      return;
    }

    setSubmission({ status: "submitting" });

    const formData = new FormData();
    formData.set("jobId", jobDetails.id);
    formData.set("contractId", jobDetails.contractId);

    for (const source of sourceFiles) {
      formData.append("sources", source);
    }

    for (const preview of previewFiles) {
      formData.append("previews", preview);
    }

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as ReviewResult | { error?: string };

      if (!response.ok || !isReviewResult(payload)) {
        setSubmission({
          status: "error",
          message:
            "error" in payload
              ? payload.error || "The review request failed."
              : "The review request failed.",
        });
        return;
      }

      setSubmission({ status: "success", result: payload });
    } catch (error) {
      setSubmission({
        status: "error",
        message: error instanceof Error ? error.message : "The review request failed.",
      });
    }
  }

  return (
    <form
      className="mx-auto grid w-full max-w-[1120px] gap-5 px-4 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5">
        <section className="grid gap-4 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-[12px] font-bold uppercase text-[var(--text-muted)]">
                Job ID
              </span>
              <input
                className="h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)]"
                value={jobId}
                readOnly
              />
            </label>
            <label className="grid gap-2">
              <span className="text-[12px] font-bold uppercase text-[var(--text-muted)]">
                Contract ID
              </span>
              <input
                className="h-11 rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 text-[14px] text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)]"
                value={jobDetails?.contractId ?? "Loading..."}
                readOnly
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-[12px] font-bold uppercase text-[var(--text-muted)]">
              Project requirements
            </span>
            <textarea
              className="min-h-36 resize-none rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-[14px] leading-6 text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)]"
              value={
                jobDetails
                  ? `${jobDetails.title}\n\n${jobDetails.description}\n\n${jobDetails.requirements}`
                  : jobDetailsError ?? "Loading job details..."
              }
              readOnly
            />
          </label>
        </section>

        <section className="grid gap-4 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] md:grid-cols-2">
          <FileInputPanel
            files={sourceFiles}
            id="submitted-work-files"
            label="Submitted work files"
            required
            onChange={setSourceFiles}
          />
          <FileInputPanel
            files={previewFiles}
            id="submitted-preview-files"
            label="Preview files"
            onChange={setPreviewFiles}
          />
        </section>

        <div className="flex flex-col gap-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-bold text-[var(--text-primary)]">
              {packageSummary}
            </p>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
              The review returns the machine-readable JSON verdict.
            </p>
          </div>
          <button
            className="inline-flex h-11 items-center justify-center rounded-[8px] bg-[var(--accent)] px-5 text-[13px] font-bold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
            type="submit"
          >
            {submission.status === "submitting" ? "Reviewing" : "Run AI review"}
          </button>
        </div>
      </div>

      <ResultPanel submission={submission} />
    </form>
  );
}

function FileInputPanel({
  files,
  id,
  label,
  required,
  onChange,
}: {
  files: File[];
  id: string;
  label: string;
  required?: boolean;
  onChange: (files: File[]) => void;
}) {
  return (
    <div className="grid min-h-52 content-start gap-3 rounded-[8px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-elevated)] p-4">
      <div className="flex items-center justify-between gap-3">
        <label
          className="text-[12px] font-bold uppercase text-[var(--text-muted)]"
          htmlFor={id}
        >
          {label}
        </label>
        <span className="rounded-full border border-[var(--border)] px-2 py-1 text-[11px] font-bold text-[var(--text-secondary)]">
          {required ? "Required" : "Optional"}
        </span>
      </div>
      <input
        className="block w-full text-[12px] text-[var(--text-secondary)] file:mr-3 file:h-9 file:rounded-[7px] file:border-0 file:bg-[var(--accent)] file:px-3 file:text-[11px] file:font-bold file:text-[var(--accent-contrast)]"
        id={id}
        multiple
        type="file"
        onChange={(event) => onChange(Array.from(event.target.files ?? []))}
      />
      <div className="grid gap-2">
        {files.length === 0 ? (
          <p className="text-[12px] text-[var(--text-muted)]">No files selected.</p>
        ) : (
          files.map((file, index) => (
            <div
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[7px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
              key={`${file.name}-${file.lastModified}-${index}`}
            >
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">
                  {file.name}
                </p>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  {formatBytes(file.size)}
                </p>
              </div>
              <button
                className="h-8 rounded-[7px] border border-[var(--border)] px-2 text-[11px] font-bold text-[var(--text-secondary)]"
                type="button"
                onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ResultPanel({ submission }: { submission: SubmissionState }) {
  return (
    <aside className="grid min-w-0 content-start gap-4 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">AI review</h2>
        <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
          Verdicts and evidence appear after submission.
        </p>
      </div>

      {submission.status === "idle" && (
        <StatusBox>Ready for the submitted work package.</StatusBox>
      )}

      {submission.status === "submitting" && <StatusBox>Review in progress.</StatusBox>}

      {submission.status === "error" && (
        <StatusBox tone="error">{submission.message}</StatusBox>
      )}

      {submission.status === "success" && (
        <div className="grid min-w-0 gap-4">
          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <p className="text-[11px] font-bold uppercase text-[var(--text-muted)]">
              Summary
            </p>
            <p className="mt-2 text-[13px] leading-6 text-[var(--text-primary)]">
              {submission.result.user_visible.summary}
            </p>
          </div>

          <div className="grid gap-2">
            <VerdictRow
              label="Preview vs source"
              verdict={submission.result.verdicts.preview_vs_source}
            />
            <VerdictRow
              label="Preview vs requirements"
              verdict={submission.result.verdicts.preview_vs_description}
            />
            <VerdictRow
              label="Source vs requirements"
              verdict={submission.result.verdicts.source_vs_description}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Metric
              label="Confidence"
              value={submission.result.comparison_notes.confidence}
            />
            <Metric
              label="Files"
              value={String(submission.result.reviewed_files.length)}
            />
          </div>

          {submission.result.comparison_notes.key_gaps.length > 0 && (
            <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
              <p className="text-[11px] font-bold uppercase text-[var(--text-muted)]">
                Key gaps
              </p>
              <ul className="mt-2 grid gap-2">
                {submission.result.comparison_notes.key_gaps.map((gap) => (
                  <li
                    className="text-[12px] leading-5 text-[var(--text-secondary)]"
                    key={gap}
                  >
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <details className="min-w-0 overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <summary className="cursor-pointer text-[12px] font-bold text-[var(--text-primary)]">
              JSON response
            </summary>
            <pre className="mt-3 max-h-[420px] min-w-0 max-w-full overflow-auto whitespace-pre-wrap break-words rounded-[7px] bg-[var(--surface)] p-3 text-[11px] leading-5 text-[var(--text-secondary)]">
              {JSON.stringify(submission.result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </aside>
  );
}

function VerdictRow({
  label,
  verdict,
}: {
  label: string;
  verdict: ReviewResult["verdicts"]["preview_vs_source"];
}) {
  return (
    <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] font-bold text-[var(--text-primary)]">{label}</p>
        <span
          className={`rounded-full border px-2 py-1 text-[10px] font-bold ${verdictTone[verdict.verdict]}`}
        >
          {verdict.verdict.replaceAll("_", " ")}
        </span>
      </div>
      <p className="mt-2 text-[12px] leading-5 text-[var(--text-secondary)]">
        {verdict.reason}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
      <p className="text-[11px] font-bold uppercase text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function StatusBox({
  children,
  tone = "default",
}: {
  children: string;
  tone?: "default" | "error";
}) {
  return (
    <div
      className={`rounded-[8px] border px-3 py-3 text-[13px] leading-6 ${
        tone === "error"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
          : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]"
      }`}
    >
      {children}
    </div>
  );
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function isReviewResult(value: ReviewResult | { error?: string }): value is ReviewResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "schema_version" in value &&
    "verdicts" in value &&
    "reviewed_files" in value
  );
}

function isJobDetails(value: JobDetails | { error?: string }): value is JobDetails {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "contractId" in value &&
    "requirements" in value
  );
}
