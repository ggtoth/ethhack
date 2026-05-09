"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type JobRecord = {
  job: {
    id: string;
    contractId: string;
    title: string;
    requirements: string;
    previewFile: { url: string } | null;
    finalFile: { url: string } | null;
    submittedSourceFiles: Array<{ url: string }>;
    submissionNotes: string | null;
    status: string;
  };
  contract: {
    status: string;
  };
};

export function SubmitWorkForm({ record }: { record: JobRecord }) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState(record.job.previewFile?.url ?? "");
  const [sourceUrl, setSourceUrl] = useState(
    record.job.submittedSourceFiles[0]?.url ?? record.job.finalFile?.url ?? "",
  );
  const [notes, setNotes] = useState(record.job.submissionNotes ?? "");
  const [state, setState] = useState<{
    status: "idle" | "submitting" | "error";
    message?: string;
  }>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!previewUrl.trim() || !sourceUrl.trim()) {
      setState({
        status: "error",
        message: "Add both a preview URL and a source package URL.",
      });
      return;
    }

    setState({ status: "submitting" });

    const previewFile = makeStoredFile(record.job.id, "preview", previewUrl);
    const finalFile = makeStoredFile(record.job.id, "final", sourceUrl);
    const submittedSourceFile = makeStoredFile(record.job.id, "submitted-source", sourceUrl);

    try {
      await postJson(`/jobs/${record.job.id}/upload-preview`, {
        previewFile,
      });
      await postJson(`/jobs/${record.job.id}/upload-final`, {
        finalFile,
      });
      await postJson(`/jobs/${record.job.id}/submit`, {
        previewFile,
        finalFile,
        submittedSourceFiles: [submittedSourceFile],
        submissionNotes: notes.trim() || null,
      });

      router.push(`/ai-review?job=${encodeURIComponent(record.job.id)}`);
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "The proof package could not be submitted.",
      });
    }
  }

  return (
    <form
      className="mx-auto w-full max-w-[860px] rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-8"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-black uppercase text-[var(--text-muted)]">
            5. Submit proof
          </p>
          <h1 className="mt-3 text-[42px] font-black leading-none sm:text-[62px]">
            Proof
            <br />
            package
          </h1>
        </div>
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-right">
          <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
            Ledger state
          </p>
          <p className="mt-1 text-[13px] font-black text-[var(--text-primary)]">
            Job: {record.job.status.replaceAll("_", " ")}
          </p>
          <p className="mt-1 text-[12px] font-bold text-[var(--text-secondary)]">
            Escrow: {record.contract.status.replaceAll("_", " ")}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
        <p className="text-[12px] font-black uppercase text-[var(--text-muted)]">
          Job
        </p>
        <p className="mt-2 text-[20px] font-black text-[var(--text-primary)]">
          {record.job.title}
        </p>
        <p className="mt-3 text-[14px] leading-6 text-[var(--text-secondary)]">
          {record.job.requirements}
        </p>
      </div>

      <div className="mt-8 grid gap-4">
        <label className="grid gap-2">
          <span className="text-[13px] font-black uppercase text-[var(--text-muted)]">
            Preview
          </span>
          <input
            className="h-12 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-4 text-[15px] outline-none"
            value={previewUrl}
            onChange={(event) => setPreviewUrl(event.target.value)}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[13px] font-black uppercase text-[var(--text-muted)]">
            Source
          </span>
          <input
            className="h-12 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-4 text-[15px] outline-none"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[13px] font-black uppercase text-[var(--text-muted)]">
            Notes
          </span>
          <textarea
            className="min-h-28 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-4 py-3 text-[15px] leading-7 outline-none"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      </div>

      {state.status === "error" && (
        <p className="mt-4 rounded-[10px] border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-[13px] font-bold text-rose-100">
          {state.message}
        </p>
      )}

      <button
        className="mt-6 inline-flex h-[50px] w-full items-center justify-center rounded-[10px] bg-[var(--button)] px-6 text-[15px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)] disabled:opacity-60 sm:w-auto"
        disabled={state.status === "submitting"}
        type="submit"
      >
        {state.status === "submitting" ? "Submitting proof..." : "Submit proof"}
      </button>
    </form>
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

function makeStoredFile(jobId: string, kind: string, url: string) {
  return {
    id: `${kind}_${jobId}`,
    url,
    filename: filenameFromUrl(url),
  };
}

function filenameFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.split("/").filter(Boolean);

    return pathname[pathname.length - 1] ?? "submission.dat";
  } catch {
    const sanitized = url.split("?")[0].split("#")[0].split("/").filter(Boolean);

    return sanitized[sanitized.length - 1] ?? "submission.dat";
  }
}
