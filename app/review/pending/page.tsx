"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PendingReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"pending" | "error">("pending");
  const [error, setError] = useState("The AI review failed.");

  useEffect(() => {
    let intervalId: number | null = null;
    const jobId =
      searchParams.get("job")?.trim() ||
      window.localStorage.getItem("smartjobs:last-ai-review-job-id") ||
      "";

    if (!jobId) {
      setStatus("error");
      setError("Open the pending review page from a real job submission.");
      return;
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
      if (intervalId) {
        window.clearInterval(intervalId);
      }

      window.removeEventListener("smartjobs-ai-review-updated", handleReviewUpdate);
      window.removeEventListener("storage", handleReviewUpdate);
    };
  }, [router, searchParams]);

  return (
    <main className="flex flex-1 items-center bg-[var(--background)] px-4 py-10 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-[520px] gap-5 text-center">
        <div className="pending-review-shell rounded-[18px] p-8 sm:p-10">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[var(--surface-strong)]">
            {status === "pending" ? (
              <span className="pending-review-spinner" aria-hidden="true" />
            ) : (
              <span className="text-3xl font-black">!</span>
            )}
          </div>

          <p className="mt-6 text-[12px] font-black uppercase text-[var(--text-muted)]">
            AI review
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
            {status === "pending" ? "Checking your delivery" : "Review failed"}
          </h1>
          <p className="mx-auto mt-4 max-w-[340px] text-[14px] leading-6 text-[var(--text-secondary)]">
            {status === "pending"
              ? "We are analyzing the files. The result will open automatically."
              : error}
          </p>

          <div className="pending-review-preview mt-7 rounded-[16px] p-4" aria-hidden="true">
            <div className="mx-auto h-8 w-28 rounded-full bg-[var(--surface-strong)]" />
            <div className="mx-auto mt-5 h-16 w-40 rounded-[12px] bg-[var(--surface-strong)]" />
            <div className="mt-6 h-3 rounded-full bg-[var(--surface-strong)]" />
            <div className="mt-3 h-3 rounded-full bg-[var(--surface-strong)]" />
          </div>
        </div>
      </section>

      <style>{`
        .pending-review-shell {
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

        .pending-review-spinner {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 4px solid color-mix(in srgb, var(--text-primary) 16%, transparent);
          border-top-color: var(--text-primary);
          animation: pending-review-spin 760ms linear infinite;
        }

        .pending-review-preview {
          filter: blur(7px);
          opacity: 0.5;
          background: color-mix(in srgb, var(--surface-elevated) 70%, transparent);
        }

        @keyframes pending-review-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}
