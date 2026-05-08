import { uploadDummyFinal } from "@/lib/workflow/dummy-endpoints";

type JobActionContext = {
  params: Promise<{ jobId: string }>;
};

export async function POST(_request: Request, context: JobActionContext) {
  const { jobId } = await context.params;
  const result = uploadDummyFinal(jobId);

  if (!result) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  return Response.json(result);
}
