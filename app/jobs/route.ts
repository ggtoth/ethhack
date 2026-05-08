import { dummyJobs, makeCreatedJob, toJobListItem } from "@/lib/workflow/dummy-endpoints";

export async function GET() {
  return Response.json(dummyJobs.map(toJobListItem));
}

export async function POST(request: Request) {
  const body = await readJson(request);

  return Response.json(makeCreatedJob(body), { status: 201 });
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
