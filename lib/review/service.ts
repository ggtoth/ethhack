import { zodTextFormat } from "openai/helpers/zod";

import { getOpenAIClient, getReviewModel } from "@/lib/openai";
import {
  prepareReviewFile,
  type PreparedReviewedFile,
} from "@/lib/review/image-metadata";
import { buildReviewPrompt } from "@/lib/review/prompt";
import {
  ReviewResultSchema,
  type ReviewInputFile,
  type ReviewResult,
} from "@/lib/review/schema";

type RunReviewArgs = {
  description: string;
  sourceFiles: ReviewInputFile[];
  previewFiles: ReviewInputFile[];
};

export async function runBatchReview({
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
      format: zodTextFormat(ReviewResultSchema.omit({
        reviewed_files: true,
        timestamps: true,
      }), "image_review_batch"),
    },
  });

  const parsed = response.output_parsed;

  if (!parsed) {
    throw new Error("The review model returned no structured output.");
  }

  return ReviewResultSchema.parse({
    ...parsed,
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
