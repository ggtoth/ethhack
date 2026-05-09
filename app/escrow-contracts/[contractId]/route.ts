import { ZodError } from "zod";

import {
  getDummyEscrowContract,
  updateDummyEscrowContract,
} from "@/lib/workflow/dummy-endpoints";

type EscrowContractRouteContext = {
  params: Promise<{ contractId: string }>;
};

export async function GET(
  _request: Request,
  context: EscrowContractRouteContext,
) {
  const { contractId } = await context.params;
  const contract = getDummyEscrowContract(contractId);

  if (!contract) {
    return Response.json({ error: "Escrow contract not found." }, { status: 404 });
  }

  return Response.json(contract);
}

export async function PATCH(
  request: Request,
  context: EscrowContractRouteContext,
) {
  const { contractId } = await context.params;
  const body = await readJson(request);

  try {
    const contract = updateDummyEscrowContract(contractId, body);

    if (!contract) {
      return Response.json(
        { error: "Escrow contract not found." },
        { status: 404 },
      );
    }

    return Response.json(contract);
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: "Invalid escrow contract payload.",
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
