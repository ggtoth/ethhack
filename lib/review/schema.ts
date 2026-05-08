import { z } from "zod";

export const VerdictEnumSchema = z.enum([
  "MATCH",
  "PARTIAL_MATCH",
  "MISMATCH",
  "INSUFFICIENT_EVIDENCE",
]);

export const InputCompletenessSchema = z.enum([
  "COMPLETE",
  "PARTIAL",
  "INSUFFICIENT",
]);

export const ReviewConfidenceSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const ReviewedFileRoleSchema = z.enum(["preview", "source", "other"]);

export const VerdictSchema = z.object({
  verdict: VerdictEnumSchema,
  reason: z.string(),
  evidence: z.array(z.string()),
});

export const ReviewedFileSchema = z.object({
  file_id: z.string().nullable(),
  file_name: z.string(),
  file_path: z.string().nullable(),
  role: ReviewedFileRoleSchema,
  hash: z.object({
    algorithm: z.string().nullable(),
    value: z.string().nullable(),
    provided: z.boolean(),
  }),
  timestamps: z.object({
    created_at: z.string().nullable(),
    updated_at: z.string().nullable(),
    reviewed_at: z.string(),
  }),
  notes: z.array(z.string()),
});

export const CoreReviewResultSchema = z.object({
  schema_version: z.literal("1.0"),
  review_timestamp: z.string(),
  request_context: z.object({
    description_summary: z.string(),
    input_completeness: InputCompletenessSchema,
  }),
  verdicts: z.object({
    preview_vs_source: VerdictSchema,
    preview_vs_description: VerdictSchema,
    source_vs_description: VerdictSchema,
  }),
  reviewed_files: z.array(ReviewedFileSchema),
  comparison_notes: z.object({
    key_gaps: z.array(z.string()),
    ambiguities: z.array(z.string()),
    confidence: ReviewConfidenceSchema,
  }),
  user_visible: z.object({
    summary: z.string(),
    what_user_will_see: z.array(z.string()),
  }),
});

export const ReviewResultSchema = CoreReviewResultSchema.extend({
  overall_confidence: z.number().min(0).max(1),
  comparisons: z.array(
    z.object({
      label: z.string(),
      verdict: VerdictEnumSchema,
      reason: z.string(),
    }),
  ),
  user_visible_summary: z.string(),
});

export const ReviewModelResultSchema = CoreReviewResultSchema;

export type ReviewResult = z.infer<typeof ReviewResultSchema>;
export type CoreReviewResult = z.infer<typeof CoreReviewResultSchema>;
export type ReviewedFile = z.infer<typeof ReviewedFileSchema>;
export type ReviewedFileRole = z.infer<typeof ReviewedFileRoleSchema>;

export type ReviewInputFile = {
  file: File;
  role: "source" | "preview" | "other";
  clientId: string;
  pairedSourceClientId?: string;
  filePath?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};
