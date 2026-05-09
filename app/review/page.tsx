"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAddress } from "viem";

import { getReviewDisplay } from "@/lib/review/display";
import type { ReviewResult } from "@/lib/review/schema";
import { ensureSepoliaNetwork, getEthereumProvider } from "@/lib/wallet/ethereum";

type JobRecord = {
  job: {
    id: string;
    title: string;
    status: string;
    previewFile: StoredFile | null;
    finalFile: StoredFile | null;
    submittedSourceFiles: StoredFile[];
    submissionNotes: string | null;
    aiReview: {
      verdict: "pass" | "needs_revision" | "fail";
      score: number;
      summary: string;
      issues: string[];
    } | null;
  };
  contract: {
    id: string;
    status: string;
    clientWalletAddress: string | null;
    freelancerWalletAddress: string | null;
  };
};

type StoredFile = {
  id: string;
  url: string;
  filename: string;
};

type ActionState =
  | { status: "idle" }
  | { status: "working"; label: string }
  | { status: "error"; message: string }
  | { status: "success"; message: string };

type SwarmProof = {
  reference: string;
  url: string;
  manifestReference?: string;
  manifestUrl?: string;
};

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job")?.trim() ?? "";
  const [record, setRecord] = useState<JobRecord | null>(null);
  const [liveReview, setLiveReview] = useState<ReviewResult | null>(null);
  const [swarmProof, setSwarmProof] = useState<SwarmProof | null>(null);
  const [state, setState] = useState<ActionState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;

    async function loadRecord() {
      if (!jobId) {
        setRecord(null);
        setLiveReview(null);
        setState({
          status: "error",
          message: "Open the review page with a specific job ID.",
        });
        return;
      }

      try {
        const response = await fetch(`/jobs/${encodeURIComponent(jobId)}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as JobRecord | { error?: string };

        if (!response.ok || !("job" in payload)) {
          throw new Error(
            "error" in payload && payload.error ? payload.error : "Job not found.",
          );
        }

        if (!cancelled) {
          setRecord(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Could not load the review.",
          });
        }
      }
    }

    loadStoredReview(jobId, setLiveReview);
    loadStoredSwarmProof(setSwarmProof);
    void loadRecord();

    function handleReviewUpdate() {
      loadStoredReview(jobId, setLiveReview);
      loadStoredSwarmProof(setSwarmProof);
      void loadRecord();
    }

    window.addEventListener("smartjobs-ai-review-updated", handleReviewUpdate);
    window.addEventListener("storage", handleReviewUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener("smartjobs-ai-review-updated", handleReviewUpdate);
      window.removeEventListener("storage", handleReviewUpdate);
    };
  }, [jobId]);

  const displayInput = liveReview
    ? reviewResultToDisplayInput(liveReview)
    : aiReviewToDisplayInput(record?.job.aiReview);
  const display = getReviewDisplay(displayInput);
  const reviewSummary =
    liveReview?.user_visible.summary ??
    record?.job.aiReview?.summary ??
    "The buyer will see the AI review here after the freelancer submits proof.";
  const sourceReleased = record?.contract.status === "released";
  const canDecide =
    !!record?.job.aiReview &&
    (record.contract.status === "locked" || record.contract.status === "release_requested");
  const manifest = buildSourceManifest(record);
  const zoneStyle = {
    "--review-zone": display.color,
    "--review-zone-bg": display.background,
  } as CSSProperties;

  async function decide(action: "release" | "refund") {
    if (!record) {
      return;
    }

    setState({
      status: "working",
      label: action === "release" ? "Releasing escrow..." : "Refunding buyer...",
    });

    try {
      const provider = getEthereumProvider();

      if (!provider) {
        throw new Error("Connect the buyer wallet to decide this review.");
      }

      const accounts = await provider.request<string[]>({
        method: "eth_requestAccounts",
      });
      const from = accounts[0];

      if (!from) {
        throw new Error("No wallet account selected.");
      }

      if (
        record.contract.clientWalletAddress &&
        getAddress(from) !== getAddress(record.contract.clientWalletAddress)
      ) {
        throw new Error(
          `Connect the buyer wallet (${record.contract.clientWalletAddress}) before continuing.`,
        );
      }

      await ensureSepoliaNetwork(provider);
      const prepared = await postJson(
        `/escrow-contracts/${record.contract.id}/onchain/prepare`,
        { action },
      );

      if (!isPreparedTransaction(prepared)) {
        throw new Error(`Escrow ${action} could not be prepared.`);
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

      const confirmed = await postJson(
        `/escrow-contracts/${record.contract.id}/onchain/confirm`,
        { action, transactionHash },
      );

      setRecord((current) =>
        current && isConfirmedContractResponse(confirmed)
          ? {
              ...current,
              job: {
                ...current.job,
                status: action === "release" ? "completed" : "cancelled",
              },
              contract: {
                ...current.contract,
                status: confirmed.contract.status,
              },
            }
          : current,
      );
      setState({
        status: "success",
        message:
          action === "release"
            ? "Funds released to the freelancer. The source package is now available."
            : "Escrow refunded to the buyer. Only the preview remains visible.",
      });
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : `Could not ${action} this escrow.`,
      });
    }
  }

  return (
    <main className="relative flex flex-1 items-center overflow-hidden bg-[var(--background)] px-4 py-10 text-[var(--text-primary)] sm:px-6 lg:px-8">
      {display.zone === "good" && sourceReleased && <Confetti />}

      <section className="mx-auto grid w-full max-w-[980px] gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div
          className="review-shell relative overflow-hidden rounded-[18px] p-6 text-center sm:p-10"
          style={zoneStyle}
        >
          <div className="review-aura" aria-hidden="true" />

          <div className="approval-burst mx-auto grid h-28 w-28 place-items-center rounded-full bg-[var(--review-zone-bg)]">
            <div className={`review-face review-face--${display.face}`} aria-hidden="true">
              <span />
            </div>
          </div>

          <p className="mt-6 text-[12px] font-bold uppercase text-[var(--text-muted)]">
            AI recommends
          </p>
          <h1 className="rating-title mt-2 text-4xl font-black uppercase leading-tight text-[var(--review-zone)] sm:text-5xl">
            {display.rating}
          </h1>
          <div className="approval-chip mx-auto mt-4 w-fit rounded-full bg-[var(--review-zone-bg)] px-5 py-2 text-[13px] font-black text-[var(--review-zone)]">
            {display.recommendation}
          </div>

          <div className="score-stage mx-auto mt-8 max-w-[500px] px-3 py-5">
            <p className="text-[12px] font-bold uppercase text-[var(--text-muted)]">Score</p>
            <p className="mt-1 text-6xl font-black leading-none text-[var(--text-primary)] sm:text-7xl">
              {display.score}
              <span className="text-2xl text-[var(--text-secondary)]"> /100</span>
            </p>

            <div className="confidence-pill mx-auto mt-5 w-fit rounded-full bg-[var(--review-zone-bg)] px-4 py-2 text-[13px] font-black text-[var(--review-zone)]">
              AI confidence: {display.confidence}/100
            </div>

            <div className="zone-meter mt-7">
              <div
                className="zone-marker"
                style={{ left: `${display.score}%` }}
                aria-hidden="true"
              >
                <span>{display.score}</span>
              </div>
              <div
                className="zone-fill"
                style={{ width: `${display.score}%` }}
                aria-hidden="true"
              />
            </div>
            <div className="mt-3 grid grid-cols-3 text-[10px] font-black uppercase">
              <span className="text-left text-[#ef4444]">Bad</span>
              <span className="text-[#eab308]">Medium</span>
              <span className="text-right text-[#43c084]">Good</span>
            </div>
          </div>

          <p className="mx-auto mt-5 max-w-[420px] text-[14px] leading-6 text-[var(--text-secondary)]">
            {reviewSummary}
          </p>

          {sourceReleased ? (
            <div className="mx-auto mt-7 grid w-full max-w-[460px] gap-3 sm:grid-cols-2">
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-5 text-center text-[14px] font-black text-[var(--text-primary)] transition hover:border-[var(--text-primary)]"
                download="smartjobs-source-package.txt"
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(manifest)}`}
              >
                Download source package
              </a>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-[8px] bg-[var(--button)] px-5 text-center text-[14px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)]"
                href={`/ai-review?job=${encodeURIComponent(jobId)}`}
              >
                View ledger details
              </Link>
            </div>
          ) : canDecide ? (
            <div className="mx-auto mt-7 grid w-full max-w-[460px] gap-3 sm:grid-cols-2">
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-[8px] bg-[var(--button)] px-5 text-center text-[14px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
                disabled={state.status === "working"}
                type="button"
                onClick={() => void decide("release")}
              >
                Approve & release
              </button>
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-5 text-center text-[14px] font-black text-[var(--text-primary)] transition hover:border-[var(--text-primary)] disabled:opacity-60"
                disabled={state.status === "working"}
                type="button"
                onClick={() => void decide("refund")}
              >
                Reject & refund
              </button>
            </div>
          ) : (
            <button
              className="mt-7 inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface-strong)] px-5 text-center text-[14px] font-black text-[var(--text-muted)] sm:w-auto sm:min-w-[260px]"
              disabled
              type="button"
            >
              Source files stay locked until buyer approval
            </button>
          )}

          {!sourceReleased && (
            <div className="mx-auto mt-4 max-w-[420px] rounded-[12px] bg-[var(--surface-strong)] px-4 py-3 text-left">
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                Preview is visible
              </p>
              <p className="mt-2 break-all text-[12px] leading-5 text-[var(--text-secondary)]">
                {record?.job.previewFile?.url ?? "No preview submitted yet."}
              </p>
              <p className="mt-3 text-[12px] leading-5 text-[var(--text-secondary)]">
                The source package stays hidden unless the buyer approves and releases funds.
              </p>
            </div>
          )}

          {record?.contract.status === "refunded" && (
            <p className="mx-auto mt-4 max-w-[360px] text-[12px] leading-5 text-[var(--text-muted)]">
              This escrow was refunded to the buyer. The preview remains visible, but the
              source package is not released.
            </p>
          )}

          {swarmProof && (
            <div className="mx-auto mt-6 w-full max-w-[460px] rounded-[12px] border border-[color-mix(in_srgb,#f7931a_20%,var(--border))] bg-[color-mix(in_srgb,#f7931a_5%,var(--surface))] px-4 py-3 text-left">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#f7931a] text-[9px] font-black text-white">
                  ✦
                </span>
                <p className="text-[11px] font-black uppercase text-[#f7931a]">
                  Stored on Swarm
                </p>
              </div>
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Content reference (immutable)
              </p>
              <p className="mt-1 break-all font-mono text-[10px] leading-4 text-[var(--text-secondary)]">
                {swarmProof.reference}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  className="text-[11px] font-bold text-[#f7931a] underline underline-offset-2 hover:opacity-75"
                  href={swarmProof.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open on gateway
                </a>
                <span className="text-[var(--text-muted)]">·</span>
                <a
                  className="text-[11px] font-bold text-[#f7931a] underline underline-offset-2 hover:opacity-75"
                  href={`/api/swarm/verify/${swarmProof.reference}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Verify integrity
                </a>
              </div>
              {swarmProof.manifestReference && (
                <>
                  <p className="mt-3 text-[10px] text-[var(--text-muted)]">
                    Feed manifest (mutable — always resolves to latest)
                  </p>
                  <p className="mt-1 break-all font-mono text-[10px] leading-4 text-[var(--text-secondary)]">
                    {swarmProof.manifestReference}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      className="text-[11px] font-bold text-[#f7931a] underline underline-offset-2 hover:opacity-75"
                      href={swarmProof.manifestUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Open manifest
                    </a>
                    <span className="text-[var(--text-muted)]">·</span>
                    <a
                      className="text-[11px] font-bold text-[#f7931a] underline underline-offset-2 hover:opacity-75"
                      href={`/api/swarm/verify/${swarmProof.manifestReference}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Verify manifest
                    </a>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <aside className="review-shell rounded-[18px] p-5 text-left">
          <p className="text-[12px] font-black uppercase text-[var(--text-muted)]">
            Buyer checklist
          </p>
          <div className="mt-4 grid gap-3 text-[13px]">
            <Detail label="Job" value={record?.job.title ?? jobId} />
            <Detail
              label="Escrow state"
              value={record?.contract.status.replaceAll("_", " ") ?? "loading"}
            />
            <Detail
              label="Freelancer payout"
              value={record?.contract.freelancerWalletAddress ?? "Not accepted yet"}
            />
            <Detail
              label="Preview"
              value={record?.job.previewFile?.filename ?? "No preview uploaded"}
            />
            <Detail
              label="Source access"
              value={sourceReleased ? "Released to buyer" : "Blocked until release"}
            />
            <Detail
              label="Submission notes"
              value={record?.job.submissionNotes ?? "No notes stored."}
            />
          </div>

          {(state.status === "working" || state.status === "error" || state.status === "success") && (
            <div className="mt-5 rounded-[12px] bg-[var(--surface-strong)] px-4 py-3 text-[13px] leading-5 text-[var(--text-secondary)]">
              {state.status === "working" ? state.label : state.message}
            </div>
          )}

          <div className="mt-5 grid gap-3">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-[11px] border border-[var(--border)] bg-[var(--surface)] px-6 text-[14px] font-black text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
              href={`/submit-work?job=${encodeURIComponent(jobId)}`}
            >
              Back to submission
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-[11px] border border-[var(--border)] bg-[var(--surface)] px-6 text-[14px] font-black text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
              href={`/ai-review?job=${encodeURIComponent(jobId)}`}
            >
              Review context
            </Link>
          </div>
        </aside>
      </section>

      <style>{`
        .review-shell {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.5)),
            color-mix(in srgb, var(--surface) 88%, white);
          border: 1px solid color-mix(in srgb, var(--review-zone) 12%, rgba(20, 26, 35, 0.1));
          box-shadow:
            0 34px 90px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.72);
        }

        :root[data-theme="dark"] .review-shell {
          background:
            linear-gradient(180deg, rgba(32, 36, 43, 0.72), rgba(25, 27, 32, 0.58)),
            var(--surface);
          border-color: color-mix(in srgb, var(--review-zone) 16%, var(--border));
          box-shadow:
            0 34px 90px rgba(0, 0, 0, 0.26),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .review-aura {
          position: absolute;
          inset: -120px -80px auto;
          height: 320px;
          background:
            radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--review-zone) 30%, transparent), transparent 34%),
            radial-gradient(circle at 18% 28%, rgba(255, 255, 255, 0.14), transparent 24%),
            radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--review-zone) 20%, transparent), transparent 22%);
          filter: blur(10px);
          opacity: 0.9;
          pointer-events: none;
        }

        .approval-burst {
          position: relative;
          animation: happy-pop 820ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
          box-shadow:
            0 0 0 10px color-mix(in srgb, var(--review-zone) 7%, transparent),
            0 24px 70px color-mix(in srgb, var(--review-zone) 22%, transparent);
        }

        .approval-burst::before,
        .approval-burst::after {
          content: "";
          position: absolute;
          inset: -10px;
          border: 1px solid color-mix(in srgb, var(--review-zone) 35%, transparent);
          border-radius: 999px;
          animation: approval-ring 1600ms ease-out infinite;
        }

        .approval-burst::after {
          animation-delay: 420ms;
        }

        .review-face {
          position: relative;
          width: 46px;
          height: 46px;
          border: 4px solid var(--review-zone);
          border-radius: 999px;
        }

        .review-face::before,
        .review-face::after {
          content: "";
          position: absolute;
          top: 14px;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: var(--review-zone);
        }

        .review-face::before {
          left: 11px;
        }

        .review-face::after {
          right: 11px;
        }

        .review-face span {
          position: absolute;
          left: 12px;
          width: 18px;
          height: 10px;
          border-color: var(--review-zone);
          border-style: solid;
        }

        .review-face--happy span {
          top: 22px;
          border-width: 0 0 4px;
          border-radius: 0 0 999px 999px;
        }

        .review-face--neutral span {
          top: 27px;
          height: 0;
          border-width: 0 0 4px;
        }

        .review-face--sad span {
          top: 24px;
          border-width: 4px 0 0;
          border-radius: 999px 999px 0 0;
        }

        .score-stage {
          position: relative;
          border-radius: 20px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.74), rgba(255, 255, 255, 0.34)),
            color-mix(in srgb, var(--surface) 86%, white);
          border: 1px solid color-mix(in srgb, var(--review-zone) 12%, rgba(20, 26, 35, 0.08));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
        }

        .zone-meter {
          position: relative;
          height: 16px;
          overflow: hidden;
          border-radius: 999px;
          background:
            linear-gradient(90deg, rgba(239, 68, 68, 0.22) 0%, rgba(234, 179, 8, 0.22) 50%, rgba(67, 192, 132, 0.24) 100%);
          border: 1px solid rgba(20, 26, 35, 0.08);
        }

        .zone-fill {
          height: 100%;
          border-radius: inherit;
          background:
            linear-gradient(90deg, color-mix(in srgb, var(--review-zone) 22%, transparent), color-mix(in srgb, var(--review-zone) 42%, transparent));
        }

        .zone-marker {
          position: absolute;
          top: -30px;
          transform: translateX(-50%);
        }

        .zone-marker span {
          display: inline-flex;
          min-width: 38px;
          justify-content: center;
          border-radius: 999px;
          background: var(--review-zone);
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 900;
          color: white;
        }

        .confidence-pill,
        .approval-chip {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.46);
        }

        .rating-title {
          animation: rating-pop 560ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .confetti-piece {
          position: absolute;
          top: -18px;
          width: 10px;
          height: 18px;
          border-radius: 999px;
          animation: confetti-fall 1900ms linear infinite;
        }

        @keyframes happy-pop {
          0% {
            opacity: 0;
            transform: scale(0.82) translateY(12px);
          }
          55% {
            opacity: 1;
            transform: scale(1.08) translateY(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes approval-ring {
          0% {
            opacity: 0.55;
            transform: scale(0.92);
          }
          100% {
            opacity: 0;
            transform: scale(1.28);
          }
        }

        @keyframes rating-pop {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.88);
          }
          62% {
            opacity: 1;
            transform: translateY(-2px) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes confetti-fall {
          0% {
            opacity: 0;
            transform: translate3d(0, -20px, 0) rotate(0deg);
          }
          15% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--confetti-drift), 360px, 0) rotate(520deg);
          }
        }
      `}</style>
    </main>
  );
}

function buildSourceManifest(record: JobRecord | null) {
  if (!record) {
    return "No job loaded.";
  }

  return [
    `Job: ${record.job.title}`,
    `Preview: ${record.job.previewFile?.url ?? "None"}`,
    `Final package: ${record.job.finalFile?.url ?? "None"}`,
    `Submitted source files: ${
      record.job.submittedSourceFiles.length > 0
        ? record.job.submittedSourceFiles.map((file) => file.url).join(", ")
        : "None"
    }`,
    `Submission notes: ${record.job.submissionNotes ?? "None"}`,
  ].join("\n");
}

function loadStoredReview(
  jobId: string,
  setLiveReview: (value: ReviewResult | null) => void,
) {
  const storedJobId = window.localStorage.getItem("smartjobs:last-ai-review-job-id");
  const storedReview = window.localStorage.getItem("smartjobs:last-ai-review");

  if (!storedReview || storedJobId !== jobId) {
    setLiveReview(null);
    return;
  }

  try {
    const parsed = JSON.parse(storedReview) as unknown;

    if (isReviewResult(parsed)) {
      setLiveReview(parsed);
      return;
    }
  } catch {
    // Ignore parse failures and fall back to ledger state.
  }

  setLiveReview(null);
}

function loadStoredSwarmProof(setSwarmProof: (value: SwarmProof | null) => void) {
  const stored = window.localStorage.getItem("smartjobs:last-swarm-proof");

  if (!stored) {
    return;
  }

  try {
    const parsed = JSON.parse(stored) as unknown;

    if (isSwarmProof(parsed)) {
      setSwarmProof(parsed);
    }
  } catch {
    // Ignore parse failures.
  }
}

function aiReviewToDisplayInput(review: JobRecord["job"]["aiReview"] | null | undefined) {
  if (!review) {
    return {
      score: 0,
      confidence: 0,
      hasSuspiciousInput: false,
    };
  }

  return {
    score: Math.round(review.score * 100),
    confidence: review.verdict === "pass" ? 91 : review.verdict === "needs_revision" ? 67 : 29,
    hasSuspiciousInput: review.verdict === "fail",
  };
}

function reviewResultToDisplayInput(review: ReviewResult) {
  return {
    score: getReviewScore(review),
    confidence: confidenceToScore(review.comparison_notes.confidence),
    hasSuspiciousInput: hasBadEvidence(review),
  };
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

function confidenceToScore(confidence: ReviewResult["comparison_notes"]["confidence"]) {
  if (confidence === "HIGH") {
    return 94;
  }

  if (confidence === "MEDIUM") {
    return 72;
  }

  return 42;
}

function hasBadEvidence(review: ReviewResult) {
  return Object.values(review.verdicts).some((verdict) => verdict.verdict === "MISMATCH");
}

function isReviewResult(value: unknown): value is ReviewResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "schema_version" in value &&
    "verdicts" in value &&
    "comparison_notes" in value &&
    "user_visible" in value
  );
}

function isSwarmProof(value: unknown): value is SwarmProof {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.reference === "string" && typeof v.url === "string";
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

function isConfirmedContractResponse(
  value: unknown,
): value is { contract: { status: JobRecord["contract"]["status"] } } {
  return (
    typeof value === "object" &&
    value !== null &&
    "contract" in value &&
    typeof (value as { contract?: { status?: unknown } }).contract?.status === "string"
  );
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 break-all text-[13px] leading-5 text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

function Confetti() {
  const pieces = [
    ["10%", "#43c084", "-34px", "0ms"],
    ["22%", "#f4f7fb", "28px", "90ms"],
    ["36%", "#8b5cf6", "-18px", "160ms"],
    ["51%", "#43c084", "42px", "40ms"],
    ["66%", "#f4f7fb", "-48px", "130ms"],
    ["82%", "#8b5cf6", "20px", "10ms"],
  ];

  return (
    <div aria-hidden="true">
      {pieces.map(([left, color, drift, delay], index) => (
        <span
          className="confetti-piece"
          key={`${left}-${index}`}
          style={{
            "--confetti-drift": drift,
            animationDelay: delay,
            background: color,
            left,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
