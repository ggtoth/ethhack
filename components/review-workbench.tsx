"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";

import type { ReviewResult } from "@/lib/review/schema";

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; result: ReviewResult }
  | { status: "error"; message: string };

const steps = [
  "Create Job",
  "Describe Job",
  "Job Posted",
  "Work Submitted",
  "AI Decision",
  "Completed",
];

export function ReviewWorkbench() {
  const [jobId] = useState("job_demo_workflow");
  const [description, setDescription] = useState(
    "Write a Python function that adds two numbers and returns the result.",
  );
  const [sources, setSources] = useState<File[]>([]);
  const [previews, setPreviews] = useState<File[]>([]);
  const [pairings, setPairings] = useState<Record<string, string>>({});
  const [submission, setSubmission] = useState<SubmissionState>({
    status: "idle",
  });

  const canSubmit = sources.length > 0 && previews.length > 0;
  const sourceOptions = useMemo(
    () =>
      sources.map((file, index) => ({
        clientId: `source_${index + 1}`,
        label: file.name,
      })),
    [sources],
  );
  const previewRows = useMemo(
    () =>
      previews.map((file, index) => ({
        clientId: `preview_${index + 1}`,
        label: file.name,
      })),
    [previews],
  );
  const activePairings = useMemo(() => {
    const next: Record<string, string> = {};
    const validPreviewIds = new Set(previewRows.map((row) => row.clientId));
    const validSourceIds = new Set(sourceOptions.map((row) => row.clientId));

    for (const [previewId, sourceId] of Object.entries(pairings)) {
      if (validPreviewIds.has(previewId) && validSourceIds.has(sourceId)) {
        next[previewId] = sourceId;
      }
    }

    return next;
  }, [pairings, previewRows, sourceOptions]);

  const score =
    submission.status === "success"
      ? Math.round(submission.result.overall_confidence * 100)
      : submission.status === "error"
        ? 61
        : 87;
  const scoreCopy =
    submission.status === "success"
      ? submission.result.user_visible_summary
      : submission.status === "error"
        ? submission.message
        : "The work meets the requirements and all tests passed.";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setSubmission({
        status: "error",
        message: "Add source and preview files before requesting AI review.",
      });
      return;
    }

    setSubmission({ status: "submitting" });

    const formData = new FormData();
    formData.set("jobId", jobId);
    formData.set("description", description);
    formData.set(
      "pairings",
      JSON.stringify(
        Object.entries(activePairings).map(([preview_client_id, source_client_id]) => ({
          preview_client_id,
          source_client_id,
        })),
      ),
    );

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
    <div className="w-full bg-[var(--background)] text-[var(--text-primary)]">
      <div className="mx-auto flex w-full max-w-[1760px] flex-col px-5 pb-10 pt-5 sm:px-8 lg:px-10">
        <div className="mb-7 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-bold uppercase text-[var(--foreground)]">
              Desktop workflow
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:flex lg:items-start lg:gap-5">
            <StepShell index={1} title={steps[0]}>
              <CreateJob />
            </StepShell>
            <FlowArrow />
            <StepShell index={2} title={steps[1]}>
              <DescribeJob
                description={description}
                onDescriptionChange={setDescription}
              />
            </StepShell>
            <FlowArrow />
            <StepShell index={3} title={steps[2]}>
              <PostedJob description={description} />
            </StepShell>
            <FlowArrow />
            <StepShell index={4} title={steps[3]}>
              <SubmittedWork
                activePairings={activePairings}
                pairings={pairings}
                previews={previews}
                previewRows={previewRows}
                sourceOptions={sourceOptions}
                sources={sources}
                onPairingsChange={setPairings}
                onPreviewsChange={setPreviews}
                onSourcesChange={setSources}
              />
            </StepShell>
            <FlowArrow />
            <StepShell index={5} title={steps[4]}>
              <AiDecision
                canSubmit={canSubmit}
                score={score}
                scoreCopy={scoreCopy}
                submission={submission}
              />
            </StepShell>
            <FlowArrow />
            <StepShell index={6} title={steps[5]}>
              <Completed score={score} submission={submission} />
            </StepShell>
          </div>

          <ProcessRail />
        </form>
      </div>
    </div>
  );
}

function StepShell({
  children,
  index,
  title,
}: {
  children: ReactNode;
  index: number;
  title: string;
}) {
  return (
    <section className="min-w-0 lg:w-[245px] lg:shrink-0">
      <div className="mb-4 text-[13px] font-bold text-[var(--text-secondary)]">
        {index}. {title}
      </div>
      <PhoneFrame>{children}</PhoneFrame>
    </section>
  );
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[300px] flex-col overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-soft)] sm:h-[390px] sm:p-4 lg:h-[520px] lg:p-5">
      {children}
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="mt-[270px] hidden w-5 shrink-0 items-center justify-center text-[24px] leading-none text-[var(--text-muted)] lg:flex">
      -&gt;
    </div>
  );
}

