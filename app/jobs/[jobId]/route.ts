import { getDummyJob } from "@/lib/workflow/dummy-endpoints";

type JobRouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_request: Request, context: JobRouteContext) {
  const { jobId } = await context.params;
  const job = getDummyJob(jobId);

  if (!job) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  return Response.json(job);
}
