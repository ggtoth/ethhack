import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

import { resetDummyStoreForTests } from "@/lib/workflow/dummy-endpoints";
import * as jobsRoute from "../app/jobs/route";
import * as jobRoute from "../app/jobs/[jobId]/route";
import * as acceptRoute from "../app/jobs/[jobId]/accept/route";
import * as acceptJobRoute from "../app/jobs/[jobId]/accept-job/route";
import * as requestRevisionRoute from "../app/jobs/[jobId]/request-revision/route";
import * as uploadPreviewRoute from "../app/jobs/[jobId]/upload-preview/route";
import * as uploadFinalRoute from "../app/jobs/[jobId]/upload-final/route";
import * as submitRoute from "../app/jobs/[jobId]/submit/route";
import * as requestAiReviewRoute from "../app/jobs/[jobId]/request-ai-review/route";
import * as freelancerJobsRoute from "../app/freelancer/jobs/route";
import * as availableJobsRoute from "../app/freelancer/jobs/available/route";
import * as currentUserJobsRoute from "../app/users/me/jobs/route";

type RouteContext = {
  params: Promise<{ jobId: string }>;
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

  test("reads job details and returns 404 for missing jobs", async () => {
    const found = await jobRoute.GET(new Request("http://test.local"), context("job_456"));
    const foundPayload = await found.json();

    assert.equal(found.status, 200);
    assert.equal(foundPayload.id, "job_456");
    assert.equal(foundPayload.contractId, "contract_job_456");

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
    assert.equal(acceptedPayload.message, "Job accepted by freelancer");

    const preview = await uploadPreviewRoute.POST(
      new Request("http://test.local"),
      context("job_789"),
    );
    const previewPayload = await preview.json();
    assert.equal(previewPayload.previewFile.id, "file_preview_job_789");

    const final = await uploadFinalRoute.POST(
      new Request("http://test.local"),
      context("job_789"),
    );
    const finalPayload = await final.json();
    assert.equal(finalPayload.finalFile.id, "file_final_job_789");

    const submitted = await submitRoute.POST(
      new Request("http://test.local"),
      context("job_789"),
    );
    const submittedPayload = await submitted.json();
    assert.equal(submittedPayload.status, "submitted");
    assert.equal(submittedPayload.reviewInputs.previewFile.id, "file_preview_job_789");
    assert.equal(submittedPayload.contract.status, "release_requested");

    const aiReview = await requestAiReviewRoute.POST(
      new Request("http://test.local"),
      context("job_789"),
    );
    const aiReviewPayload = await aiReview.json();
    assert.equal(aiReviewPayload.status, "ai_reviewed");
    assert.equal(aiReviewPayload.aiReview.id, "review_job_789");

    const revision = await requestRevisionRoute.POST(
      new Request("http://test.local"),
      context("job_789"),
    );
    const revisionPayload = await revision.json();
    assert.equal(revisionPayload.id, "job_789");
    assert.equal(revisionPayload.status, "revision_requested");
    assert.equal(revisionPayload.contract.id, "contract_job_789");
    assert.equal(revisionPayload.message, "Revision requested successfully");

    const completed = await acceptRoute.POST(
      new Request("http://test.local"),
      context("job_789"),
    );
    const completedPayload = await completed.json();
    assert.equal(completedPayload.id, "job_789");
    assert.equal(completedPayload.status, "completed");
    assert.equal(completedPayload.contract.status, "released");
    assert.equal(completedPayload.message, "Job accepted successfully");
  });

  test("action routes return 404 for missing jobs", async () => {
    const routes = [
      acceptRoute.POST,
      acceptJobRoute.POST,
      requestRevisionRoute.POST,
      uploadPreviewRoute.POST,
      uploadFinalRoute.POST,
      submitRoute.POST,
      requestAiReviewRoute.POST,
    ];

    for (const route of routes) {
      const response = await route(new Request("http://test.local"), context("missing"));
      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { error: "Job not found." });
    }
  });
});

function context(jobId: string): RouteContext {
  return {
    params: Promise.resolve({ jobId }),
  };
}