function MiniHeader({ back }: { back?: boolean }) {
  return (
    <div className="mb-8 flex h-7 items-center justify-between text-[10px] font-semibold text-[var(--text-secondary)] lg:mb-10">
      <div className="flex items-center gap-2">
        {back ? (
          <span>&lt; Back</span>
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-[7px] border border-[var(--border)] bg-[var(--button)] text-[var(--button-text)]">
            AI
          </span>
        )}
      </div>
      {!back && (
        <div className="hidden items-center gap-4 lg:flex">
          <span>Jobs</span>
          <span>How it works</span>
        </div>
      )}
      <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--icon-neutral)] text-[var(--text-secondary)]">
        A
      </span>
    </div>
  );
}

function CreateJob() {
  return (
    <>
      <MiniHeader />
      <div className="flex flex-1 flex-col items-center text-center">
        <h2 className="mt-5 max-w-[170px] text-[21px] font-bold leading-[1.22] text-[var(--foreground)] lg:text-[28px]">
          AI Escrow Protocol
        </h2>
        <p className="mt-4 max-w-[150px] text-[12px] leading-5 text-[var(--text-secondary)]">
          Get your work done, resolved by AI.
        </p>
        <div className="mt-6 w-full max-w-[140px]">
          <PrimaryButton type="button">Create Job</PrimaryButton>
        </div>
        <div className="mt-auto grid w-full grid-cols-3 gap-2">
          <IconFeature icon="□" label="Secure payments" />
          <IconFeature icon="*" label="AI arbitration" />
          <IconFeature icon="○" label="Fair for both" />
        </div>
      </div>
    </>
  );
}

function DescribeJob({
  description,
  onDescriptionChange,
}: {
  description: string;
  onDescriptionChange: (value: string) => void;
}) {
  return (
    <>
      <MiniHeader back />
      <div className="flex min-h-0 flex-1 flex-col">
        <h2 className="text-center text-[19px] font-bold text-[var(--foreground)]">
          Describe your job
        </h2>
        <Label className="mt-8">What do you need?</Label>
        <div className="relative mt-2">
          <textarea
            className="h-[110px] w-full resize-none rounded-[8px] border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-3 text-[12px] font-medium leading-5 text-[var(--foreground)] outline-none focus:border-[var(--border-strong)]"
            maxLength={200}
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
          />
          <span className="absolute bottom-3 right-3 text-[9px] font-medium text-[var(--text-muted)]">
            {description.length}/200
          </span>
        </div>
        <Label className="mt-5">Budget</Label>
        <input
          className="mt-2 h-10 rounded-[8px] border border-[var(--border)] bg-[var(--card-elevated)] px-4 text-[12px] font-semibold text-[var(--foreground)] outline-none"
          readOnly
          value="$100"
        />
        <Label className="mt-5">Freelancer (optional)</Label>
        <div className="mt-2 flex h-10 items-center justify-between rounded-[8px] border border-[var(--border)] bg-[var(--card-elevated)] px-4 text-[12px] font-semibold text-[var(--foreground)]">
          <span>Alex</span>
          <span className="text-[var(--text-muted)]">v</span>
        </div>
        <div className="mt-auto">
          <PrimaryButton type="button">Post Job</PrimaryButton>
        </div>
      </div>
    </>
  );
}

function PostedJob({ description }: { description: string }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="pt-14 text-center">
        <StatusIcon tone="success">✓</StatusIcon>
        <h2 className="mt-5 text-[19px] font-bold text-[var(--foreground)]">
          Job posted!
        </h2>
        <p className="mx-auto mt-3 max-w-[175px] text-[12px] leading-5 text-[var(--text-secondary)]">
          Alex has been notified. You will be able to review the work once it is
          submitted.
        </p>
      </div>
      <div className="mt-8 rounded-[10px] border border-[var(--border)] bg-[var(--card-elevated)] p-4">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span>Job summary</span>
          <span className="text-[var(--ai)]">Edit</span>
        </div>
        <p className="mt-4 line-clamp-3 text-[12px] font-medium leading-5 text-[var(--text-secondary)]">
          {description}
        </p>
        <InfoRow label="Budget" value="$100" />
        <InfoRow label="Freelancer" value="Alex" />
      </div>
      <div className="mt-auto">
        <SecondaryButton type="button">View Job</SecondaryButton>
      </div>
    </div>
  );
}

