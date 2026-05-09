import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { createRequire } from "node:module";

import { NULL_STAMP } from "@ethersphere/bee-js";

import { resetDummyStoreForTests } from "@/lib/workflow/dummy-endpoints";
import { computeSwarmFileReference } from "../packages/swarm-verified-fetch/src/hash";

const requireFromTest = createRequire(__filename);
const reviewServicePath = requireFromTest.resolve("@/lib/review/service");
const originalFetch = globalThis.fetch;
const originalBeeFactory = (
  globalThis as typeof globalThis & {
    __smartjobsCreateBeeClient?: (url: string) => {
      uploadData: (
        postageBatchId: string | { toString(): string },
        data: Uint8Array,
        options?: Record<string, unknown>,
      ) => Promise<{ reference: { toHex(): string } }>;
    };
  }
).__smartjobsCreateBeeClient;
const originalEnv = {
  SWARM_BEE_API_URL: process.env.SWARM_BEE_API_URL,
  SWARM_POSTAGE_BATCH_ID: process.env.SWARM_POSTAGE_BATCH_ID,
  SWARM_GATEWAY_URL: process.env.SWARM_GATEWAY_URL,
  NEXT_PUBLIC_SWARM_GATEWAY_URL: process.env.NEXT_PUBLIC_SWARM_GATEWAY_URL,
  SWARM_UPLOAD_PIN: process.env.SWARM_UPLOAD_PIN,
  SWARM_UPLOAD_DEFERRED: process.env.SWARM_UPLOAD_DEFERRED,
};

const mockReviewCalls: Array<Record<string, unknown>> = [];

require.cache[reviewServicePath] = {
  id: reviewServicePath,
  filename: reviewServicePath,
  loaded: true,
  exports: {
    runBatchReview: async (args: Record<string, unknown>) => {
      mockReviewCalls.push(args);

      return {
        schema_version: "1.0",
        review_timestamp: "2026-05-09T00:00:00.000Z",
        request_context: {
          description_summary: "Swarm-backed review route summary.",
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
          summary: "Mock swarm review passed.",
          what_user_will_see: [],
        },
      };
    },
  },
} as NodeJS.Module;

const swarmUploadRoute = requireFromTest("../app/api/swarm/upload/route") as typeof import("../app/api/swarm/upload/route");
const swarmReviewRoute = requireFromTest("../app/api/review/swarm/route") as typeof import("../app/api/review/swarm/route");

