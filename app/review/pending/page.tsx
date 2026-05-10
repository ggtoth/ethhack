"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type StoredFile = {
  id: string;
  url: string;
  filename: string;
};

type JobRecord = {
  job: {
    title: string;
    previewFile: StoredFile | null;
    submittedSourceFiles: StoredFile[];
    finalFile: StoredFile | null;
  };
};

const phases = [
  "Reading the freelancer files",
  "Comparing preview against the source package",
  "Checking the brief and visible output",
  "Writing the buyer-facing verdict",
  "Saving the review proof",
];

export default function PendingReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"pending" | "error">("pending");
  const [error, setError] = useState("The AI review failed.");
  const [record, setRecord] = useState<JobRecord | null>(null);
  const [tick, setTick] = useState(0);
  const progress = Math.min(94, 18 + tick * 4);
  const phase = phases[tick % phases.length];

  useEffect(() => {
    let intervalId: number | null = null;
    let progressIntervalId: number | null = null;
    let cancelled = false;
    const jobId =
      searchParams.get("job")?.trim() ||
      window.localStorage.getItem("smartjobs:last-ai-review-job-id") ||
      "";

    if (!jobId) {
      setStatus("error");
      setError("Open the pending review page from a real job submission.");
      return;
    }

    async function loadRecord() {
      try {
        const response = await fetch(`/jobs/${encodeURIComponent(jobId)}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as JobRecord | { error?: string };

        if (!cancelled && response.ok && "job" in payload) {
          setRecord(payload);
        }
      } catch {
        // The animated review state can still run without job metadata.
      }
    }

    function checkReviewStatus() {
      const storedStatus = window.localStorage.getItem("smartjobs:last-ai-review-status");
      const storedReview = window.localStorage.getItem("smartjobs:last-ai-review");

      if (storedStatus === "ready" && storedReview) {
        router.replace(`/review?job=${encodeURIComponent(jobId)}`);
        return true;
      }

      if (storedStatus === "error") {
        setStatus("error");
        setError(
          window.localStorage.getItem("smartjobs:last-ai-review-error") ??
            "The AI review failed.",
        );
        return true;
      }

      return false;
    }

    void loadRecord();
    progressIntervalId = window.setInterval(() => {
      setTick((current) => current + 1);
    }, 900);

    if (!checkReviewStatus()) {
      intervalId = window.setInterval(() => {
        if (checkReviewStatus() && intervalId) {
          window.clearInterval(intervalId);
        }
      }, 700);
    }

    function handleReviewUpdate() {
      if (checkReviewStatus() && intervalId) {
        window.clearInterval(intervalId);
      }
    }

    window.addEventListener("smartjobs-ai-review-updated", handleReviewUpdate);
    window.addEventListener("storage", handleReviewUpdate);

    return () => {
      cancelled = true;

      if (intervalId) {
        window.clearInterval(intervalId);
      }

      if (progressIntervalId) {
        window.clearInterval(progressIntervalId);
      }

      window.removeEventListener("smartjobs-ai-review-updated", handleReviewUpdate);
      window.removeEventListener("storage", handleReviewUpdate);
    };
  }, [router, searchParams]);

  const previewFile = getPreviewFile(record);

  return (
    <main className="flex flex-1 items-center bg-[var(--background)] px-4 py-8 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-[980px] gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="pending-review-shell overflow-hidden rounded-[18px] p-6 text-center sm:p-10">
          <div className="pending-review-aura" aria-hidden="true" />
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[var(--surface-strong)]">
            {status === "pending" ? (
              <span className="pending-review-orbit" aria-hidden="true" />
            ) : (
              <span className="text-3xl font-black">!</span>
            )}
          </div>

          <p className="mt-6 text-[12px] font-black uppercase text-[var(--text-muted)]">
            AI review
          </p>
          <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
            {status === "pending" ? "Generating review" : "Review failed"}
          </h1>
          <p className="mx-auto mt-4 max-w-[340px] text-[14px] leading-6 text-[var(--text-secondary)]">
            {status === "pending"
              ? "The page will open automatically when the AI verdict is ready."
              : error}
          </p>

          <div className="mx-auto mt-7 w-full max-w-[540px] rounded-full bg-[var(--surface-strong)] p-1">
            <div
              className="pending-review-progress h-3 rounded-full"
              style={{ width: `${status === "pending" ? progress : 100}%` }}
            />
          </div>
          <p className="mt-3 text-[12px] font-black uppercase text-[var(--text-muted)]">
            {status === "pending" ? phase : error}
          </p>

          <div className="pending-review-preview mt-8 rounded-[16px] p-4">
            <p className="mb-3 text-[11px] font-black uppercase text-[var(--text-muted)]">
              Freelancer preview
            </p>
            <GeneratedPreview file={previewFile} />
          </div>
        </div>

        <aside className="pending-review-shell rounded-[18px] p-5">
          <p className="text-[12px] font-black uppercase text-[var(--text-muted)]">
            Review pipeline
          </p>
          <div className="mt-5 grid gap-3 text-left">
            {phases.map((item, index) => {
              const active = status === "pending" && index === tick % phases.length;
              const done = progress > 24 + index * 14;

              return (
                <div
                  className={`pending-review-step rounded-[12px] px-4 py-3 ${active ? "active" : ""}`}
                  key={item}
                >
                  <p className="text-[12px] font-black text-[var(--text-primary)]">
                    {item}
                  </p>
                  <p className="mt-1 text-[11px] font-black uppercase text-[var(--text-muted)]">
                    {done ? "Processing" : "Queued"}
                  </p>
                </div>
              );
            })}
          </div>
        </aside>
      </section>

      <style>{`
        .pending-review-shell {
          position: relative;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.54)),
            color-mix(in srgb, var(--surface) 88%, white);
          border: 1px solid rgba(20, 26, 35, 0.08);
          box-shadow:
            0 30px 80px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.72);
        }

        :root[data-theme="dark"] .pending-review-shell {
          background:
            linear-gradient(180deg, rgba(32, 36, 43, 0.72), rgba(25, 27, 32, 0.58)),
            var(--surface);
          border-color: var(--border);
          box-shadow:
            0 30px 80px rgba(0, 0, 0, 0.26),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .pending-review-aura {
          position: absolute;
          inset: -120px -70px auto;
          height: 280px;
          background:
            radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--text-primary) 14%, transparent), transparent 32%),
            radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.18), transparent 24%),
            radial-gradient(circle at 80% 24%, rgba(244, 91, 99, 0.18), transparent 22%);
          filter: blur(10px);
          pointer-events: none;
        }

        .pending-review-orbit {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 3px solid color-mix(in srgb, var(--text-primary) 18%, transparent);
          border-top-color: #f45b63;
          animation: pending-review-spin 760ms linear infinite;
        }

        .pending-review-orbit::after {
          content: "";
          position: absolute;
          inset: 12px;
          border-radius: inherit;
          background: #f45b63;
          box-shadow: 0 0 26px rgba(244, 91, 99, 0.42);
        }

        .pending-review-progress {
          background:
            linear-gradient(90deg, #f45b63, #f7b267, #43c084);
          transition: width 700ms ease;
        }

        .pending-review-preview {
          position: relative;
          overflow: hidden;
          background: color-mix(in srgb, var(--surface-elevated) 70%, transparent);
          border: 1px solid var(--border);
        }

        .pending-review-preview::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.08) 34%,
            rgba(255, 255, 255, 0.58) 48%,
            rgba(255, 255, 255, 0.08) 62%,
            transparent 100%
          );
          transform: translateX(-120%);
          animation: pending-review-shimmer 1900ms ease-in-out infinite;
        }

        .pending-review-image-wrap {
          position: relative;
          overflow: hidden;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: var(--surface);
        }

        .pending-review-image {
          display: block;
          width: 100%;
          max-height: 420px;
          object-fit: contain;
          filter: saturate(0.75) blur(4px);
          opacity: 0.76;
          transform: scale(1.02);
          animation: pending-review-resolve 5200ms ease-in-out infinite alternate;
        }

        .pending-review-scan {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, transparent 0%, rgba(244, 91, 99, 0.22) 48%, transparent 52%),
            repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.08) 0 1px, transparent 1px 9px);
          animation: pending-review-scan 2100ms ease-in-out infinite;
        }

        .pending-review-skeleton {
          height: 320px;
          border-radius: 14px;
          background:
            linear-gradient(110deg, var(--surface-strong) 0%, var(--surface-elevated) 42%, var(--surface-strong) 76%);
          background-size: 240% 100%;
          animation: pending-review-skeleton 1600ms ease-in-out infinite;
        }

        .pending-review-step {
          border: 1px solid var(--border);
          background: var(--surface);
          transition: border-color 220ms ease, transform 220ms ease;
        }

        .pending-review-step.active {
          border-color: #f45b63;
          transform: translateY(-1px);
          box-shadow: 0 14px 34px rgba(244, 91, 99, 0.12);
        }

        @keyframes pending-review-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pending-review-shimmer {
          100% {
            transform: translateX(120%);
          }
        }

        @keyframes pending-review-resolve {
          0% {
            filter: saturate(0.65) blur(8px);
            opacity: 0.46;
          }
          100% {
            filter: saturate(1) blur(1.5px);
            opacity: 0.9;
          }
        }

        @keyframes pending-review-scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        @keyframes pending-review-skeleton {
          0% {
            background-position: 180% 0;
          }
          100% {
            background-position: -80% 0;
          }
        }
      `}</style>
    </main>
  );
}

function getPreviewFile(record: JobRecord | null) {
  return record?.job.previewFile ?? record?.job.submittedSourceFiles[0] ?? record?.job.finalFile ?? null;
}

function isImageFile(file: StoredFile) {
  return (
    /^(data:image|blob:|https?:\/\/)/i.test(file.url) &&
    (/\.(png|jpe?g|gif|webp|svg|bmp|avif)($|[?#])/i.test(file.url) ||
      /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(file.filename) ||
      file.url.startsWith("data:image"))
  );
}

function GeneratedPreview({ file }: { file: StoredFile | null }) {
  if (!file || !isImageFile(file)) {
    return (
      <div className="pending-review-skeleton grid place-items-center">
        <p className="text-[12px] font-black uppercase text-[var(--text-muted)]">
          Building visual preview
        </p>
      </div>
    );
  }

  return (
    <div className="pending-review-image-wrap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={file.filename}
        className="pending-review-image"
        draggable={false}
        src={file.url}
      />
      <div className="pending-review-scan" aria-hidden="true" />
    </div>
  );
}
