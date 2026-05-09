import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import { resetDummyStoreForTests } from "@/lib/workflow/dummy-endpoints";
import * as escrowContractActionsRoute from "../app/escrow-contracts/[contractId]/actions/route";
import * as onChainEscrowConfirmRoute from "../app/escrow-contracts/[contractId]/onchain/confirm/route";
import * as onChainEscrowPrepareRoute from "../app/escrow-contracts/[contractId]/onchain/prepare/route";
import * as escrowContractRoute from "../app/escrow-contracts/[contractId]/route";
import * as onChainEscrowFundingConfirmRoute from "../app/escrow-contracts/onchain/fund/confirm/route";
import * as onChainEscrowFundingPrepareRoute from "../app/escrow-contracts/onchain/fund/prepare/route";
import * as escrowContractsRoute from "../app/escrow-contracts/route";
import * as availableJobsRoute from "../app/freelancer/jobs/available/route";
import * as freelancerJobsRoute from "../app/freelancer/jobs/route";
import * as acceptRoute from "../app/jobs/[jobId]/accept/route";
import * as acceptJobRoute from "../app/jobs/[jobId]/accept-job/route";
import * as requestAiReviewRoute from "../app/jobs/[jobId]/request-ai-review/route";
import * as requestRevisionRoute from "../app/jobs/[jobId]/request-revision/route";
import * as jobRoute from "../app/jobs/[jobId]/route";
import * as submitRoute from "../app/jobs/[jobId]/submit/route";
import * as uploadFinalRoute from "../app/jobs/[jobId]/upload-final/route";
import * as uploadPreviewRoute from "../app/jobs/[jobId]/upload-preview/route";
import * as jobsRoute from "../app/jobs/route";
import * as currentUserJobsRoute from "../app/users/me/jobs/route";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

type ContractRouteContext = {
  params: Promise<{ contractId: string }>;
};

