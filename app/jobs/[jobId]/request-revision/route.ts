type JobActionContext = {
  params: Promise<{ jobId: string }>;
};

export async function POST(_request: Request, context: JobActionContext) {
  const { jobId } = await context.params;

  return Response.json({
    id: jobId,
    status: "revision_requested",
    message: "Revision requested successfully",
  });
}