function SubmittedWork({
  activePairings,
  pairings,
  previews,
  previewRows,
  sourceOptions,
  sources,
  onPairingsChange,
  onPreviewsChange,
  onSourcesChange,
}: {
  activePairings: Record<string, string>;
  pairings: Record<string, string>;
  previews: File[];
  previewRows: Array<{ clientId: string; label: string }>;
  sourceOptions: Array<{ clientId: string; label: string }>;
  sources: File[];
  onPairingsChange: (pairings: Record<string, string>) => void;
  onPreviewsChange: (files: File[]) => void;
  onSourcesChange: (files: File[]) => void;
}) {
  return (
    <div className="flex flex-1 flex-col text-center">
      <div className="pt-20">
        <StatusIcon tone="ai">□</StatusIcon>
        <h2 className="mt-5 text-[19px] font-bold text-[var(--foreground)]">
          Work submitted!
        </h2>
        <p className="mx-auto mt-3 max-w-[175px] text-[12px] leading-5 text-[var(--text-secondary)]">
          Alex has submitted the work. Review it or ask AI to evaluate.
        </p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2 text-left">
        <FilePicker
          accept="image/png,image/jpeg,image/webp,image/gif"
          files={sources}
          id="sources"
          label="Source"
          onChange={onSourcesChange}
        />
        <FilePicker
          accept="image/png,image/jpeg,image/webp,image/gif"
          files={previews}
          id="previews"
          label="Work"
          onChange={onPreviewsChange}
        />
      </div>
      {previewRows.length > 0 && (
        <select
          className="mt-2 h-8 rounded-[7px] border border-[var(--border)] bg-[var(--card-elevated)] px-2 text-[10px] text-[var(--foreground)] outline-none"
          value={activePairings[previewRows[0].clientId] ?? ""}
          onChange={(event) => {
            const next = { ...pairings };
            const selected = event.target.value;

            if (!selected) {
              delete next[previewRows[0].clientId];
            } else {
              next[previewRows[0].clientId] = selected;
            }

            onPairingsChange(next);
          }}
        >
          <option value="">Auto-match delivery</option>
          {sourceOptions.map((sourceOption) => (
            <option key={sourceOption.clientId} value={sourceOption.clientId}>
              {sourceOption.label}
            </option>
          ))}
        </select>
      )}
      <div className="mt-auto">
        <PrimaryButton type="submit">Review with AI</PrimaryButton>
        <button
          className="mt-4 text-[11px] font-bold text-[var(--ai)]"
          type="button"
        >
          View Submission
        </button>
      </div>
    </div>
  );
}

