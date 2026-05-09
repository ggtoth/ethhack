"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";

import { aiReview, jobs } from "@/lib/marketplace-data";
import { getReviewDisplay } from "@/lib/review/display";
import type { ReviewResult } from "@/lib/review/schema";

const reviewedJob = jobs.find((job) => job.id === "landing-page-implementation") ?? jobs[0];

type SwarmProof = {
  reference: string;
  url: string;
  manifestReference?: string;
  manifestUrl?: string;
};

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const variant = searchParams.get("case") ?? undefined;
  const [liveReview, setLiveReview] = useState<ReviewResult | null>(null);
  const [swarmProof, setSwarmProof] = useState<SwarmProof | null>(null);
  const displayInput = liveReview ? reviewResultToDisplayInput(liveReview) : getDemoInput(variant);
  const display = getReviewDisplay(displayInput);
  const summary = liveReview?.user_visible.summary ?? display.summary;
  const manifest = [
    "SmartJobs delivery files",
    `Project: ${reviewedJob.title}`,
    `AI score: ${display.score}/100`,
    `AI confidence: ${display.confidence}/100`,
    `Zone: ${display.zone}`,
    display.canDownload ? "Files are ready for download." : "Files are blocked for manual review.",
  ].join("\n");
  const zoneStyle = {
    "--review-zone": display.color,
    "--review-zone-bg": display.background,
  } as CSSProperties;

  useEffect(() => {
    const storedReview = window.localStorage.getItem("smartjobs:last-ai-review");

    if (storedReview) {
      try {
        const parsed = JSON.parse(storedReview) as unknown;

        if (isReviewResult(parsed)) {
          setLiveReview(parsed);
        }
      } catch {
        setLiveReview(null);
      }
    }

    const storedSwarm = window.localStorage.getItem("smartjobs:last-swarm-proof");

    if (storedSwarm) {
      try {
        const parsed = JSON.parse(storedSwarm) as unknown;

        if (isSwarmProof(parsed)) {
          setSwarmProof(parsed);
        }
      } catch {
        setSwarmProof(null);
      }
    }
  }, []);

  return (
    <main className="relative flex flex-1 items-center overflow-hidden bg-[var(--background)] px-4 py-10 text-[var(--text-primary)] sm:px-6 lg:px-8">
      {display.zone === "good" && <Confetti />}

      <section className="mx-auto grid w-full max-w-[620px] gap-5">
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
          {display.canDownload && (
            <div className="approval-chip mx-auto mt-4 w-fit rounded-full bg-[var(--review-zone-bg)] px-5 py-2 text-[13px] font-black text-[var(--review-zone)]">
              {display.recommendation}
            </div>
          )}

          <div className="score-stage mx-auto mt-8 max-w-[500px] px-3 py-5">
            <p className="text-[12px] font-bold uppercase text-[var(--text-muted)]">
              Score
            </p>
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
                style={{ left: `${display.confidence}%` }}
                aria-hidden="true"
              >
                <span>{display.confidence}</span>
              </div>
              <div
                className="zone-fill"
                style={{ width: `${display.confidence}%` }}
                aria-hidden="true"
              />
            </div>
            <div className="mt-3 grid grid-cols-3 text-[10px] font-black uppercase">
              <span className="text-left text-[#ef4444]">Bad</span>
              <span className="text-[#eab308]">Medium</span>
              <span className="text-right text-[#43c084]">Good</span>
            </div>
          </div>

          <p className="mx-auto mt-5 max-w-[340px] text-[14px] leading-6 text-[var(--text-secondary)]">
            {display.canDownload
              ? "The work looks good. Download the files, then approve to release escrow."
              : "No worries. We will email you when there is an update."}
          </p>

          {display.canDownload ? (
            <div className="mx-auto mt-7 grid w-full max-w-[460px] gap-3 sm:grid-cols-2">
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface)] px-5 text-center text-[14px] font-black text-[var(--text-primary)] transition hover:border-[var(--text-primary)]"
                download="smartjobs-delivery-files.txt"
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(manifest)}`}
              >
                Download files
              </a>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-[8px] bg-[var(--button)] px-5 text-center text-[14px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)]"
                href="/profile?view=freelancer&payout=success"
              >
                Approve & release
              </Link>
            </div>
          ) : (
            <button
              className="mt-7 inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-[8px] border border-[var(--border-strong)] bg-[var(--surface-strong)] px-5 text-center text-[14px] font-black text-[var(--text-muted)] sm:w-auto sm:min-w-[220px]"
              disabled
              type="button"
            >
              Download blocked
            </button>
          )}

          {!display.canDownload && (
            <div className="mx-auto mt-4 max-w-[380px] rounded-[12px] bg-[var(--surface-strong)] px-4 py-3 text-left">
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
                If you want the reason
              </p>
              <p className="mt-2 text-[12px] leading-5 text-[var(--text-secondary)]">
                {summary}
              </p>
            </div>
          )}

          {display.canDownload && (
            <p className="mx-auto mt-4 max-w-[360px] text-[12px] leading-5 text-[var(--text-muted)]">
              Approval releases the locked escrow and marks the freelancer wallet
              as paid in the demo.
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
          border-radius: 999px;
        }

        .review-face--sad span {
          top: 28px;
          border-width: 4px 0 0;
          border-radius: 999px 999px 0 0;
        }

        .rating-title {
          letter-spacing: 0;
          text-shadow:
            0 0 24px color-mix(in srgb, var(--review-zone) 24%, transparent),
            0 12px 34px color-mix(in srgb, var(--review-zone) 18%, transparent);
          animation: rating-pop 760ms 180ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .approval-chip {
          letter-spacing: 0;
          box-shadow:
            0 0 0 1px color-mix(in srgb, var(--review-zone) 24%, transparent),
            0 14px 38px color-mix(in srgb, var(--review-zone) 18%, transparent);
          animation: badge-bounce 760ms 320ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .score-stage {
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.56), rgba(255, 255, 255, 0.24)),
            color-mix(in srgb, var(--surface-elevated) 72%, transparent);
          box-shadow:
            0 24px 70px color-mix(in srgb, var(--review-zone) 8%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.62);
        }

        :root[data-theme="dark"] .score-stage {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.015)),
            color-mix(in srgb, var(--surface-elevated) 78%, transparent);
          box-shadow:
            0 24px 70px color-mix(in srgb, var(--review-zone) 10%, transparent),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .score-stage::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            115deg,
            transparent 0%,
            transparent 36%,
            rgba(255, 255, 255, 0.13) 47%,
            transparent 58%,
            transparent 100%
          );
          transform: translateX(-120%);
          animation: shine-pass 1800ms 520ms ease-out both;
          pointer-events: none;
        }

        .confidence-pill {
          box-shadow:
            0 0 0 1px color-mix(in srgb, var(--review-zone) 24%, transparent),
            0 10px 28px color-mix(in srgb, var(--review-zone) 18%, transparent);
        }

        .zone-meter {
          position: relative;
          height: 18px;
          overflow: visible;
          border-radius: 999px;
          background: linear-gradient(90deg, #ef4444 0 34%, #eab308 34% 68%, #43c084 68% 100%);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.18),
            0 16px 38px color-mix(in srgb, var(--review-zone) 18%, transparent);
        }

        .zone-meter::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.32), transparent 58%);
          pointer-events: none;
        }

        .zone-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0));
          mix-blend-mode: screen;
          animation: meter-grow 900ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .zone-marker {
          position: absolute;
          top: -34px;
          z-index: 2;
          width: 42px;
          transform: translateX(-50%);
          color: var(--review-zone);
        }

        .zone-marker::after {
          content: "";
          display: block;
          margin: 4px auto 0;
          width: 14px;
          height: 14px;
          border: 3px solid var(--surface);
          border-radius: 999px;
          background: var(--review-zone);
          box-shadow: 0 0 0 5px color-mix(in srgb, var(--review-zone) 20%, transparent);
        }

        .zone-marker span {
          display: block;
          border-radius: 999px;
          background: color-mix(in srgb, var(--surface) 92%, white);
          padding: 3px 0;
          font-size: 11px;
          font-weight: 900;
          box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
        }

        .confetti-piece {
          position: fixed;
          top: -18px;
          z-index: 40;
          width: 8px;
          height: 14px;
          border-radius: 2px;
          pointer-events: none;
          animation: confetti-fall 1200ms ease-out forwards;
        }

        @keyframes happy-pop {
          0% {
            opacity: 0;
            transform: scale(0.72) translateY(12px);
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

        @keyframes shine-pass {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(120%);
          }
        }

        @keyframes meter-grow {
          0% {
            width: 0%;
          }
        }

        @keyframes badge-bounce {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.9);
          }
          60% {
            opacity: 1;
            transform: translateY(-2px) scale(1.04);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
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

function getDemoInput(variant: string | undefined) {
  if (variant === "negative") {
    return {
      score: 22,
      confidence: 31,
      hasSuspiciousInput: true,
    };
  }

  if (variant === "medium") {
    return {
      score: 68,
      confidence: 72,
    };
  }

  return {
    score: aiReview.score,
    confidence: 94,
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
