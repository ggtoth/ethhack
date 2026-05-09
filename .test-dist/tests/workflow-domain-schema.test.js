"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const domain_schema_1 = require("../lib/workflow/domain-schema");
(0, node_test_1.describe)("workflow domain schemas", () => {
    (0, node_test_1.test)("validates complete job records", () => {
        const parsed = domain_schema_1.JobSchema.parse({
            id: "job_schema",
            contractId: "contract_job_schema",
            title: "Schema test job",
            description: "Validate job records.",
            budget: 42,
            deadline: "2026-06-01",
            requirements: "Use a schema.",
            status: "disputed",
            createdBy: "user_123",
            assignedTo: null,
            sourceFiles: [],
            submittedSourceFiles: [],
            previewFile: null,
            finalFile: null,
            submissionNotes: null,
            aiReview: null,
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:00:00.000Z",
        });
        strict_1.default.equal(parsed.id, "job_schema");
        strict_1.default.equal(parsed.status, "disputed");
    });
    (0, node_test_1.test)("validates escrow contract records", () => {
        const parsed = domain_schema_1.EscrowContractSchema.parse({
            id: "contract_schema",
            jobId: "job_schema",
            clientId: "user_123",
            freelancerId: null,
            clientWalletAddress: "0x0000000000000000000000000000000000000001",
            freelancerWalletAddress: null,
            amount: 42,
            currency: "ETH",
            status: "funded",
            fundedAt: "2026-05-08T00:00:00.000Z",
            lockedAt: null,
            releaseRequestedAt: null,
            releasedAt: null,
            disputedAt: null,
            cancelledAt: null,
            transactionHash: "0xmock",
            chainId: 1,
            escrowAddress: "0x0000000000000000000000000000000000000001",
            fundingTransactionHash: "0xmockfunded",
            lockTransactionHash: null,
            releaseRequestTransactionHash: null,
            releaseTransactionHash: null,
            refundTransactionHash: null,
            disputeTransactionHash: null,
            cancelTransactionHash: null,
            disputeReason: null,
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:00:00.000Z",
        });
        strict_1.default.equal(parsed.jobId, "job_schema");
        strict_1.default.equal(parsed.status, "funded");
        strict_1.default.equal(parsed.chainId, 1);
    });
    (0, node_test_1.test)("accepts reasonable create, update, and on-chain inputs", () => {
        strict_1.default.equal(domain_schema_1.CreateJobInputSchema.parse({
            title: "Create input",
            budget: 3,
            submittedSourceFiles: [],
            escrow: { currency: "ETH" },
        }).title, "Create input");
        strict_1.default.equal(domain_schema_1.UpdateJobInputSchema.parse({
            status: "submitted",
            assignedTo: "freelancer_123",
            submissionNotes: "Ready for review.",
        }).status, "submitted");
        strict_1.default.equal(domain_schema_1.UpdateEscrowContractInputSchema.parse({
            disputeReason: "The submitted work does not match the brief.",
        }).disputeReason, "The submitted work does not match the brief.");
        strict_1.default.equal(domain_schema_1.EscrowContractActionInputSchema.parse({
            action: "release",
            transactionHash: "0xrelease",
        }).action, "release");
        strict_1.default.equal(domain_schema_1.PrepareOnChainEscrowActionInputSchema.parse({
            action: "lock",
            freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
        }).action, "lock");
        strict_1.default.equal(domain_schema_1.ConfirmOnChainEscrowActionInputSchema.parse({
            action: "refund",
            transactionHash: "0xrefund",
        }).transactionHash, "0xrefund");
        strict_1.default.equal(domain_schema_1.PrepareOnChainEscrowFundingInputSchema.parse({
            amountEth: "0.25",
        }).amountEth, "0.25");
        strict_1.default.equal(domain_schema_1.ConfirmOnChainEscrowFundingInputSchema.parse({
            id: "job_chain",
            contractId: "contract_job_chain",
            title: "Chain job",
            description: "Created from funded escrow.",
            budget: 875,
            requirements: "Preserve tx metadata.",
            transactionHash: "0xfunded",
        }).transactionHash, "0xfunded");
    });
    (0, node_test_1.test)("rejects malformed domain records", () => {
        strict_1.default.throws(() => domain_schema_1.JobSchema.parse({
            id: "",
            contractId: "contract_bad",
            title: "",
            description: "Bad",
            budget: -1,
            deadline: "2026-06-01",
            requirements: "Bad",
            status: "open",
            createdBy: "user_123",
            assignedTo: null,
            sourceFiles: [],
            submittedSourceFiles: [],
            previewFile: null,
            finalFile: null,
            submissionNotes: null,
            aiReview: null,
            createdAt: "not-a-date",
            updatedAt: "2026-05-08T00:00:00.000Z",
        }), /String must contain at least 1 character/);
        strict_1.default.throws(() => domain_schema_1.EscrowContractSchema.parse({
            id: "contract_bad",
            jobId: "job_bad",
            clientId: "user_123",
            freelancerId: null,
            amount: -1,
            currency: "",
            status: "missing",
            fundedAt: null,
            lockedAt: null,
            releaseRequestedAt: null,
            releasedAt: null,
            disputedAt: null,
            cancelledAt: null,
            transactionHash: null,
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:00:00.000Z",
        }), /Number must be greater than or equal to 0/);
    });
});
