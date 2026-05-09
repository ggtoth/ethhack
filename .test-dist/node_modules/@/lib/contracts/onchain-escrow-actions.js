"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnChainEscrowActionConflictError = exports.MissingOnChainActionDetailError = exports.MissingEscrowAddressError = void 0;
exports.getConfiguredEscrowAddress = getConfiguredEscrowAddress;
exports.buildOnChainEscrowAction = buildOnChainEscrowAction;
exports.buildOnChainEscrowFunding = buildOnChainEscrowFunding;
exports.assertActionAllowed = assertActionAllowed;
const viem_1 = require("viem");
const smartjobs_escrow_abi_1 = require("@/lib/contracts/smartjobs-escrow-abi");
const ethereum_1 = require("@/lib/wallet/ethereum");
const actionStatuses = {
    lock: ["funded"],
    request_release: ["locked"],
    release: ["locked", "release_requested"],
    refund: ["funded", "locked", "release_requested", "disputed"],
    dispute: ["locked", "release_requested"],
    cancel: ["funded"],
};
function getConfiguredEscrowAddress() {
    const configuredAddress = process.env.NEXT_PUBLIC_SMARTJOBS_ESCROW_ADDRESS;
    if (!configuredAddress) {
        return null;
    }
    return (0, viem_1.getAddress)(configuredAddress);
}
function buildOnChainEscrowAction({ contract, input, }) {
    const contractAddress = getConfiguredEscrowAddress();
    if (!contractAddress) {
        throw new MissingEscrowAddressError();
    }
    assertActionAllowed(contract, input.action);
    const escrowId = (0, viem_1.stringToHex)(contract.id, { size: 32 });
    const call = makeCall({
        action: input.action,
        contractAddress,
        escrowId,
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
                disputeReason: input.disputeReason,
                transactionHash: "0x...",
            },
        },
    };
}
function buildOnChainEscrowFunding(input) {
    const contractAddress = getConfiguredEscrowAddress();
    if (!contractAddress) {
        throw new MissingEscrowAddressError();
    }
    const jobId = input.jobId ?? `job_${crypto.randomUUID()}`;
    const contractId = input.contractId ?? `contract_${jobId}`;
    const escrowId = (0, viem_1.stringToHex)(contractId, { size: 32 });
    const valueWei = (0, viem_1.parseEther)(input.amountEth);
    return {
        jobId,
        contractId,
        transaction: {
            ...baseCall(contractAddress),
            functionName: "createEscrow",
            args: [escrowId, jobId],
            value: toHexQuantity(valueWei),
        },
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
function assertActionAllowed(contract, action) {
    const allowedStatuses = actionStatuses[action];
    if (!allowedStatuses.includes(contract.status)) {
        throw new OnChainEscrowActionConflictError(`Cannot prepare ${action.replace("_", " ")} for an escrow contract with status "${contract.status}".`);
    }
}
function makeCall({ action, contractAddress, escrowId, freelancerWalletAddress, disputeReason, }) {
    switch (action) {
        case "lock":
            if (!freelancerWalletAddress) {
                throw new MissingOnChainActionDetailError("freelancerWalletAddress is required to lock escrow.");
            }
            return {
                ...baseCall(contractAddress),
                functionName: "lockEscrow",
                args: [escrowId, (0, viem_1.getAddress)(freelancerWalletAddress)],
            };
        case "request_release":
            return {
                ...baseCall(contractAddress),
                functionName: "requestRelease",
                args: [escrowId],
            };
        case "release":
            return {
                ...baseCall(contractAddress),
                functionName: "release",
                args: [escrowId],
            };
        case "refund":
            return {
                ...baseCall(contractAddress),
                functionName: "refund",
                args: [escrowId],
            };
        case "dispute":
            return {
                ...baseCall(contractAddress),
                functionName: "openDispute",
                args: [escrowId, disputeReason ?? "Dispute opened."],
            };
        case "cancel":
            return {
                ...baseCall(contractAddress),
                functionName: "cancel",
                args: [escrowId],
            };
    }
}
function baseCall(contractAddress) {
    return {
        chainId: ethereum_1.SEPOLIA_CHAIN_ID_DECIMAL,
        chainIdHex: ethereum_1.SEPOLIA_CHAIN_ID,
        contractAddress,
        abi: smartjobs_escrow_abi_1.smartJobsEscrowAbi,
    };
}
function toHexQuantity(value) {
    return `0x${value.toString(16)}`;
}
class MissingEscrowAddressError extends Error {
    constructor() {
        super("Set NEXT_PUBLIC_SMARTJOBS_ESCROW_ADDRESS before preparing escrow transactions.");
        this.name = "MissingEscrowAddressError";
    }
}
exports.MissingEscrowAddressError = MissingEscrowAddressError;
class MissingOnChainActionDetailError extends Error {
    constructor(message) {
        super(message);
        this.name = "MissingOnChainActionDetailError";
    }
}
exports.MissingOnChainActionDetailError = MissingOnChainActionDetailError;
class OnChainEscrowActionConflictError extends Error {
    constructor(message) {
        super(message);
        this.name = "OnChainEscrowActionConflictError";
    }
}
exports.OnChainEscrowActionConflictError = OnChainEscrowActionConflictError;
