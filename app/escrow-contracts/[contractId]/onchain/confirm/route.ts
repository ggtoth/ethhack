import { getAddress, InvalidAddressError } from "viem";
import { ZodError } from "zod";

import {
  assertActionAllowed,
  MissingOnChainActionDetailError,
  OnChainEscrowActionConflictError,
} from "@/lib/contracts/onchain-escrow-actions";
import {
  applyDummyEscrowContractAction,
  DummyWorkflowConflictError,
  getDummyEscrowContract,
} from "@/lib/workflow/dummy-endpoints";
import { ConfirmOnChainEscrowActionInputSchema } from "@/lib/workflow/domain-schema";

type OnChainEscrowConfirmContext = {
  params: Promise<{ contractId: string }>;
};

export async function POST(
  request: Request,
  context: OnChainEscrowConfirmContext,
) {
  const { contractId } = await context.params;
  const contract = getDummyEscrowContract(contractId);

  if (!contract) {
    return Response.json({ error: "Escrow contract not found." }, { status: 404 });
  }

  const body = await readJson(request);

  try {
    const input = ConfirmOnChainEscrowActionInputSchema.parse(body);

    assertActionAllowed(contract, input.action);

    if (input.action === "lock" && !input.freelancerWalletAddress) {
      throw new MissingOnChainActionDetailError(
        "freelancerWalletAddress is required to confirm locked escrow.",
      );
    }

    const result = applyDummyEscrowContractAction(contractId, {
      action: input.action,
      transactionHash: input.transactionHash,
      clientWalletAddress: input.clientWalletAddress,
      freelancerId: input.freelancerId,
      freelancerWalletAddress: input.freelancerWalletAddress
        ? getAddress(input.freelancerWalletAddress)
        : undefined,
      disputeReason: input.disputeReason,
    });

    if (!result) {
      return Response.json(
        { error: "Escrow contract not found." },
        { status: 404 },
      );
    }

    return Response.json({
      ...result,
      transactionHash: input.transactionHash,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: "Invalid on-chain escrow confirmation.",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    if (
      error instanceof MissingOnChainActionDetailError ||
      error instanceof InvalidAddressError
    ) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    if (
      error instanceof OnChainEscrowActionConflictError ||
      error instanceof DummyWorkflowConflictError
    ) {
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
