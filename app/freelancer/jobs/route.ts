import { dummyJobs, toJobListItem } from "@/lib/workflow/dummy-endpoints";

export async function GET() {
  return Response.json(
    dummyJobs
      .filter((job) => job.assignedTo === "freelancer_123")
      .map(toJobListItem),
  );
}