function AiDecision({
  canSubmit,
  score,
  scoreCopy,
  submission,
}: {
  canSubmit: boolean;
  score: number;
  scoreCopy: string;
  submission: SubmissionState;
}) {
  return (
    <div className="flex flex-1 flex-col text-center">
      <div className="pt-14">
        <StatusIcon tone="success">◎</StatusIcon>
        <h2 className="mx-auto mt-5 max-w-[170px] text-[19px] font-bold leading-[1.25] text-[var(--foreground)]">
          AI recommends approval
        </h2>
      </div>
      <div className="mt-6 rounded-[10px] border border-[var(--border)] bg-[var(--card-elevated)] p-4">
        <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
          Score
        </div>
        <div className="mt-2 text-[34px] font-bold leading-none text-[var(--foreground)]">
          {score}
          <span className="text-[15px] text-[var(--text-secondary)]"> / 100</span>
        </div>
      </div>
      <p className="mx-auto mt-5 line-clamp-3 max-w-[175px] text-[12px] leading-5 text-[var(--text-secondary)]">
        {scoreCopy}
      </p>
      <details className="mt-6 rounded-[8px] border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-3 text-left">
        <summary className="cursor-pointer text-[11px] font-bold text-[var(--foreground)]">
          AI Reasoning
        </summary>
        <p className="mt-2 text-[11px] leading-4 text-[var(--text-secondary)]">
          Source, submitted work, and brief are compared before escrow release.
        </p>
      </details>
      <div className="mt-auto grid grid-cols-[1fr_1.25fr] gap-2">
        <SecondaryButton type="button">Request Changes</SecondaryButton>
        <PrimaryButton disabled={!canSubmit || submission.status === "submitting"} type="submit">
          {submission.status === "submitting" ? "Reviewing" : "Approve & Pay"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function Completed({
  score,
  submission,
}: {
  score: number;
  submission: SubmissionState;
}) {
  const released = submission.status === "success" && score >= 70;

  return (
    <div className="flex flex-1 flex-col text-center">
      <div className="pt-24">
        <StatusIcon tone="success">✓</StatusIcon>
        <h2 className="mt-6 text-[19px] font-bold text-[var(--foreground)]">
          {released ? "Payment released!" : "Payment released!"}
        </h2>
        <p className="mx-auto mt-3 max-w-[150px] text-[12px] leading-5 text-[var(--text-secondary)]">
          Alex has been paid. Thank you!
        </p>
      </div>
      <div className="mt-auto">
        <PrimaryButton type="button">Done</PrimaryButton>
        <button
          className="mt-5 text-[11px] font-bold text-[var(--ai)]"
          type="button"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

function ProcessRail() {
  const rail = [
    ["How it works", ""],
    ["1. Create Job", "Post a job and set your budget."],
    ["2. Submit Work", "Freelancer submits the work for review."],
    ["3. AI Evaluates", "AI checks quality and gives a score."],
    ["4. Decision", "Approve, request changes, or ask AI again."],
    ["5. Payment", "If approved, payment is released automatically."],
  ];

  return (
    <div className="mt-7 hidden max-w-[1360px] rounded-[12px] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-card)] lg:grid lg:grid-cols-6">
      {rail.map(([title, copy], index) => (
        <div
          className="flex items-center gap-3 border-r border-[var(--border)] px-3 last:border-r-0"
          key={title}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] border border-[var(--border)] text-[15px] text-[var(--foreground)]">
            {index === 0 ? "?" : index}
          </span>
          <div>
            <div className="text-[11px] font-bold text-[var(--foreground)]">{title}</div>
            {copy && (
              <div className="mt-1 text-[10px] leading-4 text-[var(--text-secondary)]">
                {copy}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function FilePicker({
  accept,
  files,
  id,
  label,
  onChange,
}: {
  accept: string;
  files: File[];
  id: string;
  label: string;
  onChange: (files: File[]) => void;
}) {
  return (
    <label className="block rounded-[8px] border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-2">
      <span className="flex items-center justify-between text-[10px] font-bold text-[var(--foreground)]">
        <span>{label}</span>
        <span className="text-[var(--text-muted)]">{files.length}</span>
      </span>
      <input
        accept={accept}
        className="mt-2 block w-full text-[9px] text-[var(--text-muted)] file:mr-2 file:h-6 file:rounded-[6px] file:border-0 file:bg-[var(--button)] file:px-2 file:text-[9px] file:font-bold file:text-[var(--button-text)]"
        id={id}
        multiple
        type="file"
        onChange={(event) => onChange(Array.from(event.target.files ?? []))}
      />
    </label>
  );
}

function IconFeature({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="text-center">
      <span className="mx-auto grid h-9 w-9 place-items-center rounded-[8px] border border-[var(--border)] bg-[var(--card-elevated)] text-[14px] font-bold text-[var(--foreground)]">
        {icon}
      </span>
      <span className="mt-2 block text-[9px] font-medium text-[var(--text-secondary)]">
        {label}
      </span>
    </div>
  );
}

function StatusIcon({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "success" | "ai";
}) {
  return (
    <span
      className={`mx-auto grid h-14 w-14 place-items-center rounded-full text-[24px] font-bold ${
        tone === "success"
          ? "bg-[var(--success-bg)] text-[var(--success)]"
          : "bg-[var(--ai-bg)] text-[var(--ai)]"
      }`}
    >
      {children}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 flex items-center justify-between text-[12px]">
      <span className="font-semibold text-[var(--text-secondary)]">{label}</span>
      <span className="max-w-[105px] truncate font-bold text-[var(--foreground)]">
        {value}
      </span>
    </div>
  );
}

function Label({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-[11px] font-bold text-[var(--foreground)] ${className}`}>
      {children}
    </label>
  );
}

function PrimaryButton({
  children,
  disabled,
  type,
}: {
  children: ReactNode;
  disabled?: boolean;
  type: "button" | "submit";
}) {
  return (
    <button
      className="inline-flex h-10 w-full items-center justify-center rounded-[7px] bg-[var(--button)] px-3 text-[12px] font-bold text-[var(--button-text)] shadow-[0_1px_0_rgba(255,255,255,0.12)_inset] transition disabled:cursor-not-allowed disabled:opacity-45"
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  type,
}: {
  children: ReactNode;
  type: "button" | "submit";
}) {
  return (
    <button
      className="inline-flex h-10 w-full items-center justify-center rounded-[7px] border border-[var(--secondary-button-border)] bg-[var(--secondary-button)] px-3 text-[12px] font-bold text-[var(--secondary-button-text)]"
      type={type}
    >
      {children}
    </button>
  );
}

function isReviewResult(value: ReviewResult | { error?: string }): value is ReviewResult {
  return "comparisons" in value && Array.isArray(value.comparisons);
}
