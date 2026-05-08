import {
  listFreelancerDummyJobs,
  toJobListItem,
} from "@/lib/workflow/dummy-endpoints";

export async function GET() {
  return Response.json(listFreelancerDummyJobs().map(toJobListItem));
}
