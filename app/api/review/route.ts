import { runBatchReview } from "@/lib/review/service";
import type { ReviewInputFile } from "@/lib/review/schema";
import { getDummyJobWithContract } from "@/lib/workflow/dummy-endpoints";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const jobId = getOptionalString(formData, "jobId");
    const contractId = getOptionalString(formData, "contractId");
    const sourceFiles = formData.getAll("sources").filter(isFile);
    const previewFiles = formData.getAll("previews").filter(isFile);

    if (!jobId || !contractId) {
      return Response.json(
        { error: "The review request must include a job ID and contract ID." },
        { status: 400 },
      );
    }

    const jobRecord = getDummyJobWithContract(jobId);

    if (!jobRecord) {
      return Response.json({ error: "Job not found." }, { status: 404 });
    }

    const { job, contract } = jobRecord;

    if (contract.id !== contractId || contract.jobId !== job.id) {
      return Response.json(
        { error: "The contract ID does not match the requested job." },
        { status: 403 },
      );
    }

    const description = buildAuthoritativeDescription(job, contract);

    const normalizedSources = sourceFiles.map((file, index) => {
      const clientId = `source_${index + 1}`;

      return toReviewInputFile(file, "source", clientId);
    });

    const normalizedPreviews = previewFiles.map((file, index) => {
      const clientId = `preview_${index + 1}`;

      return toReviewInputFile(file, "preview", clientId);
    });

    const result = await runBatchReview({
      jobId: job.id,
      contractId: contract.id,
      description,
      submissionNotes: job.submissionNotes ?? undefined,
      sourceFiles: normalizedSources,
      previewFiles: normalizedPreviews,
    });

    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The review request failed.";

    return Response.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function isFile(value: FormDataEntryValue): value is File {
  return value instanceof File && value.size > 0;
}

function toReviewInputFile(
  file: File,
  role: ReviewInputFile["role"],
  clientId: string,
): ReviewInputFile {
  return {
    file,
    role,
    clientId,
    filePath: null,
    createdAt: null,
    updatedAt: null,
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
