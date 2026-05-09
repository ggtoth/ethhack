import { z } from "zod";

import { runBatchReview } from "@/lib/review/service";
import { downloadSwarmAssetForReview } from "@/lib/swarm/server";
import {
  getDummyJobWithContract,
  updateDummyJob,
} from "@/lib/workflow/dummy-endpoints";

export const runtime = "nodejs";

const SwarmReviewAssetSchema = z.object({
  clientId: z.string().trim().min(1),
  reference: z.string().trim().regex(/^[a-fA-F0-9]{64}$/),
  fileName: z.string().trim().min(1),
  contentType: z.string().trim().min(1).nullable().optional(),
  filePath: z.string().trim().min(1).nullable().optional(),
  createdAt: z.string().trim().min(1).nullable().optional(),
  updatedAt: z.string().trim().min(1).nullable().optional(),
});

const SwarmReviewRequestSchema = z.object({
  jobId: z.string().trim().min(1),
  contractId: z.string().trim().min(1),
  sourceFiles: z.array(SwarmReviewAssetSchema),
  previewFiles: z.array(SwarmReviewAssetSchema),
});

export async function POST(request: Request) {
  try {
    const body = SwarmReviewRequestSchema.parse(await request.json());
    const jobRecord = getDummyJobWithContract(body.jobId);

    if (!jobRecord) {
      return Response.json({ error: "Job not found." }, { status: 404 });
    }

    const { job, contract } = jobRecord;

    if (contract.id !== body.contractId || contract.jobId !== job.id) {
      return Response.json(
        { error: "The contract ID does not match the requested job." },
        { status: 403 },
      );
    }

    const description = buildAuthoritativeDescription(job, contract);
    const [sourceFiles, previewFiles] = await Promise.all([
      Promise.all(
        body.sourceFiles.map((file) => downloadSwarmAssetForReview(file, "source")),
      ),
      Promise.all(
        body.previewFiles.map((file) => downloadSwarmAssetForReview(file, "preview")),
      ),
    ]);

    const result = await runBatchReview({
      jobId: job.id,
      contractId: contract.id,
      description,
      submissionNotes: job.submissionNotes ?? undefined,
      sourceFiles,
      previewFiles,
    });

    const aiReview = toLedgerAiReview(job.id, result);
    updateDummyJob(job.id, {
      status: "ai_reviewed",
      aiReview,
    });

    return Response.json({
      ...result,
      aiReview,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: "Invalid Swarm review payload.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The Swarm-backed review request failed.",
      },
      { status: 500 },
    );
  }
}

function toLedgerAiReview(
  jobId: string,
  result: Awaited<ReturnType<typeof runBatchReview>>,
) {
  const verdicts = Object.values(result.verdicts);
  const hasMismatch = verdicts.some((verdict) => verdict.verdict === "MISMATCH");
  const hasPartial = verdicts.some(
    (verdict) => verdict.verdict === "PARTIAL_MATCH",
  );
  const hasInsufficient = verdicts.some(
    (verdict) => verdict.verdict === "INSUFFICIENT_EVIDENCE",
  );
  const verdict = hasMismatch
    ? "fail"
    : hasPartial || hasInsufficient
      ? "needs_revision"
      : "pass";
  const confidenceScore =
    result.comparison_notes.confidence === "HIGH"
      ? 0.9
      : result.comparison_notes.confidence === "MEDIUM"
        ? 0.7
        : 0.45;
  const verdictPenalty = hasMismatch ? 0.45 : hasPartial ? 0.2 : hasInsufficient ? 0.3 : 0;
  const score = Math.max(0, Math.min(1, confidenceScore - verdictPenalty));
  const issues = [
    ...result.comparison_notes.key_gaps,
    ...result.comparison_notes.ambiguities,
    ...verdicts
      .filter((entry) => entry.verdict !== "MATCH")
      .map((entry) => entry.reason),
  ].filter((value, index, array) => value && array.indexOf(value) === index);

  return {
    id: `review_${jobId}`,
    verdict,
    score,
    summary: result.user_visible.summary,
    issues,
  };
}

function buildAuthoritativeDescription(job: {
  id: string;
  contractId: string;
  title: string;
  description: string;
  requirements: string;
  submittedSourceFiles: Array<{ filename: string; url: string }>;
  previewFile: { filename: string; url: string } | null;
  finalFile: { filename: string; url: string } | null;
  submissionNotes: string | null;
}, contract: {
  status: string;
  disputeReason: string | null;
}) {
  return [
    `Job ID: ${job.id}`,
    `Contract ID: ${job.contractId}`,
    `Job title: ${job.title}`,
    `Job description: ${job.description}`,
    `Project requirements: ${job.requirements}`,
    `Current escrow state: ${contract.status}`,
    `Submitted source files: ${formatStoredFiles(job.submittedSourceFiles)}`,
    `Preview file: ${formatStoredFile(job.previewFile)}`,
    `Final file: ${formatStoredFile(job.finalFile)}`,
    `Submission notes: ${job.submissionNotes ?? "None"}`,
    `Dispute reason: ${contract.disputeReason ?? "None"}`,
    "If any file notes mention a Swarm reference and a verified match, treat that as authoritative backend integrity metadata for the reviewed bytes.",
  ].join("\n");
}

function formatStoredFile(file: { filename: string; url: string } | null) {
  if (!file) {
    return "None";
  }

  return `${file.filename} (${file.url})`;
}

function formatStoredFiles(files: Array<{ filename: string; url: string }>) {
  if (files.length === 0) {
    return "None";
  }

  return files.map((file) => `${file.filename} (${file.url})`).join(", ");
}
