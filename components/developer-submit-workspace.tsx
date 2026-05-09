"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { getAddress } from "viem";

import type { ReviewResult } from "@/lib/review/schema";
import { ensureSepoliaNetwork, getEthereumProvider } from "@/lib/wallet/ethereum";

type FlowStep = "accepted" | "submitted" | "reviewed";

type StoredFile = {
  id: string;
  url: string;
  filename: string;
};

type JobRecord = {
  job: {
    id: string;
    contractId: string;
    title: string;
    status: string;
    budget: number;
    requirements: string;
    previewFile: StoredFile | null;
    finalFile: StoredFile | null;
    submittedSourceFiles: StoredFile[];
    submissionNotes: string | null;
  };
  contract: {
    id: string;
    status: string;
    freelancerWalletAddress: string | null;
  };
};

const steps: Array<{ id: FlowStep; label: string }> = [
  { id: "accepted", label: "Job accepted" },
  { id: "submitted", label: "Work submitted" },
  { id: "reviewed", label: "AI reviewed" },
];

export function DeveloperSubmitWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedJobId = searchParams.get("job")?.trim() ?? "";
  const [record, setRecord] = useState<JobRecord | null>(null);
  const [completed, setCompleted] = useState<FlowStep[]>(["accepted"]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    "Open an accepted job to upload the finished work package.",
  );
  const [projectFiles, setProjectFiles] = useState<File[]>([]);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [workSummary, setWorkSummary] = useState(
    "Built the responsive landing page, connected the contact section, and included desktop/mobile screenshots.",
  );
  const [collaborationReview, setCollaborationReview] = useState(
    "Clear brief, quick answers, smooth handoff.",
  );
  const [review, setReview] = useState<ReviewResult | null>(null);
  const canSubmitWork = !!record && projectFiles.length > 0 && previewFiles.length > 0;
  const progress = useMemo(
    () => Math.round((completed.length / steps.length) * 100),
    [completed.length],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRecord() {
      if (!requestedJobId) {
        setRecord(null);
        setCompleted([]);
        setMessage("Choose a specific funded job before opening the submission workspace.");
        return;
      }

      setMessage("Loading accepted job...");

      try {
        const response = await fetch(`/jobs/${encodeURIComponent(requestedJobId)}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as JobRecord | { error?: string };

        if (!response.ok || !("job" in payload)) {
          throw new Error(
            "error" in payload && payload.error ? payload.error : "Job not found.",
          );
        }

        if (cancelled) {
          return;
        }

        setRecord(payload);
        setPreviewUrl(payload.job.previewFile?.url ?? "");
        setSourceUrl(
          payload.job.submittedSourceFiles[0]?.url ??
            payload.job.finalFile?.url ??
            "",
        );
        setCompleted(getCompletedSteps(payload.job.status));
        setMessage(
          payload.contract.status === "locked" || payload.contract.status === "release_requested"
            ? "Upload the finished work package."
            : "This job must be accepted by a freelancer before submission.",
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setRecord(null);
        setMessage(error instanceof Error ? error.message : "Could not load the job.");
      }
    }

    void loadRecord();

    return () => {
      cancelled = true;
    };
  }, [requestedJobId]);

  async function submitWorkAndReview() {
    if (!record) {
      setMessage("Load an accepted job before submitting work.");
      return;
    }

    if (!canSubmitWork) {
      setMessage("Add project files and preview screenshots before submitting.");
      return;
    }

    setBusy(true);
    setReview(null);
    setMessage("Submitting work package.");

    const jobId = record.job.id;
    const contractId = record.contract.id;
    const submittedSourceFiles = makeStoredFiles(projectFiles, jobId, "delivery");
    const sourceFiles = submittedSourceFiles.length > 0
      ? submittedSourceFiles
      : sourceUrl.trim()
        ? [makeUrlFile(jobId, "source", sourceUrl)]
        : [];
    const previewAssets = makeStoredFiles(previewFiles, jobId, "preview");
    const previewFile = previewUrl.trim()
      ? makeUrlFile(jobId, "preview", previewUrl)
      : previewAssets[0];
    const finalFile = sourceUrl.trim()
      ? makeUrlFile(jobId, "source", sourceUrl)
      : sourceFiles[0];

    try {
      const submitResponse = await fetch(`/jobs/${jobId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previewFile,
          finalFile,
          submittedSourceFiles: sourceFiles,
          submissionNotes: makeSubmissionNotes(workSummary, collaborationReview),
          requestReleaseOnChain: false,
        }),
      });
      const submitPayload = (await submitResponse.json()) as { error?: string };

      if (!submitResponse.ok) {
        setMessage(submitPayload.error ?? "The work package could not be submitted.");
        return;
      }

      if (record.contract.status === "locked") {
        await requestReleaseFromWallet(contractId, record.contract.freelancerWalletAddress);
      }

      setCompleted((existing) =>
        existing.includes("submitted") ? existing : [...existing, "submitted"],
      );
      setMessage("Work submitted. AI review is running.");
      window.localStorage.removeItem("smartjobs:last-ai-review");
      window.localStorage.removeItem("smartjobs:last-ai-review-error");
      window.localStorage.setItem("smartjobs:last-ai-review-status", "pending");
      window.localStorage.setItem("smartjobs:last-ai-review-job-id", jobId);
      window.dispatchEvent(new Event("smartjobs-ai-review-updated"));

      const reviewFormData = new FormData();
      reviewFormData.set("jobId", jobId);
      reviewFormData.set("contractId", contractId);

      for (const file of projectFiles) {
        reviewFormData.append("sources", file);
      }

      for (const file of previewFiles) {
        reviewFormData.append("previews", file);
      }

      router.push(`/review/pending?job=${encodeURIComponent(jobId)}`);

      const reviewResponse = await fetch("/api/review", {
        method: "POST",
        body: reviewFormData,
      });
      const reviewPayload = (await reviewResponse.json()) as
        | ReviewResult
        | { error?: string };

      if (!reviewResponse.ok || !isReviewResult(reviewPayload)) {
        const error = getReviewError(reviewPayload);
        window.localStorage.setItem("smartjobs:last-ai-review-status", "error");
        window.localStorage.setItem("smartjobs:last-ai-review-error", error);
        window.dispatchEvent(new Event("smartjobs-ai-review-updated"));
        setMessage(error);
        return;
      }

      setCompleted((existing) =>
        existing.includes("reviewed") ? existing : [...existing, "reviewed"],
      );
      setReview(reviewPayload);
      window.localStorage.setItem("smartjobs:last-ai-review", JSON.stringify(reviewPayload));
      window.localStorage.setItem("smartjobs:last-ai-review-status", "ready");

      const swarmField = (reviewPayload as Record<string, unknown>).swarm;

      if (swarmField && typeof swarmField === "object") {
        window.localStorage.setItem("smartjobs:last-swarm-proof", JSON.stringify(swarmField));
      }

      window.localStorage.setItem("smartjobs:last-ai-review-job-id", jobId);
      window.dispatchEvent(new Event("smartjobs-ai-review-updated"));
      setMessage("AI review is ready for the buyer.");
      setRecord((current) =>
        current
          ? {
              ...current,
              job: {
                ...current.job,
                status: "ai_reviewed",
              },
              contract: {
                ...current.contract,
                status: "release_requested",
              },
            }
          : current,
      );
    } finally {
      setBusy(false);
    }
  }

  function handleProjectFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setProjectFiles(files);

    if (files.length > 0) {
      setMessage(`${files.length} project file${files.length === 1 ? "" : "s"} selected.`);
    }
  }

  function handlePreviewFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setPreviewFiles(files);

    if (files.length > 0) {
      setMessage(`${files.length} preview file${files.length === 1 ? "" : "s"} selected.`);
    }
  }

  return (
    <section className="mx-auto grid w-full max-w-[980px] gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <article className="delivery-panel rounded-[16px] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[12px] font-black uppercase text-[var(--text-muted)]">
              Freelancer delivery
            </p>
            <h1 className="mt-2 max-w-[620px] text-3xl font-black leading-tight sm:text-4xl">
              {record?.job.title ?? "Submit finished work"}
            </h1>
            {record && (
              <p className="mt-3 max-w-[620px] text-[14px] leading-6 text-[var(--text-secondary)]">
                {record.job.requirements}
              </p>
            )}
          </div>
          <div className="rounded-[14px] bg-[var(--text-primary)] px-4 py-3 text-[var(--background)]">
            <p className="text-[11px] font-black uppercase opacity-60">Escrow</p>
            <p className="mt-1 text-xl font-black leading-none">
              {record ? `${record.job.budget} ETH` : "..."}
            </p>
            <p className="mt-2 text-[11px] font-black uppercase opacity-70">
              {record?.contract.status.replaceAll("_", " ") ?? "loading"}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <label className="delivery-drop grid cursor-pointer gap-2 rounded-[14px] p-4">
            <input
              accept=".zip,.rar,.7z,.pdf,.png,.jpg,.jpeg,.webp,.fig,.txt,.md,.tsx,.ts,.js,.css"
              className="sr-only"
              multiple
              type="file"
              onChange={handleProjectFileChange}
            />
            <span className="text-[11px] font-black uppercase text-[var(--text-muted)]">
              Project files
            </span>
            <span className="text-[18px] font-black text-[var(--text-primary)]">
              {projectFiles.length > 0
                ? `${projectFiles.length} file${projectFiles.length === 1 ? "" : "s"} ready`
                : "Upload source package"}
            </span>
            {projectFiles.length > 0 && (
              <span className="text-[13px] leading-5 text-[var(--text-secondary)]">
                {projectFiles.map((file) => file.name).join(", ")}
              </span>
            )}
          </label>

          <label className="delivery-drop grid cursor-pointer gap-2 rounded-[14px] p-4">
            <input
              accept=".png,.jpg,.jpeg,.webp,.gif,.pdf"
              className="sr-only"
              multiple
              type="file"
              onChange={handlePreviewFileChange}
            />
            <span className="text-[11px] font-black uppercase text-[var(--text-muted)]">
              Preview files
            </span>
            <span className="text-[18px] font-black text-[var(--text-primary)]">
              {previewFiles.length > 0
                ? `${previewFiles.length} preview${previewFiles.length === 1 ? "" : "s"} ready`
                : "Upload screenshots"}
            </span>
            {previewFiles.length > 0 && (
              <span className="text-[13px] leading-5 text-[var(--text-secondary)]">
                {previewFiles.map((file) => file.name).join(", ")}
              </span>
            )}
          </label>

          <label className="grid gap-2 rounded-[12px] bg-[var(--surface-strong)] p-3">
            <span className="text-[11px] font-black uppercase text-[var(--text-muted)]">
              Preview URL
            </span>
            <input
              className="h-10 rounded-[9px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[14px] font-bold outline-none"
              value={previewUrl}
              onChange={(event) => setPreviewUrl(event.target.value)}
            />
          </label>

          <label className="grid gap-2 rounded-[12px] bg-[var(--surface-strong)] p-3">
            <span className="text-[11px] font-black uppercase text-[var(--text-muted)]">
              Source URL
            </span>
            <input
              className="h-10 rounded-[9px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[14px] font-bold outline-none"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
            />
          </label>

          <label className="grid gap-2 rounded-[12px] bg-[var(--surface-strong)] p-3">
            <span className="text-[11px] font-black uppercase text-[var(--text-muted)]">
              What did you complete?
            </span>
            <textarea
              className="min-h-20 rounded-[9px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] leading-6 outline-none"
              value={workSummary}
              onChange={(event) => setWorkSummary(event.target.value)}
            />
          </label>

          <label className="grid gap-3 rounded-[12px] bg-[var(--surface-strong)] p-3">
            <span className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--text-primary)] text-[12px] font-black text-[var(--background)]">
                  CL
                </span>
                <span>
                  <span className="block text-[13px] font-black">Buyer context</span>
                  <span className="block text-[11px] font-black uppercase text-[var(--text-muted)]">
                    Handoff notes
                  </span>
                </span>
              </span>
            </span>
            <textarea
              className="min-h-20 rounded-[9px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] leading-6 outline-none"
              value={collaborationReview}
              onChange={(event) => setCollaborationReview(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex h-11 items-center justify-center rounded-[11px] bg-[var(--button)] px-6 text-[14px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-55"
            disabled={busy || !canSubmitWork}
            type="button"
            onClick={submitWorkAndReview}
          >
            {busy ? "Submitting to AI" : "Submit to AI review"}
          </button>

          <Link
            className="inline-flex h-11 items-center justify-center rounded-[11px] border border-[var(--border)] bg-[var(--surface)] px-6 text-[14px] font-black text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
            href={record ? `/review?job=${encodeURIComponent(record.job.id)}` : "/review"}
          >
            View buyer review
          </Link>
        </div>
      </article>

      <aside className="delivery-panel rounded-[16px] p-5">
        <p className="text-[12px] font-black uppercase text-[var(--text-muted)]">
          Status
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-strong)]">
          <div
            className="h-full rounded-full bg-[var(--text-primary)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-5 grid gap-3">
          {steps.map((step, index) => {
            const done = completed.includes(step.id);

            return (
              <div className="flex items-center gap-3" key={step.id}>
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-black ${
                    done
                      ? "bg-[var(--text-primary)] text-[var(--background)]"
                      : "bg-[var(--surface-strong)] text-[var(--text-muted)]"
                  }`}
                >
                  {index + 1}
                </span>
                <div>
                  <p className="text-[13px] font-black">{step.label}</p>
                  <p className="mt-0.5 text-[11px] font-black uppercase text-[var(--text-muted)]">
                    {done ? "Done" : "Pending"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-5 rounded-[12px] bg-[var(--surface-strong)] p-3 text-[13px] leading-5 text-[var(--text-secondary)]">
          {message}
        </p>

        {review && (
          <div className="mt-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
              AI answer
            </p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="text-2xl font-black">{getReviewScore(review)}</p>
              <p className="text-[12px] font-black uppercase text-[var(--text-muted)]">
                {review.comparison_notes.confidence}
              </p>
            </div>
            <p className="mt-3 text-[13px] leading-5 text-[var(--text-secondary)]">
              {review.user_visible.summary}
            </p>
          </div>
        )}
      </aside>

      <style>{`
        .delivery-panel {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.55)),
            color-mix(in srgb, var(--surface) 88%, white);
          border: 1px solid rgba(20, 26, 35, 0.08);
          box-shadow:
            0 24px 64px rgba(15, 23, 42, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.72);
        }

        :root[data-theme="dark"] .delivery-panel {
          background:
            linear-gradient(180deg, rgba(32, 36, 43, 0.72), rgba(25, 27, 32, 0.58)),
            var(--surface);
          border-color: var(--border);
          box-shadow:
            0 24px 64px rgba(0, 0, 0, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .delivery-drop {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.66), rgba(255, 255, 255, 0.38)),
            color-mix(in srgb, var(--surface-elevated) 72%, transparent);
          border: 1px dashed color-mix(in srgb, var(--text-primary) 24%, rgba(20, 26, 35, 0.14));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.64);
        }

        :root[data-theme="dark"] .delivery-drop {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02)),
            color-mix(in srgb, var(--surface-elevated) 78%, transparent);
          border-color: color-mix(in srgb, var(--text-primary) 24%, var(--border));
        }
      `}</style>
    </section>
  );
}

async function requestReleaseFromWallet(
  contractId: string,
  freelancerWalletAddress: string | null,
) {
  const provider = getEthereumProvider();

  if (!provider) {
    throw new Error("Connect the freelancer wallet to request payout.");
  }

  const accounts = await provider.request<string[]>({
    method: "eth_requestAccounts",
  });
  const from = accounts[0];

  if (!from) {
    throw new Error("No wallet account selected.");
  }

  if (
    freelancerWalletAddress &&
    getAddress(from) !== getAddress(freelancerWalletAddress)
  ) {
    throw new Error(
      `Connect the locked freelancer wallet (${freelancerWalletAddress}) before requesting payout.`,
    );
  }

  await ensureSepoliaNetwork(provider);

  const prepared = await postJson(`/escrow-contracts/${contractId}/onchain/prepare`, {
    action: "request_release",
  });

  if (!isPreparedTransaction(prepared)) {
    throw new Error("Escrow release request could not be prepared.");
  }

  const transactionHash = await provider.request<string>({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: prepared.transaction.to,
        value: prepared.transaction.value ?? "0x0",
        data: prepared.transaction.data,
      },
    ],
  });

  await postJson(`/escrow-contracts/${contractId}/onchain/confirm`, {
    action: "request_release",
    transactionHash,
  });
}

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed.");
  }

  return payload;
}

function isPreparedTransaction(value: unknown): value is {
  transaction: { to: string; value?: string; data: string };
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "transaction" in value &&
    typeof (value as { transaction?: { to?: unknown; data?: unknown } }).transaction?.to ===
      "string" &&
    typeof (value as { transaction?: { to?: unknown; data?: unknown } }).transaction
      ?.data === "string"
  );
}

function getCompletedSteps(jobStatus: string): FlowStep[] {
  if (jobStatus === "ai_reviewed" || jobStatus === "completed") {
    return ["accepted", "submitted", "reviewed"];
  }

  if (jobStatus === "submitted") {
    return ["accepted", "submitted"];
  }

  return ["accepted"];
}

function makeStoredFiles(files: File[], jobId: string, role: string): StoredFile[] {
  return files.map((file, index) => ({
    id: `file_${role}_${jobId}_${index + 1}`,
    url: `smartjobs-upload://${encodeURIComponent(file.name)}`,
    filename: file.name,
  }));
}

