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

    const description = buildAuthoritativeDescription(job);

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
  title: string;
  description: string;
  requirements: string;
}) {
  return [
    `Job title: ${job.title}`,
    `Job description: ${job.description}`,
    `Project requirements: ${job.requirements}`,
  ].join("\n");
}
