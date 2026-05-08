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

export function ReviewConsole() {
  const jobId = "job_456";
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [jobDetailsError, setJobDetailsError] = useState<string | null>(null);
  const [sources, setSources] = useState<File[]>([]);
  const [previews, setPreviews] = useState<File[]>([]);
  const [submission, setSubmission] = useState<SubmissionState>({ status: "idle" });
  const canSubmit = Boolean(jobDetails) && sources.length > 0 && previews.length > 0;
  const fileSummary = useMemo(
    () => `${sources.length} source files · ${previews.length} delivery files`,
    [previews.length, sources.length],
  );

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || !jobDetails) {
      setSubmission({
        status: "error",
        message: "Load the job details and add at least one source file and one delivery file.",
      });
      return;
    }

    setSubmission({ status: "submitting" });

    const formData = new FormData();
    formData.set("jobId", jobDetails.id);
    formData.set("contractId", jobDetails.contractId);

    for (const source of sources) {
      formData.append("sources", source);
    }

    for (const preview of previews) {
      formData.append("previews", preview);
    }

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
  }

  return (
    <form
      className="mx-auto grid w-full max-w-[1120px] gap-5 px-4 pb-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8"
      onSubmit={handleSubmit}
    >
      <section className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className="text-[12px] font-bold text-[var(--text-primary)]">
              Job ID
            </span>
            <input
              className="h-10 rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)]"
              value={jobId}
              readOnly
            />
          </label>

          <label className="grid gap-2">
            <span className="text-[12px] font-bold text-[var(--text-primary)]">
              Contract ID
            </span>
            <input
              className="h-10 rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)]"
              value={jobDetails?.contractId ?? "Loading..."}
              readOnly
            />
          </label>

          <label className="grid gap-2">
            <span className="text-[12px] font-bold text-[var(--text-primary)]">
              Project requirements
            </span>
            <textarea
              className="min-h-28 resize-none rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-3 text-[13px] leading-6 text-[var(--text-primary)] outline-none focus:border-[var(--border-strong)]"
              value={
                jobDetails
                  ? `${jobDetails.title}\n\n${jobDetails.description}\n\n${jobDetails.requirements}`
                  : jobDetailsError ?? "Loading job details..."
              }
              readOnly
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <FileDrop
              files={sources}
              id="review-sources"
              label="Source images"
              onChange={setSources}
            />
            <FileDrop
              files={previews}
              id="review-previews"
              label="Delivery images"
              onChange={setPreviews}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-[var(--text-secondary)]">{fileSummary}</p>
            <button
              className="inline-flex h-10 items-center justify-center rounded-[8px] bg-[var(--accent)] px-4 text-[12px] font-bold text-[var(--accent-contrast)] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canSubmit || submission.status === "submitting"}
              type="submit"
            >
              {submission.status === "submitting" ? "Reviewing" : "Run AI review"}
            </button>
          </div>
        </div>
      </section>

      <aside className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Result</h2>
        {submission.status === "idle" && (
          <p className="mt-3 text-[13px] leading-6 text-[var(--text-secondary)]">
            The structured review response appears here after submission.
          </p>
        )}
        {submission.status === "error" && (
          <p className="mt-4 rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface-strong)] px-3 py-3 text-[13px] leading-6 text-[var(--text-primary)]">
            {submission.message}
          </p>
        )}
        {submission.status === "success" && (
          <div className="mt-4 grid gap-3">
            <Metric label="Confidence" value={submission.result.comparison_notes.confidence} />
            <Metric label="Files" value={String(submission.result.reviewed_files.length)} />
            <p className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-[13px] leading-6 text-[var(--text-secondary)]">
              {submission.result.user_visible.summary}
            </p>
          </div>
        )}
      </aside>
    </form>
  );
}

function FileDrop({
  files,
  id,
  label,
  onChange,
}: {
  files: File[];
  id: string;
  label: string;
  onChange: (files: File[]) => void;
}) {
  return (
    <label className="grid min-h-44 gap-3 rounded-[10px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-elevated)] p-4">
      <span className="text-[12px] font-bold text-[var(--text-primary)]">{label}</span>
      <input
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="block w-full text-[12px] text-[var(--text-secondary)] file:mr-3 file:h-8 file:rounded-[7px] file:border-0 file:bg-[var(--accent)] file:px-3 file:text-[11px] file:font-bold file:text-[var(--accent-contrast)]"
        id={id}
        multiple
        type="file"
        onChange={(event) => onChange(Array.from(event.target.files ?? []))}
      />
      <div className="grid gap-2">
        {files.length === 0 ? (
          <p className="text-[12px] text-[var(--text-muted)]">No files selected.</p>
        ) : (
          files.slice(0, 4).map((file) => (
            <div
              className="truncate rounded-[7px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12px] font-semibold text-[var(--text-secondary)]"
              key={`${file.name}-${file.lastModified}`}
            >
              {file.name}
            </div>
          ))
        )}
      </div>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
      <div className="text-[11px] font-bold uppercase text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

function isReviewResult(value: ReviewResult | { error?: string }): value is ReviewResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "schema_version" in value &&
    "verdicts" in value
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
