import { uploadDummyPreview } from "@/lib/workflow/dummy-endpoints";
import { StoredFileSchema } from "@/lib/workflow/domain-schema";

type JobActionContext = {
  params: Promise<{ jobId: string }>;
};

export async function POST(request: Request, context: JobActionContext) {
  const { jobId } = await context.params;
  const body = await readJson(request);
  const previewFile = body.previewFile
    ? StoredFileSchema.parse(body.previewFile)
    : undefined;
  const result = uploadDummyPreview(jobId, previewFile);

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
