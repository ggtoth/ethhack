"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";

type StoredFile = {
  id: string;
  url: string;
  filename: string;
};

type JobRecord = {
  job: {
    id: string;
    title: string;
    previewFile: StoredFile | null;
    finalFile: StoredFile | null;
    submittedSourceFiles: StoredFile[];
    submissionNotes: string | null;
    aiReview: {
      verdict: "pass" | "needs_revision" | "fail";
      score: number;
      summary: string;
    } | null;
  };
  contract: {
    id: string;
    status: string;
    freelancerWalletAddress: string | null;
  };
};

export default function ReviewSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job")?.trim() ?? "";
  const [record, setRecord] = useState<JobRecord | null>(null);
  const [imgBroken, setImgBroken] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    fetch(`/jobs/${encodeURIComponent(jobId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((payload: unknown) => {
        if (
          typeof payload === "object" &&
          payload !== null &&
          "job" in payload
        ) {
          setRecord(payload as JobRecord);
        }
      })
      .catch(() => null);
  }, [jobId]);

  const previewFile =
    record?.job.previewFile ??
    record?.job.submittedSourceFiles[0] ??
    record?.job.finalFile ??
    null;

  const downloadableFiles = (record?.job.submittedSourceFiles ?? []).filter((f) =>
    /^(data:|blob:|https?:\/\/)/i.test(f.url),
  );

  const isImage =
    previewFile &&
    /^(data:|blob:|https?:\/\/)/i.test(previewFile.url) &&
    (/\.(png|jpe?g|gif|webp|svg|bmp|avif)($|[?#])/i.test(previewFile.url) ||
      /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(previewFile.filename));


  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center overflow-hidden bg-[var(--background)] px-4 py-12 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <Confetti />

      <section className="relative z-10 mx-auto flex w-full max-w-[680px] flex-col items-center gap-6">
        {/* Badge */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#43c084] shadow-[0_0_0_10px_rgba(67,192,132,0.15),0_16px_40px_rgba(67,192,132,0.3)]">
            <svg fill="none" height="32" viewBox="0 0 32 32" width="32">
              <path
                d="M6 17l7 7L26 9"
                stroke="white"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3.5"
              />
            </svg>
          </div>
          <p className="text-[12px] font-black uppercase tracking-widest text-[#43c084]">
            Approved &amp; released
          </p>
          <h1 className="text-center text-4xl font-black leading-tight sm:text-5xl">
            {record?.job.title ?? "Work approved!"}
          </h1>
          <p className="text-center text-[14px] leading-6 text-[var(--text-secondary)]">
            Funds have been released to the freelancer. The source files are now
            available for download.
          </p>
        </div>

        {/* Preview image */}
        {previewFile && (
          <div className="w-full overflow-hidden rounded-[20px] border border-[var(--border)] shadow-[0_24px_64px_rgba(0,0,0,0.12)]">
            {isImage && !imgBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={previewFile.filename}
                className="block max-h-[480px] w-full object-contain"
                src={previewFile.url}
                onError={() => setImgBroken(true)}
              />
            ) : (
              <div className="flex min-h-[120px] items-center justify-center bg-[var(--surface-strong)] px-6 py-8 text-center">
                <div>
                  <p className="font-black text-[var(--text-primary)]">
                    {previewFile.filename}
                  </p>
                  <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                    Source file delivered
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI summary */}
        {record?.job.aiReview?.summary && (
          <p className="text-center text-[14px] leading-7 text-[var(--text-secondary)]">
            {record.job.aiReview.summary}
          </p>
        )}

        {/* Per-file downloads */}
        {downloadableFiles.length > 0 && (
          <div className="w-full">
            <p className="mb-3 text-center text-[11px] font-black uppercase text-[var(--text-muted)]">
              Your files
            </p>
            <div className="grid gap-2">
              {downloadableFiles.map((file) => (
                <a
                  key={file.id}
                  className="flex items-center gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition hover:border-[var(--border-strong)]"
                  download={file.filename}
                  href={file.url}
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] bg-[#43c084]/10 text-[10px] font-black text-[#43c084]">
                    {file.filename.split(".").pop()?.toUpperCase() ?? "FILE"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-black text-[var(--text-primary)]">
                    {file.filename}
                  </span>
                  <span className="shrink-0 text-[12px] font-black text-[#43c084]">↓</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Secondary actions */}
        <div className="grid w-full gap-3 sm:grid-cols-2">
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-[12px] bg-[#43c084] px-6 text-center text-[14px] font-black text-white transition hover:bg-[#38a872]"
            href={`/ai-review?job=${encodeURIComponent(jobId)}`}
          >
            View ledger details
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface)] px-6 text-center text-[14px] font-black text-[var(--text-primary)] transition hover:border-[var(--text-primary)]"
            href="/my-jobs"
          >
            My jobs
          </Link>
        </div>

      </section>

      <style>{`
        .confetti-piece {
          position: fixed;
          top: -20px;
          width: 10px;
          height: 18px;
          border-radius: 999px;
          animation: confetti-fall var(--duration) linear infinite;
          animation-delay: var(--delay);
        }

        @keyframes confetti-fall {
          0% {
            opacity: 0;
            transform: translate3d(0, -24px, 0) rotate(0deg);
          }
          12% { opacity: 1; }
          90% { opacity: 1; }
          100% {
            opacity: 0;
            transform: translate3d(var(--drift), 105vh, 0) rotate(640deg);
          }
        }
      `}</style>
    </main>
  );
}

const CONFETTI = [
  ["8%",  "#43c084", "-40px", "0ms",   "2.2s"],
  ["15%", "#ffffff", "30px",  "180ms", "2.6s"],
  ["23%", "#8b5cf6", "-20px", "60ms",  "2.0s"],
  ["31%", "#f59e0b", "50px",  "320ms", "2.4s"],
  ["40%", "#43c084", "-35px", "100ms", "2.8s"],
  ["49%", "#ef4444", "25px",  "250ms", "2.1s"],
  ["57%", "#ffffff", "-55px", "400ms", "2.5s"],
  ["65%", "#8b5cf6", "40px",  "140ms", "2.3s"],
  ["74%", "#f59e0b", "-28px", "500ms", "2.7s"],
  ["82%", "#43c084", "60px",  "80ms",  "2.0s"],
  ["90%", "#ef4444", "-18px", "360ms", "2.6s"],
  ["96%", "#ffffff", "35px",  "220ms", "2.2s"],
];

function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none">
      {CONFETTI.map(([left, color, drift, delay, duration], i) => (
        <span
          className="confetti-piece"
          key={i}
          style={
            {
              left,
              background: color,
              "--drift": drift,
              "--delay": delay,
              "--duration": duration,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
