"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

type SosResponse = {
  nextUrl?: string;
  error?: string;
};

export function DemoSosButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function skipToNextStep() {
    if (busy) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch("/demo/sos", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          path: pathname,
          jobId: searchParams.get("job") ?? searchParams.get("jobId") ?? "",
        }),
      });
      const payload = (await response.json()) as SosResponse;

      if (!response.ok || !payload.nextUrl) {
        throw new Error(payload.error ?? "SOS step failed.");
      }

      window.location.assign(payload.nextUrl);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "SOS step failed.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col items-end gap-1 font-mono">
      {error && (
        <p className="max-w-[220px] rounded-[8px] border border-[var(--border)] bg-white px-2 py-1 text-right text-[10px] font-black text-red-600 shadow-lg">
          {error}
        </p>
      )}
      <button
        aria-label="SOS demo skip to next flow step"
        className="group grid h-16 w-16 cursor-pointer place-items-center bg-transparent outline-none disabled:cursor-wait"
        disabled={busy}
        title="Demo fallback: skip wallet/fee step and continue the normal flow"
        type="button"
        onClick={skipToNextStep}
      >
        <span className="grid h-7 w-7 scale-90 place-items-center rounded-full border border-[var(--border)] bg-white text-[12px] font-black text-[var(--text-primary)] opacity-0 shadow-lg transition group-hover:scale-100 group-hover:opacity-90">
          SOS
        </span>
      </button>
    </div>
  );
}
