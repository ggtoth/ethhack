import { getDummyJob, makePreviewFile } from "@/lib/workflow/dummy-endpoints";

type JobActionContext = {
  params: Promise<{ jobId: string }>;
};

export async function POST(_request: Request, context: JobActionContext) {
  const { jobId } = await context.params;
  const job = getDummyJob(jobId);
  const previewFile = makePreviewFile(jobId);

  return Response.json({
    id: jobId,
    status: "in_progress",
    previewFile,
    userVisiblePreview: previewFile,
    sourceFiles: job.sourceFiles,
    message: "Preview uploaded successfully and is visible to the client",
  });
}
