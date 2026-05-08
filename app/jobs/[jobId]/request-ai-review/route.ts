import { getDummyJob, makeAiReview, makePreviewFile } from "@/lib/workflow/dummy-endpoints";

type JobActionContext = {
  params: Promise<{ jobId: string }>;
};

export async function POST(_request: Request, context: JobActionContext) {
  const { jobId } = await context.params;
  const job = getDummyJob(jobId);
  const previewFile = job.previewFile ?? makePreviewFile(jobId);

  return Response.json({
    jobId,
    status: "ai_reviewed",
    reviewInputs: {
      sourceFiles: job.sourceFiles,
      previewFile,
    },
    aiReview: makeAiReview(jobId),
    message: "AI review completed successfully",
  });
}
