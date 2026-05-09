import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  ConfirmOnChainEscrowActionInputSchema,
  ConfirmOnChainEscrowFundingInputSchema,
  CreateJobInputSchema,
  EscrowContractActionInputSchema,
  EscrowContractSchema,
  JobSchema,
  PrepareOnChainEscrowActionInputSchema,
  PrepareOnChainEscrowFundingInputSchema,
  UpdateEscrowContractInputSchema,
  UpdateJobInputSchema,
} from "../lib/workflow/domain-schema";

describe("workflow domain schemas", () => {
  test("validates complete job records", () => {
    const parsed = JobSchema.parse({
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

    assert.equal(parsed.id, "job_schema");
    assert.equal(parsed.status, "disputed");
  });

  test("validates escrow contract records", () => {
    const parsed = EscrowContractSchema.parse({
      id: "contract_schema",
      jobId: "job_schema",
      clientId: "user_123",
      freelancerId: null,
      clientWalletAddress: "0x0000000000000000000000000000000000000001",
      freelancerWalletAddress: null,
      amount: 42,
      bidAmount: 21,
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

    assert.equal(parsed.jobId, "job_schema");
    assert.equal(parsed.status, "funded");
    assert.equal(parsed.bidAmount, 21);
    assert.equal(parsed.chainId, 1);
  });

  test("accepts reasonable create, update, and on-chain inputs", () => {
    assert.equal(
      CreateJobInputSchema.parse({
        title: "Create input",
        budget: 3,
        submittedSourceFiles: [],
        escrow: { currency: "ETH", bidAmount: 1.5 },
      }).title,
      "Create input",
    );
    assert.equal(
      UpdateJobInputSchema.parse({
        status: "submitted",
        assignedTo: "freelancer_123",
        submissionNotes: "Ready for review.",
      }).status,
      "submitted",
    );
    assert.equal(
      UpdateEscrowContractInputSchema.parse({
        bidAmount: 0.5,
        disputeReason: "The submitted work does not match the brief.",
      }).disputeReason,
      "The submitted work does not match the brief.",
    );
    assert.equal(
      EscrowContractActionInputSchema.parse({
        action: "release",
        transactionHash: "0xrelease",
      }).action,
      "release",
    );
    assert.equal(
      PrepareOnChainEscrowActionInputSchema.parse({
        action: "lock",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000002",
      }).action,
      "lock",
    );
    assert.equal(
      ConfirmOnChainEscrowActionInputSchema.parse({
        action: "refund",
        transactionHash: "0xrefund",
      }).transactionHash,
      "0xrefund",
    );
    assert.equal(
      PrepareOnChainEscrowFundingInputSchema.parse({
        amountEth: "0.25",
      }).amountEth,
      "0.25",
    );
    assert.equal(
      ConfirmOnChainEscrowFundingInputSchema.parse({
        id: "job_chain",
        contractId: "contract_job_chain",
        title: "Chain job",
        description: "Created from funded escrow.",
        budget: 875,
        requirements: "Preserve tx metadata.",
        transactionHash: "0xfunded",
      }).transactionHash,
      "0xfunded",
    );
  });

  test("rejects malformed domain records", () => {
    assert.throws(
      () =>
        JobSchema.parse({
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
        }),
      /String must contain at least 1 character/,
    );
    assert.throws(
      () =>
        EscrowContractSchema.parse({
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
        }),
      /Number must be greater than or equal to 0/,
    );
  });
});
