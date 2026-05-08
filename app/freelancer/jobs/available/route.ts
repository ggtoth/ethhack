import {
  listAvailableDummyJobs,
  toJobListItem,
} from "@/lib/workflow/dummy-endpoints";

export async function GET() {
  return Response.json(listAvailableDummyJobs().map(toJobListItem));
}
