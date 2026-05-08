import { dummyJobs, toJobListItem } from "@/lib/workflow/dummy-endpoints";

export async function GET() {
  return Response.json(
    dummyJobs
      .filter((job) => job.status === "open" && job.assignedTo === null)
      .map(toJobListItem),
  );
}
