import { getDummyJob, makeFinalFile, makePreviewFile } from "@/lib/workflow/dummy-endpoints";

type JobActionContext = {
  params: Promise<{ jobId: string }>;
};

export async function POST(_request: Request, context: JobActionContext) {
  const { jobId } = await context.params;
  const job = getDummyJob(jobId);
  const previewFile = job.previewFile ?? makePreviewFile(jobId);
  const finalFile = job.finalFile ?? makeFinalFile(jobId);

  return Response.json({
    id: jobId,
    status: "submitted",
    sourceFiles: job.sourceFiles,
    previewFile,
    finalFile,
    userVisiblePreview: previewFile,
    reviewInputs: {
      sourceFiles: job.sourceFiles,
      previewFile,
    },
    message: "Job submitted for client and AI review",
  });
}
