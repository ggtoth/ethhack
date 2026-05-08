import assert from "node:assert/strict";
import { describe, test, beforeEach } from "node:test";

import {
  acceptDummyJob,
  completeDummyJob,
  createDummyJob,
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
    assert.equal(created.contract.status, "funded");
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
    const preview = uploadDummyPreview("job_456");

    assert.equal(preview?.status, "in_progress");
    assert.equal(preview?.previewFile?.id, "file_preview_job_456");
    assert.equal(preview?.userVisiblePreview?.id, "file_preview_job_456");
    assert.equal(getDummyJob("job_456")?.previewFile?.filename, "preview.png");

    const final = uploadDummyFinal("job_456");

    assert.equal(final?.status, "in_progress");
    assert.equal(final?.previewFile?.id, "file_preview_job_456");
    assert.equal(final?.finalFile?.id, "file_final_job_456");
    assert.equal(final?.contract?.id, "contract_job_456");
    assert.equal(getDummyJob("job_456")?.finalFile?.filename, "final.zip");
  });

  test("submits jobs and prepares review inputs", () => {
    const submitted = submitDummyJob("job_456");

    assert.equal(submitted?.status, "submitted");
    assert.equal(submitted?.previewFile?.id, "file_preview_job_456");
    assert.equal(submitted?.finalFile?.id, "file_final_job_456");
    assert.equal(submitted?.reviewInputs.previewFile?.id, "file_preview_job_456");
    assert.equal(submitted?.contract?.status, "release_requested");
    assert.equal(getDummyJob("job_456")?.status, "submitted");
  });

  test("requests revisions and AI reviews through store actions", () => {
    const revision = requestDummyRevision("job_456");

    assert.equal(revision?.id, "job_456");
    assert.equal(revision?.status, "revision_requested");
    assert.equal(revision?.contract?.id, "contract_job_456");
    assert.equal(revision?.message, "Revision requested successfully");

    const review = requestDummyAiReview("job_456");

    assert.equal(review?.jobId, "job_456");
    assert.equal(review?.status, "ai_reviewed");
    assert.equal(review?.aiReview?.id, "review_job_456");
    assert.equal(review?.contract?.id, "contract_job_456");
    assert.equal(review?.reviewInputs.previewFile?.id, "file_preview_job_456");
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
