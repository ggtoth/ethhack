import { ZodError } from "zod";

import {
  createDummyJob,
  listDummyJobs,
  toJobListItem,
} from "@/lib/workflow/dummy-endpoints";

export async function GET() {
  return Response.json(listDummyJobs().map(toJobListItem));
}

export async function POST(request: Request) {
  const body = await readJson(request);

  try {
    return Response.json(createDummyJob(body), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: "Invalid job payload.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    throw error;
  }
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
