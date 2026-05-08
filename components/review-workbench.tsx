"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import type { ReviewResult } from "@/lib/review/schema";

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; result: ReviewResult }
  | { status: "error"; message: string };

export function ReviewWorkbench() {
  const [description, setDescription] = useState("");
  const [sources, setSources] = useState<File[]>([]);
  const [previews, setPreviews] = useState<File[]>([]);
  const [pairings, setPairings] = useState<Record<string, string>>({});
  const [submission, setSubmission] = useState<SubmissionState>({
    status: "idle",
  });

  const canSubmit = sources.length > 0 && previews.length > 0;
  const payloadSummary = useMemo(
    () => `${sources.length} source files, ${previews.length} preview files`,
    [previews.length, sources.length],
  );
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

  useEffect(() => {
    setPairings((current) => {
      const next: Record<string, string> = {};
      const validPreviewIds = new Set(previewRows.map((row) => row.clientId));
      const validSourceIds = new Set(sourceOptions.map((row) => row.clientId));

      for (const [previewId, sourceId] of Object.entries(current)) {
        if (validPreviewIds.has(previewId) && validSourceIds.has(sourceId)) {
          next[previewId] = sourceId;
        }
      }

      return next;
    });
  }, [previewRows, sourceOptions]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setSubmission({
        status: "error",
        message: "Select at least one source file and one preview file.",
      });
      return;
    }

    setSubmission({ status: "submitting" });

    const formData = new FormData();
    formData.set("description", description);
    formData.set(
      "pairings",
      JSON.stringify(
        Object.entries(pairings).map(([preview_client_id, source_client_id]) => ({
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
        message: "error" in payload ? payload.error || "The review request failed." : "The review request failed.",
      });
      return;
    }

    setSubmission({
      status: "success",
      result: payload,
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,420px)]">
        <form
          className="rounded-lg border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Batch Review
              </p>
              <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                Source and preview review scaffolding
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                Upload source files and preview files, then post them to the server-side
                review route. The API route computes metadata, uploads files to OpenAI,
                and requests structured JSON.
              </p>
            </div>

            <label className="space-y-2">
              <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Review brief
              </span>
              <textarea
                className="min-h-32 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-zinc-400 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500"
                name="description"
                placeholder="Describe what the preview should preserve or improve."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <FilePicker
                accept="image/png,image/jpeg,image/webp,image/gif"
                files={sources}
                id="sources"
                label="Source files"
                onChange={setSources}
              />
              <FilePicker
                accept="image/png,image/jpeg,image/webp,image/gif"
                files={previews}
                id="previews"
                label="Preview files"
                onChange={setPreviews}
              />
            </div>

            <section className="rounded-md border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900/40">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    Pair previews to sources
                  </h2>
                  <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    Leave a preview unpaired to let the backend infer the match.
                  </p>
                </div>
                <button
                  className="inline-flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm text-zinc-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-zinc-950"
                  disabled={Object.keys(pairings).length === 0}
                  type="button"
                  onClick={() => setPairings({})}
                >
                  Clear pairings
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {previewRows.length === 0 ? (
                  <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    Add preview files to configure explicit pairings.
                  </p>
                ) : (
                  previewRows.map((previewRow) => (
                    <div
                      key={previewRow.clientId}
                      className="grid gap-2 rounded-md border border-black/8 bg-white p-3 dark:border-white/10 dark:bg-zinc-950 md:grid-cols-[minmax(0,1fr)_220px]"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {previewRow.label}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-500">
                          {previewRow.clientId}
                        </div>
                      </div>
                      <select
                        className="h-10 rounded-md border border-black/10 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-500"
                        value={pairings[previewRow.clientId] ?? ""}
                        onChange={(event) =>
                          setPairings((current) => {
                            const next = { ...current };
                            const selected = event.target.value;

                            if (!selected) {
                              delete next[previewRow.clientId];
                            } else {
                              next[previewRow.clientId] = selected;
                            }

                            return next;
                          })
                        }
                      >
                        <option value="">Auto-match</option>
                        {sourceOptions.map((sourceOption) => (
                          <option key={sourceOption.clientId} value={sourceOption.clientId}>
                            {sourceOption.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))
                )}
              </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-black/5 pt-4 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{payloadSummary}</p>
                <button
                  className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:disabled:bg-zinc-700"
                  disabled={!canSubmit || submission.status === "submitting"}
                  type="submit"
                >
                  {submission.status === "submitting" ? "Reviewing..." : "Run review"}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                <span>{Object.keys(pairings).length} explicit pairings</span>
                <span>{description.trim() ? "Brief included" : "No brief"}</span>
              </div>
            </div>
          </div>
        </form>

        <aside className="rounded-lg border border-black/10 bg-zinc-50 p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950/60">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              Result
            </h2>
            {submission.status === "idle" && (
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                The structured review response will render here after the API route returns.
              </p>
            )}
            {submission.status === "error" && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300">
                {submission.message}
              </p>
            )}
            {submission.status === "success" && (
              <div className="space-y-4">
                <ResultSummary result={submission.result} />
                <pre className="max-h-[560px] overflow-auto rounded-md bg-zinc-950 p-4 text-xs leading-6 text-zinc-100">
                  {JSON.stringify(submission.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </aside>
      </section>
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
    <label className="flex min-h-48 flex-col gap-3 rounded-md border border-dashed border-black/15 bg-zinc-50 p-4 dark:border-white/15 dark:bg-zinc-900/50">
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
      <input
        accept={accept}
        className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-950 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800 dark:text-zinc-400 dark:file:bg-zinc-100 dark:file:text-zinc-950 dark:hover:file:bg-white"
        id={id}
        multiple
        type="file"
        onChange={(event) => onChange(Array.from(event.target.files ?? []))}
      />
      <div className="min-h-0 flex-1 space-y-2 overflow-auto">
        {files.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            No files selected.
          </p>
        ) : (
          files.map((file) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="rounded-md border border-black/8 bg-white px-3 py-2 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300"
            >
              <div className="truncate font-medium">{file.name}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-500">
                {formatBytes(file.size)}
              </div>
            </div>
          ))
        )}
      </div>
    </label>
  );
}

function ResultSummary({ result }: { result: ReviewResult }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Metric label="Comparisons" value={String(result.comparisons.length)} />
      <Metric
        label="Files reviewed"
        value={String(result.reviewed_files.length)}
      />
      <Metric
        label="Confidence"
        value={result.overall_confidence.toFixed(2)}
      />
      <div className="sm:col-span-3 rounded-md border border-black/8 bg-white px-3 py-3 text-sm leading-6 text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
        {result.user_visible_summary}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-black/8 bg-white px-3 py-3 dark:border-white/10 dark:bg-zinc-950">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
        {value}
      </div>
    </div>
  );
}

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isReviewResult(value: ReviewResult | { error?: string }): value is ReviewResult {
  return "comparisons" in value && Array.isArray(value.comparisons);
}
