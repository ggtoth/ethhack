"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_module_1 = require("node:module");
const node_test_1 = require("node:test");
const dummy_endpoints_1 = require("@/lib/workflow/dummy-endpoints");
const requireFromTest = (0, node_module_1.createRequire)(__filename);
const reviewServicePath = requireFromTest.resolve("@/lib/review/service");
const mockReviewCalls = [];
require.cache[reviewServicePath] = {
    id: reviewServicePath,
    filename: reviewServicePath,
    loaded: true,
    exports: {
        runBatchReview: async (args) => {
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
};
const reviewRoute = requireFromTest("../app/api/review/route");
(0, node_test_1.describe)("review API route", () => {
    (0, node_test_1.beforeEach)(() => {
        (0, dummy_endpoints_1.resetDummyStoreForTests)();
        mockReviewCalls.length = 0;
    });
    (0, node_test_1.test)("loads authoritative job and contract details before review", async () => {
        (0, dummy_endpoints_1.submitDummyJob)("job_456", {
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
        const formData = new FormData();
        formData.set("jobId", "job_456");
        formData.set("contractId", "contract_job_456");
        formData.append("sources", new File(["source"], "source.txt", { type: "text/plain" }));
        formData.append("previews", new File(["preview"], "preview.txt", { type: "text/plain" }));
        const response = await reviewRoute.POST(new Request("http://test.local/api/review", {
            method: "POST",
            body: formData,
        }));
        const payload = await response.json();
        strict_1.default.equal(response.status, 200);
        strict_1.default.equal(payload.user_visible.summary, "Mock route review passed.");
        strict_1.default.equal(mockReviewCalls.length, 1);
        strict_1.default.equal(mockReviewCalls[0].jobId, "job_456");
        strict_1.default.equal(mockReviewCalls[0].contractId, "contract_job_456");
        strict_1.default.equal(mockReviewCalls[0].submissionNotes, "Responsive page completed.");
        strict_1.default.match(mockReviewCalls[0].description, /Job ID: job_456/);
        strict_1.default.match(mockReviewCalls[0].description, /Contract ID: contract_job_456/);
        strict_1.default.match(mockReviewCalls[0].description, /Current escrow state: release_requested/);
        strict_1.default.match(mockReviewCalls[0].description, /Submitted source files: archive.zip/);
        strict_1.default.match(mockReviewCalls[0].description, /Preview file: landing/);
        strict_1.default.match(mockReviewCalls[0].description, /Final file: archive.zip/);
        strict_1.default.match(mockReviewCalls[0].description, /Submission notes: Responsive page completed./);
        strict_1.default.match(mockReviewCalls[0].description, /Dispute reason: None/);
        strict_1.default.equal(mockReviewCalls[0].sourceFiles.length, 1);
        strict_1.default.equal(mockReviewCalls[0].previewFiles.length, 1);
    });
    (0, node_test_1.test)("rejects missing review identifiers", async () => {
        const response = await reviewRoute.POST(new Request("http://test.local/api/review", {
            method: "POST",
            body: new FormData(),
        }));
        strict_1.default.equal(response.status, 400);
        strict_1.default.equal(mockReviewCalls.length, 0);
        strict_1.default.deepEqual(await response.json(), {
            error: "The review request must include a job ID and contract ID.",
        });
    });
    (0, node_test_1.test)("rejects unknown jobs and mismatched contracts", async () => {
        const unknown = new FormData();
        unknown.set("jobId", "missing");
        unknown.set("contractId", "contract_missing");
        const unknownResponse = await reviewRoute.POST(new Request("http://test.local/api/review", {
            method: "POST",
            body: unknown,
        }));
        strict_1.default.equal(unknownResponse.status, 404);
        strict_1.default.deepEqual(await unknownResponse.json(), { error: "Job not found." });
        const mismatch = new FormData();
        mismatch.set("jobId", "job_456");
        mismatch.set("contractId", "contract_job_789");
        const mismatchResponse = await reviewRoute.POST(new Request("http://test.local/api/review", {
            method: "POST",
            body: mismatch,
        }));
        strict_1.default.equal(mismatchResponse.status, 403);
        strict_1.default.deepEqual(await mismatchResponse.json(), {
            error: "The contract ID does not match the requested job.",
        });
        strict_1.default.equal(mockReviewCalls.length, 0);
    });
});
