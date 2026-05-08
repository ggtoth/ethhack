import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { beforeEach, describe, test } from "node:test";

import { resetDummyStoreForTests } from "@/lib/workflow/dummy-endpoints";
import type { ReviewInputFile, ReviewResult } from "../lib/review/schema";

type RunBatchReviewArgs = {
  jobId?: string;
  contractId?: string;
  description: string;
  sourceFiles: ReviewInputFile[];
  previewFiles: ReviewInputFile[];
};

const requireFromTest = createRequire(__filename);
const reviewServicePath = requireFromTest.resolve("@/lib/review/service");
const mockReviewCalls: RunBatchReviewArgs[] = [];

require.cache[reviewServicePath] = {
  id: reviewServicePath,
  filename: reviewServicePath,
  loaded: true,
  exports: {
    runBatchReview: async (args: RunBatchReviewArgs): Promise<ReviewResult> => {
      mockReviewCalls.push(args);

      return {
        schema_version: "1.0",
        review_timestamp: "2026-05-08T00:00:00.000Z",
        request_context: {
          description_summary: "Mock review route summary.",
          input_completeness: "COMPLETE",
        },
        verdicts: {
          preview_vs_source: {
            verdict: "MATCH",
            reason: "Mocked",
            evidence: [],
          },
          preview_vs_description: {
            verdict: "MATCH",
            reason: "Mocked",
            evidence: [],
          },
          source_vs_description: {
            verdict: "MATCH",
            reason: "Mocked",
            evidence: [],
          },
        },
        reviewed_files: [],
        comparison_notes: {
          key_gaps: [],
          ambiguities: [],
          confidence: "HIGH",
        },
        user_visible: {
          summary: "Mock route review passed.",
          what_user_will_see: [],
        },
      };
    },
  },
} as NodeJS.Module;

const reviewRoute = requireFromTest("../app/api/review/route") as typeof import("../app/api/review/route");

describe("review API route", () => {
  beforeEach(() => {
    resetDummyStoreForTests();
    mockReviewCalls.length = 0;
  });

  test("loads authoritative job and contract details before review", async () => {
    const formData = new FormData();
    formData.set("jobId", "job_456");
    formData.set("contractId", "contract_job_456");
    formData.append("sources", new File(["source"], "source.txt", { type: "text/plain" }));
    formData.append(
      "previews",
      new File(["preview"], "preview.txt", { type: "text/plain" }),
    );

    const response = await reviewRoute.POST(
      new Request("http://test.local/api/review", {
        method: "POST",
        body: formData,
      }),
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.user_visible.summary, "Mock route review passed.");
    assert.equal(mockReviewCalls.length, 1);
    assert.equal(mockReviewCalls[0].jobId, "job_456");
    assert.equal(mockReviewCalls[0].contractId, "contract_job_456");
    assert.match(mockReviewCalls[0].description, /Build a landing page/);
    assert.match(mockReviewCalls[0].description, /Create a responsive landing page/);
    assert.equal(mockReviewCalls[0].sourceFiles.length, 1);
    assert.equal(mockReviewCalls[0].previewFiles.length, 1);
  });

  test("rejects missing review identifiers", async () => {
    const response = await reviewRoute.POST(
      new Request("http://test.local/api/review", {
        method: "POST",
        body: new FormData(),
      }),
    );

    assert.equal(response.status, 400);
    assert.equal(mockReviewCalls.length, 0);
    assert.deepEqual(await response.json(), {
      error: "The review request must include a job ID and contract ID.",
    });
  });

  test("rejects unknown jobs and mismatched contracts", async () => {
    const unknown = new FormData();
    unknown.set("jobId", "missing");
    unknown.set("contractId", "contract_missing");

    const unknownResponse = await reviewRoute.POST(
      new Request("http://test.local/api/review", {
        method: "POST",
        body: unknown,
      }),
    );

    assert.equal(unknownResponse.status, 404);
    assert.deepEqual(await unknownResponse.json(), { error: "Job not found." });

    const mismatch = new FormData();
    mismatch.set("jobId", "job_456");
    mismatch.set("contractId", "contract_job_789");

    const mismatchResponse = await reviewRoute.POST(
      new Request("http://test.local/api/review", {
        method: "POST",
        body: mismatch,
      }),
    );

    assert.equal(mismatchResponse.status, 403);
    assert.deepEqual(await mismatchResponse.json(), {
      error: "The contract ID does not match the requested job.",
    });
    assert.equal(mockReviewCalls.length, 0);
  });
});
