import { getDummyJob } from "@/lib/workflow/dummy-endpoints";

type JobRouteContext = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_request: Request, context: JobRouteContext) {
  const { jobId } = await context.params;

  return Response.json(getDummyJob(jobId));
}
