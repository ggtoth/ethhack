import { zodTextFormat } from "openai/helpers/zod";
import type { Responses } from "openai/resources/responses/responses";

import { getOpenAIClient, getReviewModel } from "@/lib/openai";
import {
  prepareReviewFile,
  type PreparedReviewedFile,
} from "@/lib/review/image-metadata";
import {
  REVIEW_AGENT_INSTRUCTIONS,
  buildReviewPrompt,
} from "@/lib/review/prompt";
import {
  ReviewModelResultSchema,
  ReviewResultSchema,
  type ReviewInputFile,
  type ReviewResult,
} from "@/lib/review/schema";

type RunReviewArgs = {
  jobId?: string;
  contractId?: string;
  description: string;
  submissionNotes?: string;
  sourceFiles: ReviewInputFile[];
  previewFiles: ReviewInputFile[];
};

const SUPPORTED_IMAGE_INPUT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export async function runBatchReview({
  jobId,
  contractId,
  description,
  submissionNotes,
  sourceFiles,
  previewFiles,
}: RunReviewArgs): Promise<ReviewResult> {
  const reviewTimestamp = new Date().toISOString();
  const preparedSources = await Promise.all(
    sourceFiles.map((file) => prepareReviewFile(file, reviewTimestamp)),
  );
  const preparedPreviews = await Promise.all(
    previewFiles.map((file) => prepareReviewFile(file, reviewTimestamp)),
  );
  const reviewedFiles = [
    ...preparedSources.map((item) => item.reviewedFile),
    ...preparedPreviews.map((item) => item.reviewedFile),
  ];

  if (!description.trim() || preparedSources.length === 0) {
    return buildInsufficientReview({
      description,
      preparedSources,
      preparedPreviews,
      reviewTimestamp,
    });
  }

  await uploadFiles(preparedSources);
  await uploadFiles(preparedPreviews);

  const client = getOpenAIClient();
  const response = await client.responses.parse({
    model: getReviewModel(),
    input: [
      {
        role: "system",
        content: REVIEW_AGENT_INSTRUCTIONS,
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildReviewPrompt({
              jobId,
              contractId,
              description,
              submissionNotes,
              sources: preparedSources,
              previews: preparedPreviews,
            }),
          },
          ...preparedSources.map(toResponseInput),
          ...preparedPreviews.map(toResponseInput),
        ],
      },
    ],
    text: {
      format: zodTextFormat(ReviewModelResultSchema, "file_comparison_review"),
    },
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("The review model returned no structured output.");
  }

  return ReviewResultSchema.parse({
    ...parsed,
    review_timestamp: reviewTimestamp,
    request_context: {
      ...parsed.request_context,
      input_completeness: getInputCompleteness({
        description,
        hasPreview: preparedPreviews.length > 0,
        hasSource: preparedSources.length > 0,
      }),
    },
    verdicts:
      preparedPreviews.length > 0
        ? parsed.verdicts
        : {
            ...parsed.verdicts,
            preview_vs_source: missingPreviewVerdict(),
            preview_vs_description: missingPreviewVerdict(),
    },
    reviewed_files: reviewedFiles,
  });
}

async function uploadFiles(files: PreparedReviewedFile[]) {
  const client = getOpenAIClient();

  await Promise.all(
    files.map(async (file) => {
      const uploaded = await client.files.create({
        file: file.openaiFile,
        purpose: "user_data",
      });

      file.reviewedFile.file_id = uploaded.id;
    }),
  );
}

function toResponseInput(
  file: PreparedReviewedFile,
): Responses.ResponseInputContent {
  if (SUPPORTED_IMAGE_INPUT_TYPES.has(file.file.type)) {
    return {
      type: "input_image",
      file_id: file.reviewedFile.file_id,
      detail: "high",
    };
  }

  return {
    type: "input_file",
    file_id: file.reviewedFile.file_id,
  };
}

function buildInsufficientReview({
  description,
  preparedSources,
  preparedPreviews,
  reviewTimestamp,
}: {
  description: string;
  preparedSources: PreparedReviewedFile[];
  preparedPreviews: PreparedReviewedFile[];
  reviewTimestamp: string;
}) {
  const missingInputs = [
    !description.trim() ? "a usable project description" : null,
    preparedSources.length === 0 ? "at least one source/work file" : null,
    preparedPreviews.length === 0 ? "preview files" : null,
  ].filter((value): value is string => Boolean(value));
  const reason = `The request is missing ${missingInputs.join(", ")}.`;

  return ReviewResultSchema.parse({
    schema_version: "1.0",
    review_timestamp: reviewTimestamp,
    request_context: {
      description_summary: description.trim()
        ? summarizeDescription(description)
        : "No usable description was supplied.",
      input_completeness: "INSUFFICIENT",
    },
    verdicts: {
      preview_vs_source: {
        verdict: "INSUFFICIENT_EVIDENCE",
        reason,
        evidence: [],
      },
      preview_vs_description: {
        verdict: "INSUFFICIENT_EVIDENCE",
        reason,
        evidence: [],
      },
      source_vs_description: {
        verdict: "INSUFFICIENT_EVIDENCE",
        reason,
        evidence: [],
      },
    },
    reviewed_files: [
      ...preparedSources.map((item) => item.reviewedFile),
      ...preparedPreviews.map((item) => item.reviewedFile),
    ],
    comparison_notes: {
      key_gaps: missingInputs,
      ambiguities: [],
      confidence: "LOW",
    },
    user_visible: {
      summary:
        "The AI review could not make a defensible judgment because required inputs were missing.",
      what_user_will_see: [
        "Add the project description and submitted work files, then run the review again.",
      ],
    },
  });
}

function getInputCompleteness({
  description,
  hasPreview,
  hasSource,
}: {
  description: string;
  hasPreview: boolean;
  hasSource: boolean;
}) {
  if (!description.trim() || !hasSource) {
    return "INSUFFICIENT" as const;
  }

  if (!hasPreview) {
    return "PARTIAL" as const;
  }

  return "COMPLETE" as const;
}

function missingPreviewVerdict() {
  return {
    verdict: "INSUFFICIENT_EVIDENCE" as const,
    reason: "No preview file or preview output was supplied for this check.",
    evidence: [],
  };
}

function summarizeDescription(description: string) {
  const normalized = description.trim().replace(/\s+/g, " ");

  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}
