import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import {
  acceptDummyJob,
  applyDummyEscrowContractAction,
  completeDummyJob,
  confirmDummyOnChainFunding,
  createDummyJob,
  DummyWorkflowConflictError,
  getDummyEscrowContract,
  getDummyEscrowContractForJob,
  getDummyJobWithContract,
  getDummyJob,
  listDummyEscrowContracts,
  listAvailableDummyJobs,
  listCurrentUserDummyJobs,
  listDummyJobs,
  listFreelancerDummyJobs,
  makeFinalFile,
  makePreviewFile,
  requestDummyAiReview,
  requestDummyRevision,
  resetDummyStoreForTests,
  submitDummyJob,
  toJobListItem,
  updateDummyEscrowContract,
  updateDummyJob,
  uploadDummyFinal,
  uploadDummyPreview,
} from "../lib/workflow/dummy-endpoints";

describe("workflow dummy in-memory store", () => {
  beforeEach(() => {
    resetDummyStoreForTests();
  });

  test("seeds jobs on reset and returns cloned records", () => {
    const jobs = listDummyJobs();
    const contracts = listDummyEscrowContracts();

    assert.equal(jobs.length, 3);
    assert.equal(contracts.length, 3);
    assert.deepEqual(
      jobs.map((job) => job.id),
      ["job_123", "job_456", "job_789"],
    );
    assert.deepEqual(
      contracts.map((contract) => contract.id),
      ["contract_job_123", "contract_job_456", "contract_job_789"],
    );

    jobs[0].title = "Mutated outside the store";
    assert.equal(getDummyJob("job_123")?.title, "Create a logo");
    contracts[0].status = "cancelled";
    assert.equal(getDummyEscrowContract("contract_job_123")?.status, "released");
  });

  test("returns null for missing jobs", () => {
    assert.equal(getDummyJob("missing"), null);
    assert.equal(updateDummyJob("missing", { status: "completed" }), null);
    assert.equal(acceptDummyJob("missing"), null);
    assert.equal(completeDummyJob("missing"), null);
    assert.equal(requestDummyRevision("missing"), null);
    assert.equal(uploadDummyPreview("missing"), null);
    assert.equal(uploadDummyFinal("missing"), null);
    assert.equal(submitDummyJob("missing"), null);
    assert.equal(requestDummyAiReview("missing"), null);
  });

  test("creates jobs with defaults and stores them", () => {
    const created = createDummyJob({
      title: "API integration test job",
      requirements: "Return data from the in-memory DB.",
    });

    assert.equal(created.id, "job_new_1");
    assert.equal(created.contractId, "contract_job_new_1");
    assert.equal(created.title, "API integration test job");
    assert.equal(created.status, "open");
    assert.equal(created.contract.id, "contract_job_new_1");
    assert.equal(created.contract.jobId, "job_new_1");
    assert.equal(created.contract.amount, 150);
    assert.equal(created.contract.bidAmount, 0);
    assert.equal(created.contract.status, "funded");
    assert.equal(created.contract.chainId, 1);
    assert.equal(created.contract.fundingTransactionHash, "0xmockfundedjob_new_1");
    assert.equal(created.message, "Job created successfully");
    assert.equal(getDummyJob(created.id)?.requirements, "Return data from the in-memory DB.");
    assert.equal(getDummyEscrowContract(created.contractId)?.jobId, created.id);
  });

  test("rejects invalid create and update payloads", () => {
    assert.throws(
      () => createDummyJob({ title: "", budget: -1 }),
      /String must contain at least 1 character/,
    );
    assert.throws(
      () => updateDummyJob("job_123", { budget: -10 }),
      /Number must be greater than or equal to 0/,
    );
  });

  test("updates jobs and exposes list filters", () => {
    const updated = updateDummyJob("job_789", {
      assignedTo: "freelancer_123",
      status: "in_progress",
    });

    assert.equal(updated?.assignedTo, "freelancer_123");
    assert.equal(updated?.status, "in_progress");
    assert.deepEqual(
      listFreelancerDummyJobs().map((job) => job.id).sort(),
      ["job_123", "job_456", "job_789"],
    );
    assert.deepEqual(
      listCurrentUserDummyJobs().map((job) => job.id).sort(),
      ["job_123", "job_789"],
    );
    assert.deepEqual(listAvailableDummyJobs().map((job) => job.id), []);
  });

  test("accepts and completes jobs through store actions", () => {
    const accepted = acceptDummyJob("job_789");

    assert.equal(accepted?.id, "job_789");
    assert.equal(accepted?.status, "in_progress");
    assert.equal(accepted?.assignedTo, "freelancer_123");
    assert.equal(accepted?.contract?.status, "locked");
    assert.equal(accepted?.contract?.bidAmount, 80);
    assert.equal(accepted?.message, "Job accepted by freelancer");
    assert.equal(getDummyJob("job_789")?.assignedTo, "freelancer_123");
    assert.equal(getDummyEscrowContractForJob("job_789")?.freelancerId, "freelancer_123");

    const completed = completeDummyJob("job_789");

    assert.equal(completed?.id, "job_789");
    assert.equal(completed?.status, "completed");
    assert.equal(completed?.contract?.status, "released");
    assert.ok(completed?.contract?.releasedAt);
    assert.equal(completed?.message, "Job accepted successfully");
    assert.equal(getDummyJob("job_789")?.status, "completed");
  });

  test("uploads preview and final files through store actions", () => {
    const preview = uploadDummyPreview("job_456", {
      id: "preview_custom",
      url: "https://demo.app/landing",
      filename: "landing",
    });

    assert.equal(preview?.status, "in_progress");
    assert.equal(preview?.previewFile?.id, "preview_custom");
    assert.equal(preview?.userVisiblePreview?.id, "preview_custom");
    assert.equal(getDummyJob("job_456")?.previewFile?.filename, "landing");

    const final = uploadDummyFinal("job_456", {
      id: "final_custom",
      url: "https://github.com/demo/source",
      filename: "source.zip",
    });

    assert.equal(final?.status, "in_progress");
    assert.equal(final?.finalFile?.id, "final_custom");
    assert.equal(final?.contract?.id, "contract_job_456");
    assert.equal(getDummyJob("job_456")?.finalFile?.filename, "source.zip");
  });

  test("submits jobs and stores source files plus notes", () => {
    const submitted = submitDummyJob("job_456", {
      previewFile: {
        id: "preview_submit",
        url: "https://demo.app/landing",
        filename: "landing",
      },
      finalFile: {
        id: "final_submit",
        url: "https://github.com/demo/source/archive.zip",
        filename: "archive.zip",
      },
      submittedSourceFiles: [
        {
          id: "source_submit",
          url: "https://github.com/demo/source/archive.zip",
          filename: "archive.zip",
        },
      ],
      submissionNotes: "Responsive page completed.",
    });

    assert.equal(submitted?.status, "submitted");
    assert.equal(submitted?.previewFile?.id, "preview_submit");
    assert.equal(submitted?.finalFile?.id, "final_submit");
    assert.equal(submitted?.submittedSourceFiles[0]?.id, "source_submit");
    assert.equal(submitted?.submissionNotes, "Responsive page completed.");
    assert.equal(submitted?.contract?.status, "release_requested");
    assert.equal(getDummyJob("job_456")?.status, "submitted");
  });

  test("updates and transitions escrow contracts explicitly", () => {
    const patched = updateDummyEscrowContract("contract_job_456", {
      disputeReason: "Needs client attention.",
    });

    assert.equal(patched?.disputeReason, "Needs client attention.");

    const submitted = submitDummyJob("job_456");
    assert.equal(submitted?.contract?.status, "release_requested");

    const disputed = applyDummyEscrowContractAction("contract_job_456", {
      action: "dispute",
      disputeReason: "The final delivery is incomplete.",
      transactionHash: "0xdispute456",
    });

    assert.equal(disputed?.contract.status, "disputed");
    assert.equal(disputed?.contract.disputeReason, "The final delivery is incomplete.");
    assert.equal(disputed?.contract.disputeTransactionHash, "0xdispute456");
    assert.equal(getDummyJob("job_456")?.status, "disputed");

    const refunded = applyDummyEscrowContractAction("contract_job_456", {
      action: "refund",
      transactionHash: "0xrefund456",
    });

    assert.equal(refunded?.contract.status, "refunded");
    assert.equal(refunded?.contract.bidAmount, 250);
    assert.equal(refunded?.contract.refundTransactionHash, "0xrefund456");
    assert.equal(getDummyJob("job_456")?.status, "cancelled");

    assert.throws(
      () =>
        applyDummyEscrowContractAction("contract_job_456", {
          action: "release",
        }),
      DummyWorkflowConflictError,
    );
  });

  test("confirms on-chain funding into the in-memory ledger", () => {
    const created = confirmDummyOnChainFunding({
      id: "job_chain_new",
      contractId: "contract_job_chain_new",
      title: "Chain-funded route job",
      description: "Create after the frontend sends a chain transaction.",
      budget: 875,
      requirements: "Record tx hash and keep AI review context local.",
      transactionHash: "0xfunded",
      amountEth: "0.25",
      clientWalletAddress: "0x0000000000000000000000000000000000000abc",
      escrowAddress: "0x0000000000000000000000000000000000009999",
      chainId: 11155111,
    });

    assert.equal(created.id, "job_chain_new");
    assert.equal(created.contract.status, "funded");
    assert.equal(created.contract.fundingTransactionHash, "0xfunded");
    assert.equal(created.contract.amount, 0.25);
    assert.equal(created.contract.bidAmount, 0);
    assert.equal(created.contract.chainId, 11155111);
    assert.equal(created.contract.escrowAddress, "0x0000000000000000000000000000000000009999");
    assert.equal(created.contract.clientWalletAddress, "0x0000000000000000000000000000000000000abc");
  });

  test("returns null for missing escrow contract actions", () => {
    assert.equal(
      updateDummyEscrowContract("missing", { disputeReason: "Missing." }),
      null,
    );
    assert.equal(
      applyDummyEscrowContractAction("missing", { action: "release" }),
      null,
    );
  });

  test("requests revisions and AI reviews through store actions", () => {
    const revision = requestDummyRevision("job_456");

    assert.equal(revision?.id, "job_456");
    assert.equal(revision?.status, "revision_requested");
    assert.equal(revision?.contract?.id, "contract_job_456");
    assert.equal(revision?.message, "Revision requested successfully");

    submitDummyJob("job_456", {
      submittedSourceFiles: [makeFinalFile("job_456")],
      submissionNotes: "Ready for review.",
    });

    const review = requestDummyAiReview("job_456");

    assert.equal(review?.jobId, "job_456");
    assert.equal(review?.status, "ai_reviewed");
    assert.equal(review?.aiReview?.id, "review_job_456");
    assert.equal(review?.contract?.id, "contract_job_456");
    assert.equal(review?.reviewInputs.sourceFiles[0]?.id, "file_final_job_456");
    assert.equal(review?.reviewInputs.submissionNotes, "Ready for review.");
    assert.equal(getDummyJob("job_456")?.aiReview?.verdict, "pass");
    assert.equal(getDummyJobWithContract("job_456")?.contract.id, "contract_job_456");
  });

  test("maps job list items and file factories", () => {
    const job = getDummyJob("job_123");
    assert.ok(job);

    assert.deepEqual(toJobListItem(job), {
      id: "job_123",
      contractId: "contract_job_123",
      title: "Create a logo",
      description: "Need a simple coffee shop logo",
      budget: 100,
      deadline: "2026-06-01",
      status: "ai_reviewed",
      createdBy: "user_123",
      assignedTo: "freelancer_123",
      updatedAt: "2026-05-08T00:00:00.000Z",
    });
    assert.deepEqual(makePreviewFile("job_x"), {
      id: "file_preview_job_x",
      url: "https://dummy-filestore.com/preview.png",
      filename: "preview.png",
    });
    assert.deepEqual(makeFinalFile("job_x"), {
      id: "file_final_job_x",
      url: "https://dummy-filestore.com/final.zip",
      filename: "final.zip",
    });
  });
});
