import { z } from "zod";

export const MatchAssessmentSchema = z.object({
  match: z.boolean(),
  assessment: z.string(),
  confidence: z.number().min(0).max(1),
});

export const PreviewVsSourceSchema = MatchAssessmentSchema.extend({
  differences: z.array(z.string()).default([]),
  integrity: z.string(),
});

export const PreviewVsDescriptionSchema = MatchAssessmentSchema.extend({
  observations: z.array(z.string()).default([]),
});

export const SourceVsDescriptionSchema = MatchAssessmentSchema;

export const ComparisonSchema = z.object({
  source_file_id: z.string(),
  preview_file_id: z.string(),
  preview_vs_source: PreviewVsSourceSchema,
  preview_vs_description: PreviewVsDescriptionSchema,
  source_vs_description: SourceVsDescriptionSchema,
  overall_confidence: z.number().min(0).max(1),
  user_visible_summary: z.string(),
});

export const ReviewedFileSchema = z.object({
  file_id: z.string(),
  filename: z.string(),
  role: z.enum(["source", "preview"]),
  resolution: z.string().nullable(),
  md5: z.string(),
  sha256: z.string(),
});

export const ReviewResultSchema = z.object({
  comparisons: z.array(ComparisonSchema),
  unmatched_sources: z.array(z.string()).default([]),
  unmatched_previews: z.array(z.string()).default([]),
  reviewed_files: z.array(ReviewedFileSchema).default([]),
  timestamps: z.object({
    review_completed_utc: z.string(),
  }),
  overall_confidence: z.number().min(0).max(1),
  user_visible_summary: z.string(),
});

export type ReviewResult = z.infer<typeof ReviewResultSchema>;
export type ReviewedFile = z.infer<typeof ReviewedFileSchema>;

export type ReviewInputFile = {
  file: File;
  role: "source" | "preview";
  clientId: string;
  pairedSourceClientId?: string;
};
