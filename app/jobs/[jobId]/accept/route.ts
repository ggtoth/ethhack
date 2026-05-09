import {
  completeDummyJob,
  DummyWorkflowConflictError,
} from "@/lib/workflow/dummy-endpoints";

type JobActionContext = {
  params: Promise<{ jobId: string }>;
};

export async function POST(_request: Request, context: JobActionContext) {
  const { jobId } = await context.params;

  try {
    const result = completeDummyJob(jobId);

    if (!result) {
      return Response.json({ error: "Job not found." }, { status: 404 });
    }

    return Response.json(result);
  } catch (error) {
    if (error instanceof DummyWorkflowConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }

    throw error;
  }
}
