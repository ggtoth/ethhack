import { zodTextFormat } from "openai/helpers/zod";

import { getOpenAIClient, getReviewModel } from "@/lib/openai";
import {
  prepareReviewFile,
  type PreparedReviewedFile,
} from "@/lib/review/image-metadata";
import { buildReviewPrompt } from "@/lib/review/prompt";
import {
  ReviewModelResultSchema,
  ReviewResultSchema,
  type ReviewInputFile,
  type ReviewResult,
} from "@/lib/review/schema";

type RunReviewArgs = {
  jobId: string;
  contractId?: string;
  description: string;
  sourceFiles: ReviewInputFile[];
  previewFiles: ReviewInputFile[];
};

export async function runBatchReview({
  jobId,
  contractId,
  description,
  sourceFiles,
  previewFiles,
}: RunReviewArgs): Promise<ReviewResult> {
  const client = getOpenAIClient();

  const preparedSources = await Promise.all(sourceFiles.map(prepareReviewFile));
  const preparedPreviews = await Promise.all(previewFiles.map(prepareReviewFile));

  await uploadFiles(preparedSources);
  await uploadFiles(preparedPreviews);

  const response = await client.responses.parse({
    model: getReviewModel(),
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildReviewPrompt({
              jobId,
              contractId,
              description,
              sources: preparedSources,
              previews: preparedPreviews,
            }),
          },
          ...preparedSources.map(toImageInput),
          ...preparedPreviews.map(toImageInput),
        ],
      },
    ],
    text: {
      format: zodTextFormat(ReviewModelResultSchema, "image_review_batch"),
    },
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("The review model returned no structured output.");
  }

  return ReviewResultSchema.parse({
    ...parsed,
    job_id: jobId,
    contract_id: contractId,
    comparisons: parsed.comparisons.map((comparison) => ({
      ...comparison,
      job_id: jobId,
    })),
    reviewed_files: [
      ...preparedSources.map((item) => item.reviewedFile),
      ...preparedPreviews.map((item) => item.reviewedFile),
    ],
    timestamps: {
      review_completed_utc: new Date().toISOString(),
    },
  });
}

async function uploadFiles(files: PreparedReviewedFile[]) {
  const client = getOpenAIClient();

  const uploads = await Promise.all(
    files.map(async (file) => {
      const uploaded = await client.files.create({
        file: file.openaiFile,
        purpose: "user_data",
      });

      file.reviewedFile.file_id = uploaded.id;
    }),
  );

  return uploads;
}

function toImageInput(file: PreparedReviewedFile) {
  return {
    type: "input_image" as const,
    file_id: file.reviewedFile.file_id,
    detail: "high" as const,
  };
}