describe("swarm backend routes", () => {
  beforeEach(() => {
    resetDummyStoreForTests();
    mockReviewCalls.length = 0;
    process.env.SWARM_BEE_API_URL = "http://bee.test";
    process.env.SWARM_POSTAGE_BATCH_ID =
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    process.env.SWARM_GATEWAY_URL = "http://gateway.test";
    process.env.NEXT_PUBLIC_SWARM_GATEWAY_URL = "http://gateway.test";
    process.env.SWARM_UPLOAD_PIN = "true";
    process.env.SWARM_UPLOAD_DEFERRED = "false";
    process.env.SWARM_ACT = "false";
    process.env.SWARM_ACT_HISTORY_ADDRESS = "";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    (
      globalThis as typeof globalThis & {
        __smartjobsCreateBeeClient?: typeof originalBeeFactory;
      }
    ).__smartjobsCreateBeeClient = originalBeeFactory;
    process.env.SWARM_BEE_API_URL = originalEnv.SWARM_BEE_API_URL;
    process.env.SWARM_POSTAGE_BATCH_ID = originalEnv.SWARM_POSTAGE_BATCH_ID;
    process.env.SWARM_GATEWAY_URL = originalEnv.SWARM_GATEWAY_URL;
    process.env.NEXT_PUBLIC_SWARM_GATEWAY_URL =
      originalEnv.NEXT_PUBLIC_SWARM_GATEWAY_URL;
    process.env.SWARM_UPLOAD_PIN = originalEnv.SWARM_UPLOAD_PIN;
    process.env.SWARM_UPLOAD_DEFERRED = originalEnv.SWARM_UPLOAD_DEFERRED;
    delete process.env.SWARM_ACT;
    delete process.env.SWARM_ACT_HISTORY_ADDRESS;
  });

  test("uploads files to swarm and verifies the gateway reference matches local computation", async () => {
    const file = new File(["swarm route upload"], "proof.txt", {
      type: "text/plain",
    });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { reference } = computeSwarmFileReference(bytes);

    (
      globalThis as typeof globalThis & {
        __smartjobsCreateBeeClient?: (url: string) => {
          uploadData: (
            postageBatchId: string | { toString(): string },
            data: Uint8Array,
            options?: Record<string, unknown>,
          ) => Promise<{ reference: { toHex(): string } }>;
        };
      }
    ).__smartjobsCreateBeeClient = (url: string) => {
      assert.equal(url, "http://bee.test");

      return {
        uploadData: async (postageBatchId, data, options) => {
          assert.equal(
            postageBatchId,
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          );
          assert.deepEqual(Array.from(data), Array.from(bytes));
          assert.equal(options?.pin, true);
          assert.equal(options?.deferred, false);

          return {
            reference: {
              toHex: () => reference,
            },
          };
        },
      };
    };

    const formData = new FormData();
    formData.append("files", file);
    formData.set(
      "descriptors",
      JSON.stringify([
        {
          clientId: "preview_1",
          role: "preview",
          expectedReference: reference,
        },
      ]),
    );

    const response = await swarmUploadRoute.POST(
      new Request("http://test.local/api/swarm/upload", {
        method: "POST",
        body: formData,
      }),
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.uploads.length, 1);
    assert.equal(payload.uploads[0].gatewayReference, reference);
    assert.equal(payload.uploads[0].referenceMatchesGateway, true);
    assert.equal(payload.uploads[0].referenceMatchesClient, true);
  });

  test("uses bee-js NULL_STAMP for the bzz.limo quickstart path", async () => {
    const file = new File(["bzz.limo upload"], "proof.txt", {
      type: "text/plain",
    });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { reference } = computeSwarmFileReference(bytes);

    process.env.SWARM_BEE_API_URL = "https://bzz.limo";
    process.env.SWARM_GATEWAY_URL = "https://bzz.limo";
    process.env.NEXT_PUBLIC_SWARM_GATEWAY_URL = "https://bzz.limo";
    process.env.SWARM_POSTAGE_BATCH_ID = "NULL_STAMP";

    (
      globalThis as typeof globalThis & {
        __smartjobsCreateBeeClient?: (url: string) => {
          uploadData: (
            postageBatchId: string | { toString(): string },
            data: Uint8Array,
            options?: Record<string, unknown>,
          ) => Promise<{ reference: { toHex(): string } }>;
        };
      }
    ).__smartjobsCreateBeeClient = (url: string) => {
      assert.equal(url, "https://bzz.limo");

      return {
        uploadData: async (postageBatchId, data) => {
          assert.equal(postageBatchId, NULL_STAMP);
          assert.deepEqual(Array.from(data), Array.from(bytes));

          return {
            reference: {
              toHex: () => reference,
            },
          };
        },
      };
    };

    const formData = new FormData();
    formData.append("files", file);

    const response = await swarmUploadRoute.POST(
      new Request("http://test.local/api/swarm/upload", {
        method: "POST",
        body: formData,
      }),
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.uploads[0].gatewayUrl, "https://bzz.limo");
    assert.equal(payload.uploads[0].gatewayReference, reference);
  });

  test("loads files from swarm references before invoking the AI review workflow", async () => {
    const previewBytes = new TextEncoder().encode("preview-bytes");
    const sourceBytes = new TextEncoder().encode("source-bytes");
    const previewRef = computeSwarmFileReference(previewBytes).reference;
    const sourceRef = computeSwarmFileReference(sourceBytes).reference;

    globalThis.fetch = async (input) => {
      const url = String(input);

      if (url.endsWith(`/bytes/${previewRef}`)) {
        return new Response(previewBytes, {
          status: 200,
          headers: {
            "content-type": "image/png",
          },
        });
      }

      if (url.endsWith(`/bytes/${sourceRef}`)) {
        return new Response(sourceBytes, {
          status: 200,
          headers: {
            "content-type": "text/plain",
          },
        });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    };

    const response = await swarmReviewRoute.POST(
      new Request("http://test.local/api/review/swarm", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          jobId: "job_456",
          contractId: "contract_job_456",
          previewFiles: [
            {
              clientId: "preview_1",
              reference: previewRef,
              fileName: "preview.png",
              contentType: "image/png",
            },
          ],
          sourceFiles: [
            {
              clientId: "source_1",
              reference: sourceRef,
              fileName: "source.txt",
              contentType: "text/plain",
            },
          ],
        }),
      }),
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.user_visible.summary, "Mock swarm review passed.");
    assert.equal(mockReviewCalls.length, 1);
    const sourceFiles = mockReviewCalls[0].sourceFiles as Array<{
      file: File;
      swarm?: { requestedReference: string; referenceMatchesRequest: boolean };
    }>;
    const previewFiles = mockReviewCalls[0].previewFiles as Array<{
      file: File;
      swarm?: { requestedReference: string; referenceMatchesRequest: boolean };
    }>;

    assert.equal(sourceFiles.length, 1);
    assert.equal(previewFiles.length, 1);
    assert.equal(sourceFiles[0].file.name, "source.txt");
    assert.equal(previewFiles[0].file.name, "preview.png");
    assert.equal(sourceFiles[0].swarm?.requestedReference, sourceRef);
    assert.equal(previewFiles[0].swarm?.referenceMatchesRequest, true);
  });
});
