import { submitDummyJob } from "@/lib/workflow/dummy-endpoints";
import { StoredFileSchema } from "@/lib/workflow/domain-schema";

type JobActionContext = {
  params: Promise<{ jobId: string }>;
};

export async function POST(request: Request, context: JobActionContext) {
  const { jobId } = await context.params;
  const body = await readJson(request);
  const result = submitDummyJob(jobId, {
    previewFile: body.previewFile
      ? StoredFileSchema.parse(body.previewFile)
      : undefined,
    finalFile: body.finalFile ? StoredFileSchema.parse(body.finalFile) : undefined,
    submittedSourceFiles: Array.isArray(body.submittedSourceFiles)
      ? body.submittedSourceFiles.map((file) => StoredFileSchema.parse(file))
      : undefined,
    submissionNotes:
      typeof body.submissionNotes === "string"
        ? body.submissionNotes.trim() || null
        : undefined,
    requestReleaseOnChain:
      typeof body.requestReleaseOnChain === "boolean"
        ? body.requestReleaseOnChain
        : undefined,
  });

  if (!result) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  return Response.json(result);
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
