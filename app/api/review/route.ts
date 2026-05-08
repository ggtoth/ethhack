import { z } from "zod";

import { runBatchReview } from "@/lib/review/service";
import type { ReviewInputFile } from "@/lib/review/schema";
import { JobComparisonRequestSchema } from "@/lib/workflow/schema";

export const runtime = "nodejs";

const PairingSchema = z.array(
  z.object({
    preview_client_id: z.string(),
    source_client_id: z.string(),
  }),
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const jobId = String(formData.get("jobId") ?? "");
    const contractId = String(formData.get("contractId") ?? "") || undefined;
    const description = String(formData.get("description") ?? "");
    const sourceFiles = formData.getAll("sources").filter(isFile);
    const previewFiles = formData.getAll("previews").filter(isFile);
    const pairings = parsePairings(String(formData.get("pairings") ?? "[]"));
    const comparisonRequest = parseComparisonRequest({
      job_id: jobId,
      contract_id: contractId,
      description,
      pairings,
    });

    if (sourceFiles.length === 0 || previewFiles.length === 0) {
      return Response.json(
        {
          error: "At least one source file and one preview file are required.",
        },
        { status: 400 },
      );
    }

    const normalizedSources = sourceFiles.map((file, index) =>
      toReviewInputFile(file, "source", `source_${index + 1}`),
    );

    const normalizedPreviews = previewFiles.map((file, index) => {
      const clientId = `preview_${index + 1}`;
      const explicitPair = pairings.find(
        (pairing) => pairing.preview_client_id === clientId,
      );

      return toReviewInputFile(file, "preview", clientId, explicitPair?.source_client_id);
    });

    const result = await runBatchReview({
      jobId: comparisonRequest.job_id,
      contractId: comparisonRequest.contract_id,
      description: comparisonRequest.description,
      sourceFiles: normalizedSources,
      previewFiles: normalizedPreviews,
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return Response.json(
        {
          error: error.message,
          details: error.zodError.flatten(),
        },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Review scaffolding failed.";

    return Response.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}

function parseComparisonRequest(value: unknown) {
  const parsed = JobComparisonRequestSchema.safeParse(value);

  if (!parsed.success) {
    throw new RequestValidationError(parsed.error);
  }

  return parsed.data;
}

class RequestValidationError extends Error {
  constructor(readonly zodError: z.ZodError) {
    super("A valid job id and description are required for comparison.");
  }
}

function isFile(value: FormDataEntryValue): value is File {
  return value instanceof File && value.size > 0;
}

function toReviewInputFile(
  file: File,
  role: ReviewInputFile["role"],
  clientId: string,
  pairedSourceClientId?: string,
): ReviewInputFile {
  return {
    file,
    role,
    clientId,
    pairedSourceClientId,
  };
}

function parsePairings(value: string) {
  try {
    return PairingSchema.parse(JSON.parse(value));
  } catch {
    return [];
  }
}
