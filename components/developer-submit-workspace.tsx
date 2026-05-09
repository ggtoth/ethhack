"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ChangeEvent } from "react";

type FlowStep = "accepted" | "submitted" | "reviewed" | "paid";

const jobId = "job_456";
const steps: Array<{ id: FlowStep; label: string }> = [
  { id: "accepted", label: "Accept job" },
  { id: "submitted", label: "Submit work" },
  { id: "reviewed", label: "AI approved" },
  { id: "paid", label: "Wallet paid" },
];

export function DeveloperSubmitWorkspace() {
  const router = useRouter();
  const [completed, setCompleted] = useState<FlowStep[]>(["accepted"]);
  const [busy, setBusy] = useState<FlowStep | null>(null);
  const [message, setMessage] = useState("Job accepted. Escrow is locked and ready.");
  const [deliveryFile, setDeliveryFile] = useState<File | null>(null);
  const currentStep = completed[completed.length - 1];
  const canOpenReview = completed.includes("reviewed");
  const canSubmitWork = deliveryFile !== null;
  const progress = useMemo(
    () => Math.round((completed.length / steps.length) * 100),
    [completed.length],
  );

  async function submitWorkAndReview() {
    setBusy("submitted");

    try {
      const submitResponse = await fetch(`/jobs/${jobId}/submit`, { method: "POST" });
      const submitPayload = (await submitResponse.json()) as {
        message?: string;
        error?: string;
      };

      if (!submitResponse.ok) {
        setMessage(submitPayload.error ?? "The demo submit failed.");
        return;
      }

      setCompleted((existing) =>
        existing.includes("submitted") ? existing : [...existing, "submitted"],
      );
      setMessage("Work submitted. AI review is running.");
      setBusy("reviewed");

      const reviewResponse = await fetch(`/jobs/${jobId}/request-ai-review`, {
        method: "POST",
      });
      const reviewPayload = (await reviewResponse.json()) as {
        message?: string;
        error?: string;
      };

      if (!reviewResponse.ok) {
        setMessage(reviewPayload.error ?? "The AI review failed.");
        return;
      }

      setCompleted((existing) =>
        existing.includes("reviewed") ? existing : [...existing, "reviewed"],
      );
      setCompleted((existing) =>
        existing.includes("paid") ? existing : [...existing, "paid"],
      );
      setMessage(reviewPayload.message ?? "AI approved the work. Redirecting to wallet.");
      window.setTimeout(() => {
        router.push("/profile?payout=success");
      }, 700);
      return;
    } finally {
      if (busy !== "paid") {
        setBusy(null);
      }
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setDeliveryFile(file);

    if (file) {
      setMessage(`${file.name} selected. Delivery is ready to submit.`);
    }
  }

  return (
    <section className="mx-auto grid w-full max-w-[1060px] gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
      <article className="developer-panel rounded-[18px] p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[12px] font-black uppercase text-[#168a55]">
              Developer workspace
            </p>
            <h1 className="mt-3 max-w-[640px] text-4xl font-black leading-tight sm:text-5xl">
              Submit the finished project for AI review
            </h1>
            <p className="mt-4 max-w-[620px] text-[15px] leading-7 text-[var(--text-secondary)]">
              This is the freelancer/developer demo view. Upload the completed work,
              then submit it so the AI can analyze the delivery.
            </p>
          </div>
          <div className="rounded-[16px] bg-[var(--text-primary)] px-5 py-4 text-[var(--background)] shadow-[0_22px_48px_rgba(15,23,42,0.16)]">
            <p className="text-[11px] font-black uppercase opacity-60">Escrow</p>
            <p className="mt-1 text-2xl font-black leading-none">250 ETH</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          <label className="delivery-drop grid cursor-pointer gap-3 rounded-[16px] p-5">
            <input
              accept=".zip,.rar,.7z,.pdf,.png,.jpg,.jpeg,.webp,.fig,.txt,.md,.tsx,.ts,.js,.css"
              className="sr-only"
              type="file"
              onChange={handleFileChange}
            />
            <span className="text-[11px] font-black uppercase text-[var(--text-muted)]">
              Delivery file
            </span>
            <span className="text-[20px] font-black text-[var(--text-primary)]">
              {deliveryFile ? deliveryFile.name : "Upload completed work"}
            </span>
            <span className="text-[13px] leading-6 text-[var(--text-secondary)]">
              {deliveryFile
                ? `${formatFileSize(deliveryFile.size)} selected`
                : "Add the final ZIP, source package, screenshot, PDF, or project export."}
            </span>
          </label>
          <DeliveryField label="Preview URL" value="https://demo.app/landing" />
          <div className="rounded-[14px] bg-white/50 p-4 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]">
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
              Notes
            </p>
            <p className="mt-2 text-[14px] leading-6 text-[var(--text-primary)]">
              Responsive landing page completed. Final source, preview, and screenshots are
              ready for AI comparison.
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex h-12 items-center justify-center rounded-[12px] bg-[#1dbf73] px-6 text-[14px] font-black text-white transition hover:bg-[#18a864] disabled:cursor-not-allowed disabled:opacity-55"
            disabled={
              busy !== null ||
              !canSubmitWork ||
              completed.includes("submitted")
            }
            type="button"
            onClick={submitWorkAndReview}
          >
            {busy === "submitted"
              ? "Submitting"
              : busy === "reviewed"
                ? "Running AI review"
                : "Submit work"}
          </button>
        </div>
      </article>

      <aside className="developer-panel rounded-[18px] p-6">
        <p className="text-[12px] font-black uppercase text-[var(--text-muted)]">
          Demo flow
        </p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--surface-strong)]">
          <div
            className="h-full rounded-full bg-[#1dbf73] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-6 grid gap-4">
          {steps.map((step, index) => {
            const done = completed.includes(step.id);
            const active = currentStep === step.id;

            return (
              <div className="flex items-center gap-3" key={step.id}>
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-black ${
                    done
                      ? "bg-[#1dbf73] text-white"
                      : active
                        ? "bg-[#f7b500] text-white"
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

        <p className="mt-6 rounded-[14px] bg-white/50 p-4 text-[13px] leading-6 text-[var(--text-secondary)] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]">
          {message}
        </p>

        <Link
          className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-[12px] px-5 text-[14px] font-black ${
            canOpenReview
              ? "bg-[var(--button)] text-[var(--button-text)]"
              : "pointer-events-none bg-[var(--surface-strong)] text-[var(--text-muted)]"
          }`}
          href="/review"
        >
          Open user review
        </Link>
      </aside>

      <style>{`
        .developer-panel {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.55)),
            color-mix(in srgb, var(--surface) 88%, white);
          border: 1px solid rgba(20, 26, 35, 0.08);
          box-shadow:
            0 28px 70px rgba(15, 23, 42, 0.07),
            inset 0 1px 0 rgba(255, 255, 255, 0.74);
        }

        :root[data-theme="dark"] .developer-panel {
          background:
            linear-gradient(180deg, rgba(32, 36, 43, 0.72), rgba(25, 27, 32, 0.58)),
            var(--surface);
          border-color: var(--border);
          box-shadow:
            0 28px 70px rgba(0, 0, 0, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .delivery-drop {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.38)),
            color-mix(in srgb, var(--surface-elevated) 72%, transparent);
          border: 1px dashed color-mix(in srgb, #1dbf73 32%, rgba(20, 26, 35, 0.14));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.64),
            0 16px 38px rgba(29, 191, 115, 0.08);
          transition:
            border-color 180ms ease,
            background-color 180ms ease,
            transform 180ms ease;
        }

        .delivery-drop:hover {
          border-color: #1dbf73;
          transform: translateY(-1px);
        }

        :root[data-theme="dark"] .delivery-drop {
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02)),
            color-mix(in srgb, var(--surface-elevated) 78%, transparent);
          border-color: color-mix(in srgb, #1dbf73 28%, var(--border));
        }
      `}</style>
    </section>
  );
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function DeliveryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-white/50 p-4 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]">
      <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-2 break-all text-[14px] font-black text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}