describe("workflow route handlers", () => {
  beforeEach(() => {
    resetDummyStoreForTests();
  });

  test("lists and creates jobs from the store", async () => {
    const listResponse = await jobsRoute.GET();
    const jobs = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.deepEqual(
      jobs.map((job: { id: string }) => job.id),
      ["job_123", "job_456", "job_789"],
    );

    const createResponse = await jobsRoute.POST(
      new Request("http://test.local/jobs", {
        method: "POST",
        body: JSON.stringify({
          title: "Route-created job",
          budget: 321,
        }),
      }),
    );
    const created = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(created.id, "job_new_1");
    assert.equal(created.title, "Route-created job");
    assert.equal(created.budget, 321);
    assert.equal(created.contract.id, "contract_job_new_1");

    const nextListResponse = await jobsRoute.GET();
    const nextJobs = await nextListResponse.json();
    assert.equal(nextJobs.length, 4);
  });

  test("returns 400 for invalid job create payloads", async () => {
    const response = await jobsRoute.POST(
      new Request("http://test.local/jobs", {
        method: "POST",
        body: JSON.stringify({
          title: "",
          budget: -1,
        }),
      }),
    );
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.error, "Invalid job payload.");
    assert.ok(payload.details.fieldErrors.title);
    assert.ok(payload.details.fieldErrors.budget);
  });

  test("reads job details with escrow and returns 404 for missing jobs", async () => {
    const found = await jobRoute.GET(new Request("http://test.local"), context("job_456"));
    const foundPayload = await found.json();

    assert.equal(found.status, 200);
    assert.equal(foundPayload.job.id, "job_456");
    assert.equal(foundPayload.contract.id, "contract_job_456");

    const missing = await jobRoute.GET(new Request("http://test.local"), context("missing"));
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { error: "Job not found." });
  });

  test("lists role-specific jobs from the store", async () => {
    const freelancerResponse = await freelancerJobsRoute.GET();
    const freelancerJobs = await freelancerResponse.json();
    assert.deepEqual(
      freelancerJobs.map((job: { id: string }) => job.id),
      ["job_123", "job_456"],
    );

    const availableResponse = await availableJobsRoute.GET();
    const availableJobs = await availableResponse.json();
    assert.deepEqual(
      availableJobs.map((job: { id: string }) => job.id),
      ["job_789"],
    );

    const currentUserResponse = await currentUserJobsRoute.GET();
    const currentUserJobs = await currentUserResponse.json();
    assert.deepEqual(
      currentUserJobs.map((job: { id: string }) => job.id),
      ["job_123", "job_789"],
    );
  });

  test("reads and patches escrow contracts from the store", async () => {
    const listResponse = await escrowContractsRoute.GET();
    const contracts = await listResponse.json();
    assert.deepEqual(
      contracts.map((contract: { id: string }) => contract.id),
      ["contract_job_123", "contract_job_456", "contract_job_789"],
    );

    const found = await escrowContractRoute.GET(
      new Request("http://test.local"),
      contractContext("contract_job_456"),
    );
    const foundPayload = await found.json();
    assert.equal(found.status, 200);
    assert.equal(foundPayload.jobId, "job_456");
    assert.equal(foundPayload.status, "locked");

    const patched = await escrowContractRoute.PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({ disputeReason: "Manual note." }),
      }),
      contractContext("contract_job_456"),
    );
    const patchedPayload = await patched.json();
    assert.equal(patched.status, 200);
    assert.equal(patchedPayload.disputeReason, "Manual note.");

    const invalidPatch = await escrowContractRoute.PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({ status: "released" }),
      }),
      contractContext("contract_job_456"),
    );
    assert.equal(invalidPatch.status, 400);
    assert.equal(
      (await invalidPatch.json()).error,
      "Invalid escrow contract payload.",
    );
  });

  test("mutates escrow contracts through action routes", async () => {
    const submitted = await submitRoute.POST(
      new Request("http://test.local", {
        method: "POST",
        body: JSON.stringify({
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
          submissionNotes: "Route submission notes.",
        }),
      }),
      context("job_456"),
    );
    assert.equal((await submitted.json()).contract.status, "release_requested");

    const released = await escrowContractActionsRoute.POST(
      new Request("http://test.local", {
        method: "POST",
        body: JSON.stringify({
          action: "release",
          transactionHash: "0xrelease456",
        }),
      }),
      contractContext("contract_job_456"),
    );
    const releasedPayload = await released.json();
    assert.equal(released.status, 200);
    assert.equal(releasedPayload.contract.status, "released");
    assert.equal(releasedPayload.contract.releaseTransactionHash, "0xrelease456");
    assert.equal(releasedPayload.message, "Escrow released successfully");

    const invalid = await escrowContractActionsRoute.POST(
      new Request("http://test.local", {
        method: "POST",
        body: JSON.stringify({ action: "refund" }),
      }),
      contractContext("contract_job_456"),
    );
    assert.equal(invalid.status, 409);
    assert.deepEqual(await invalid.json(), {
      error: 'Cannot refund an escrow contract with status "released".',
    });
  });

  test("prepares and confirms on-chain escrow actions without wallet logic", async () => {
    process.env.NEXT_PUBLIC_SMARTJOBS_ESCROW_ADDRESS =
      "0x0000000000000000000000000000000000009999";

    const prepare = await onChainEscrowPrepareRoute.POST(
      new Request("http://test.local", {
        method: "POST",
        body: JSON.stringify({
          action: "lock",
          freelancerId: "freelancer_wallet_test",
          freelancerWalletAddress: "0x0000000000000000000000000000000000000abc",
        }),
      }),
      contractContext("contract_job_789"),
    );
    const prepared = await prepare.json();

    assert.equal(prepare.status, 200);
    assert.equal(prepared.transaction.chainId, 11155111);
    assert.equal(prepared.transaction.functionName, "lockEscrow");
    assert.equal(prepared.transaction.args[1], "0x0000000000000000000000000000000000000aBc");
    assert.equal(
      prepared.confirmation.href,
      "/escrow-contracts/contract_job_789/onchain/confirm",
    );

    const confirm = await onChainEscrowConfirmRoute.POST(
      new Request("http://test.local", {
        method: "POST",
        body: JSON.stringify({
          action: "lock",
          transactionHash: "0xlock789",
          freelancerId: "freelancer_wallet_test",
          freelancerWalletAddress: "0x0000000000000000000000000000000000000abc",
        }),
      }),
      contractContext("contract_job_789"),
    );
    const confirmed = await confirm.json();

    assert.equal(confirm.status, 200);
    assert.equal(confirmed.contract.status, "locked");
    assert.equal(confirmed.contract.freelancerId, "freelancer_wallet_test");
    assert.equal(
      confirmed.contract.freelancerWalletAddress,
      "0x0000000000000000000000000000000000000aBc",
    );
    assert.equal(confirmed.contract.lockTransactionHash, "0xlock789");
    assert.equal(confirmed.transactionHash, "0xlock789");
  });

  test("prepares and confirms on-chain escrow funding as a ledger entry", async () => {
    process.env.NEXT_PUBLIC_SMARTJOBS_ESCROW_ADDRESS =
      "0x0000000000000000000000000000000000009999";

    const prepare = await onChainEscrowFundingPrepareRoute.POST(
      new Request("http://test.local", {
        method: "POST",
        body: JSON.stringify({
          jobId: "job_chain_new",
          contractId: "contract_job_chain_new",
          amountEth: "0.25",
        }),
      }),
    );
    const prepared = await prepare.json();

    assert.equal(prepare.status, 200);
    assert.equal(prepared.jobId, "job_chain_new");
    assert.equal(prepared.contractId, "contract_job_chain_new");
    assert.equal(prepared.transaction.functionName, "createEscrow");
    assert.equal(prepared.transaction.value, "0x3782dace9d90000");

    const confirm = await onChainEscrowFundingConfirmRoute.POST(
      new Request("http://test.local", {
        method: "POST",
        body: JSON.stringify({
          id: "job_chain_new",
          contractId: "contract_job_chain_new",
          title: "Chain-funded route job",
          description: "Create after the frontend sends a chain transaction.",
          budget: 875,
          requirements: "Record tx hash and keep AI review context local.",
          transactionHash: "0xfunded",
          amountEth: "0.25",
          clientWalletAddress: "0x0000000000000000000000000000000000000abc",
          submissionNotes: "Funded from the frontend wallet.",
        }),
      }),
    );
    const confirmed = await confirm.json();

    assert.equal(confirm.status, 201);
    assert.equal(confirmed.id, "job_chain_new");
    assert.equal(confirmed.contract.status, "funded");
    assert.equal(confirmed.contract.fundingTransactionHash, "0xfunded");
    assert.equal(confirmed.contract.amount, 0.25);
    assert.equal(confirmed.contract.chainId, 11155111);
    assert.equal(
      confirmed.contract.escrowAddress,
      "0x0000000000000000000000000000000000009999",
    );
    assert.equal(
      confirmed.contract.clientWalletAddress,
      "0x0000000000000000000000000000000000000abc",
    );
  });

  test("mutates jobs through action routes", async () => {
    const accepted = await acceptJobRoute.POST(
      new Request("http://test.local"),
      context("job_789"),
    );
    const acceptedPayload = await accepted.json();
    assert.equal(acceptedPayload.id, "job_789");
    assert.equal(acceptedPayload.status, "in_progress");
    assert.equal(acceptedPayload.assignedTo, "freelancer_123");
    assert.equal(acceptedPayload.contract.status, "locked");

    const preview = await uploadPreviewRoute.POST(
      new Request("http://test.local", {
        method: "POST",
        body: JSON.stringify({
          previewFile: {
            id: "preview_job_789",
            url: "https://demo.app/preview",
            filename: "preview",
          },
        }),
      }),
      context("job_789"),
    );
    const previewPayload = await preview.json();
    assert.equal(previewPayload.previewFile.id, "preview_job_789");

    const final = await uploadFinalRoute.POST(
      new Request("http://test.local", {
        method: "POST",
        body: JSON.stringify({
          finalFile: {
            id: "final_job_789",
            url: "https://github.com/demo/source/archive.zip",
            filename: "archive.zip",
          },
        }),
      }),
      context("job_789"),
    );
    const finalPayload = await final.json();
    assert.equal(finalPayload.finalFile.id, "final_job_789");

    const submitted = await submitRoute.POST(
      new Request("http://test.local", {
        method: "POST",
        body: JSON.stringify({
          submittedSourceFiles: [
            {
              id: "source_job_789",
              url: "https://github.com/demo/source/archive.zip",
              filename: "archive.zip",
            },
          ],
          submissionNotes: "Ready for review.",
        }),
      }),
      context("job_789"),
    );
    const submittedPayload = await submitted.json();
    assert.equal(submittedPayload.status, "submitted");
    assert.equal(submittedPayload.reviewInputs.sourceFiles[0].id, "source_job_789");
    assert.equal(submittedPayload.contract.status, "release_requested");

    const aiReview = await requestAiReviewRoute.POST(
      new Request("http://test.local"),
      context("job_789"),
    );
    const aiReviewPayload = await aiReview.json();
    assert.equal(aiReviewPayload.status, "ai_reviewed");
    assert.equal(aiReviewPayload.reviewInputs.submissionNotes, "Ready for review.");

    const revision = await requestRevisionRoute.POST(
      new Request("http://test.local"),
      context("job_789"),
    );
    const revisionPayload = await revision.json();
    assert.equal(revisionPayload.id, "job_789");
    assert.equal(revisionPayload.status, "revision_requested");

    const completed = await acceptRoute.POST(
      new Request("http://test.local"),
      context("job_789"),
    );
    const completedPayload = await completed.json();
    assert.equal(completedPayload.id, "job_789");
    assert.equal(completedPayload.status, "completed");
    assert.equal(completedPayload.contract.status, "released");
  });

  test("job completion route returns conflict for invalid escrow state", async () => {
    const response = await acceptRoute.POST(
      new Request("http://test.local"),
      context("job_789"),
    );

    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), {
      error: 'Cannot release an escrow contract with status "funded".',
    });
  });
});

function context(jobId: string): RouteContext {
  return {
    params: Promise.resolve({ jobId }),
  };
}

function contractContext(contractId: string): ContractRouteContext {
  return {
    params: Promise.resolve({ contractId }),
  };
}
