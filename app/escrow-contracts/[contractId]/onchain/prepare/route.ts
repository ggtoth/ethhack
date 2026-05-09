import { InvalidAddressError } from "viem";
import { ZodError } from "zod";

import {
  buildOnChainEscrowAction,
  MissingEscrowAddressError,
  MissingOnChainActionDetailError,
  OnChainEscrowActionConflictError,
} from "@/lib/contracts/onchain-escrow-actions";
import { getDummyEscrowContract } from "@/lib/workflow/dummy-endpoints";
import { PrepareOnChainEscrowActionInputSchema } from "@/lib/workflow/domain-schema";

type OnChainEscrowPrepareContext = {
  params: Promise<{ contractId: string }>;
};

export async function POST(
  request: Request,
  context: OnChainEscrowPrepareContext,
) {
  const { contractId } = await context.params;
  const contract = getDummyEscrowContract(contractId);

  if (!contract) {
    return Response.json({ error: "Escrow contract not found." }, { status: 404 });
  }

  const body = await readJson(request);

  try {
    const input = PrepareOnChainEscrowActionInputSchema.parse(body);

    return Response.json(buildOnChainEscrowAction({ contract, input }));
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: "Invalid on-chain escrow action.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    if (error instanceof MissingEscrowAddressError) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    if (
      error instanceof MissingOnChainActionDetailError ||
      error instanceof InvalidAddressError
    ) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof OnChainEscrowActionConflictError) {
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
