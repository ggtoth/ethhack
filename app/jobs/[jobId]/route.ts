import { getDummyJobWithContract } from "@/lib/workflow/dummy-endpoints";

type JobRouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_request: Request, context: JobRouteContext) {
  const { jobId } = await context.params;
  const record = getDummyJobWithContract(jobId);

  if (!record) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  return Response.json(record);
}
