import {
  encodeFunctionData,
  getAddress,
  keccak256,
  parseEther,
  stringToHex,
  type Address,
} from "viem";

import { smartJobsEscrowAbi } from "@/lib/contracts/smartjobs-escrow-abi";
import { SEPOLIA_CHAIN_ID, SEPOLIA_CHAIN_ID_DECIMAL } from "@/lib/wallet/ethereum";
import type {
  EscrowContract,
  OnChainEscrowAction,
  PrepareOnChainEscrowActionInput,
  PrepareOnChainEscrowFundingInput,
} from "@/lib/workflow/domain-schema";

type EscrowContractFunctionName =
  | "createEscrow"
  | "lockEscrow"
  | "requestRelease"
  | "release"
  | "refund"
  | "openDispute"
  | "cancel";

type OnChainEscrowCall = {
  chainId: number;
  chainIdHex: string;
  contractAddress: Address;
  to: Address;
  abi: typeof smartJobsEscrowAbi;
  functionName: EscrowContractFunctionName;
  args: readonly unknown[];
  data: `0x${string}`;
  value?: `0x${string}`;
};

const actionStatuses: Record<OnChainEscrowAction, EscrowContract["status"][]> = {
  lock: ["funded"],
  request_release: ["locked"],
  release: ["locked", "release_requested"],
  refund: ["funded", "locked", "release_requested", "disputed"],
  dispute: ["locked", "release_requested"],
  cancel: ["funded"],
};

export function getConfiguredEscrowAddress() {
  const configuredAddress = process.env.NEXT_PUBLIC_SMARTJOBS_ESCROW_ADDRESS;

  if (!configuredAddress) {
    return null;
  }

  return getAddress(configuredAddress);
}

export function buildOnChainEscrowAction({
  contract,
  input,
}: {
  contract: EscrowContract;
  input: PrepareOnChainEscrowActionInput;
}) {
  const contractAddress = getConfiguredEscrowAddress();

  if (!contractAddress) {
    throw new MissingEscrowAddressError();
  }

  assertActionAllowed(contract, input.action);

  const escrowId = makeEscrowId(contract.id);
  const call = makeCall({
    action: input.action,
    contractAddress,
    escrowId,
    fundedAmountEth: String(contract.amount),
    bidAmountEth: input.bidAmountEth,
    freelancerWalletAddress: input.freelancerWalletAddress,
    disputeReason: input.disputeReason,
  });

  return {
    contract,
    transaction: call,
    confirmation: {
      method: "POST",
      href: `/escrow-contracts/${contract.id}/onchain/confirm`,
      body: {
        action: input.action,
        freelancerId: input.freelancerId,
        freelancerWalletAddress: input.freelancerWalletAddress,
        bidAmountEth: input.bidAmountEth,
        disputeReason: input.disputeReason,
        transactionHash: "0x...",
      },
    },
  };
}

export function buildOnChainEscrowFunding(input: PrepareOnChainEscrowFundingInput) {
  const contractAddress = getConfiguredEscrowAddress();

  if (!contractAddress) {
    throw new MissingEscrowAddressError();
  }

  const jobId = input.jobId ?? `job_${crypto.randomUUID()}`;
  const contractId = input.contractId ?? `contract_${jobId}`;
  const escrowId = makeEscrowId(contractId);
  const valueWei = parseEther(input.amountEth);

  return {
    jobId,
    contractId,
    transaction: withEncodedData({
      ...baseCall(contractAddress),
      functionName: "createEscrow" as const,
      args: [escrowId, jobId],
      value: toHexQuantity(valueWei),
    }),
    confirmation: {
      method: "POST",
      href: "/escrow-contracts/onchain/fund/confirm",
      body: {
        id: jobId,
        contractId,
        amountEth: input.amountEth,
        transactionHash: "0x...",
      },
    },
  };
}

export function assertActionAllowed(
  contract: EscrowContract,
  action: OnChainEscrowAction,
) {
  const allowedStatuses = actionStatuses[action];

  if (!allowedStatuses.includes(contract.status)) {
    throw new OnChainEscrowActionConflictError(
      `Cannot prepare ${action.replace("_", " ")} for an escrow contract with status "${contract.status}".`,
    );
  }
}

function makeCall({
  action,
  contractAddress,
  escrowId,
  fundedAmountEth,
  bidAmountEth,
  freelancerWalletAddress,
  disputeReason,
}: {
  action: OnChainEscrowAction;
  contractAddress: Address;
  escrowId: `0x${string}`;
  fundedAmountEth: string;
  bidAmountEth?: string;
  freelancerWalletAddress?: string;
  disputeReason?: string;
}): OnChainEscrowCall {
  switch (action) {
    case "lock":
      if (!freelancerWalletAddress) {
        throw new MissingOnChainActionDetailError(
          "freelancerWalletAddress is required to lock escrow.",
        );
      }

      return withEncodedData({
        ...baseCall(contractAddress),
        functionName: "lockEscrow",
        args: [
          escrowId,
          getAddress(freelancerWalletAddress),
          parseEther(bidAmountEth ?? fundedAmountEth),
        ],
      });
    case "request_release":
      return withEncodedData({
        ...baseCall(contractAddress),
        functionName: "requestRelease",
        args: [escrowId],
      });
    case "release":
      return withEncodedData({
        ...baseCall(contractAddress),
        functionName: "release",
        args: [escrowId],
      });
    case "refund":
      return withEncodedData({
        ...baseCall(contractAddress),
        functionName: "refund",
        args: [escrowId],
      });
    case "dispute":
      return withEncodedData({
        ...baseCall(contractAddress),
        functionName: "openDispute",
        args: [escrowId, disputeReason ?? "Dispute opened."],
      });
    case "cancel":
      return withEncodedData({
        ...baseCall(contractAddress),
        functionName: "cancel",
        args: [escrowId],
      });
  }
}

function baseCall(contractAddress: Address) {
  return {
    chainId: SEPOLIA_CHAIN_ID_DECIMAL,
    chainIdHex: SEPOLIA_CHAIN_ID,
    contractAddress,
    to: contractAddress,
    abi: smartJobsEscrowAbi,
  };
}

function withEncodedData<
  T extends {
    abi: typeof smartJobsEscrowAbi;
    functionName: EscrowContractFunctionName;
    args: readonly unknown[];
  },
>(call: T) {
  return {
    ...call,
    args: call.args.map((arg) => (typeof arg === "bigint" ? arg.toString() : arg)),
    data: encodeFunctionData({
      abi: call.abi,
      functionName: call.functionName,
      args: call.args as never,
    }),
  };
}

function toHexQuantity(value: bigint): `0x${string}` {
  return `0x${value.toString(16)}`;
}

function makeEscrowId(value: string): `0x${string}` {
  return keccak256(stringToHex(value));
}

export class MissingEscrowAddressError extends Error {
  constructor() {
    super("Set NEXT_PUBLIC_SMARTJOBS_ESCROW_ADDRESS before preparing escrow transactions.");
    this.name = "MissingEscrowAddressError";
  }
}

export class MissingOnChainActionDetailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingOnChainActionDetailError";
  }
}

export class OnChainEscrowActionConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OnChainEscrowActionConflictError";
  }
}
