import { ZodError } from "zod";

import { confirmDummyOnChainFunding } from "@/lib/workflow/dummy-endpoints";

export async function POST(request: Request) {
  const body = await readJson(request);

  try {
    return Response.json(confirmDummyOnChainFunding(body), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: "Invalid on-chain escrow funding confirmation.",
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
