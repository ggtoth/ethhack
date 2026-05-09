import { BaseError } from "viem";
import { ZodError } from "zod";

import {
  buildOnChainEscrowFunding,
  MissingEscrowAddressError,
} from "@/lib/contracts/onchain-escrow-actions";
import { PrepareOnChainEscrowFundingInputSchema } from "@/lib/workflow/domain-schema";

export async function POST(request: Request) {
  const body = await readJson(request);

  try {
    const input = PrepareOnChainEscrowFundingInputSchema.parse(body);

    return Response.json(buildOnChainEscrowFunding(input));
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: "Invalid on-chain escrow funding request.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    if (error instanceof MissingEscrowAddressError) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof BaseError) {
      return Response.json({ error: error.shortMessage }, { status: 400 });
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
