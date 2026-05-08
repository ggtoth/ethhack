import {
  listCurrentUserDummyJobs,
  toJobListItem,
} from "@/lib/workflow/dummy-endpoints";

export async function GET() {
  return Response.json(listCurrentUserDummyJobs().map(toJobListItem));
}
