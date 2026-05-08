import type { PreparedReviewedFile } from "@/lib/review/image-metadata";

type BuildPromptArgs = {
  jobId: string;
  contractId?: string;
  description: string;
  sources: PreparedReviewedFile[];
  previews: PreparedReviewedFile[];
};

export function buildReviewPrompt({
  jobId,
  contractId,
  description,
  sources,
  previews,
}: BuildPromptArgs) {
  const manifest = {
    job_id: jobId,
    contract_id: contractId ?? null,
    description: description || "No user description provided.",
    sources: sources.map((source) => ({
      client_id: source.clientId,
      file_id: source.reviewedFile.file_id,
      filename: source.reviewedFile.filename,
      resolution: source.reviewedFile.resolution,
      md5: source.reviewedFile.md5,
      sha256: source.reviewedFile.sha256,
    })),
    previews: previews.map((preview) => ({
      client_id: preview.clientId,
      source_client_id: preview.pairedSourceClientId ?? null,
      file_id: preview.reviewedFile.file_id,
      filename: preview.reviewedFile.filename,
      resolution: preview.reviewedFile.resolution,
      md5: preview.reviewedFile.md5,
      sha256: preview.reviewedFile.sha256,
    })),
  };

  return [
    "You are reviewing AI-generated preview images against source images.",
    "Return only schema-valid JSON.",
    "The comparison is for exactly one job. Use the provided job_id on every comparison.",
    "If contract_id is present, treat it as the escrow contract that owns this review.",
    "Use the provided file_id values exactly as given.",
    "If a preview includes source_client_id, prefer that as the intended pairing.",
    "If pairing is unclear, infer the most likely match and put unmatched files into the unmatched arrays.",
    "Assess whether the preview is faithful to the source and to the user description.",
    "Confidence values must be between 0 and 1.",
    "",
    JSON.stringify(manifest, null, 2),
  ].join("\n");
}
