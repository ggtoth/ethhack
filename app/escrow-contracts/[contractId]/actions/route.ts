import { ZodError } from "zod";

import {
  applyDummyEscrowContractAction,
  DummyWorkflowConflictError,
} from "@/lib/workflow/dummy-endpoints";

type EscrowContractActionContext = {
  params: Promise<{ contractId: string }>;
};

export async function POST(
  request: Request,
  context: EscrowContractActionContext,
) {
  const { contractId } = await context.params;
  const body = await readJson(request);

  try {
    const result = applyDummyEscrowContractAction(contractId, body);

    if (!result) {
      return Response.json(
        { error: "Escrow contract not found." },
        { status: 404 },
      );
    }

    return Response.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: "Invalid escrow contract action.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    if (error instanceof DummyWorkflowConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
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