function makeUrlFile(job: string, role: string, url: string): StoredFile {
  const trimmed = url.trim();
  const filename = trimmed.split("/").filter(Boolean).at(-1) || `${role}.zip`;

  return {
    id: `file_${role}_${job}`,
    url: trimmed || `smartjobs-reference://${encodeURIComponent(job)}/${role}`,
    filename,
  };
}

function makeSubmissionNotes(workSummary: string, collaborationReview: string) {
  const summary = workSummary.trim();
  const collaboration = collaborationReview.trim();

  return [
    summary ? `Work completed: ${summary}` : null,
    collaboration ? `Buyer collaboration: ${collaboration}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function isReviewResult(value: ReviewResult | { error?: string }): value is ReviewResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "schema_version" in value &&
    "verdicts" in value &&
    "comparison_notes" in value &&
    "user_visible" in value
  );
}

function getReviewError(value: ReviewResult | { error?: string }) {
  return "error" in value && value.error ? value.error : "The AI review failed.";
}

function getReviewScore(review: ReviewResult) {
  const scores = [
    verdictToScore(review.verdicts.preview_vs_source.verdict),
    verdictToScore(review.verdicts.preview_vs_description.verdict),
    verdictToScore(review.verdicts.source_vs_description.verdict),
  ];

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function verdictToScore(verdict: ReviewResult["verdicts"]["preview_vs_source"]["verdict"]) {
  switch (verdict) {
    case "MATCH":
      return 94;
    case "PARTIAL_MATCH":
      return 72;
    case "MISMATCH":
      return 32;
    case "INSUFFICIENT_EVIDENCE":
      return 45;
  }
}
