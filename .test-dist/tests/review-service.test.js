"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_module_1 = require("node:module");
const node_test_1 = require("node:test");
const requireFromTest = (0, node_module_1.createRequire)(__filename);
const openAiModulePath = requireFromTest.resolve("@/lib/openai");
const mockState = {
    createdFiles: [],
    parseCalls: [],
};
require.cache[openAiModulePath] = {
    id: openAiModulePath,
    filename: openAiModulePath,
    loaded: true,
    exports: {
        getReviewModel: () => "mock-review-model",
        getOpenAIClient: () => ({
            files: {
                create: async () => {
                    const id = `file_mock_${mockState.createdFiles.length + 1}`;
                    mockState.createdFiles.push(id);
                    return { id };
                },
            },
            responses: {
                parse: async (request) => {
                    mockState.parseCalls.push({ input: request.input });
                    return {
                        output_parsed: {
                            schema_version: "1.0",
                            review_timestamp: "2026-05-08T00:00:00.000Z",
                            request_context: {
                                description_summary: "Mocked structured review.",
                                input_completeness: "COMPLETE",
                            },
                            verdicts: {
                                preview_vs_source: {
                                    verdict: "MATCH",
                                    reason: "The preview and source line up in the mock response.",
                                    evidence: ["Mock evidence"],
                                },
                                preview_vs_description: {
                                    verdict: "MATCH",
                                    reason: "The preview addresses the mock requirements.",
                                    evidence: [],
                                },
                                source_vs_description: {
                                    verdict: "MATCH",
                                    reason: "The source addresses the mock requirements.",
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
                                summary: "Mock review passed.",
                                what_user_will_see: ["The submitted package matches."],
                            },
                        },
                    };
                },
            },
        }),
    },
};
const { runBatchReview } = requireFromTest("@/lib/review/service");
(0, node_test_1.describe)("review service", () => {
    (0, node_test_1.beforeEach)(() => {
        mockState.createdFiles = [];
        mockState.parseCalls = [];
    });
    (0, node_test_1.test)("returns an insufficient review without calling OpenAI when source files are missing", async () => {
        const result = await runBatchReview({
            jobId: "job_456",
            contractId: "contract_job_456",
            description: "Review this delivery.",
            sourceFiles: [],
            previewFiles: [reviewFile("preview.png", "preview")],
        });
        strict_1.default.equal(result.request_context.input_completeness, "INSUFFICIENT");
        strict_1.default.equal(result.verdicts.source_vs_description.verdict, "INSUFFICIENT_EVIDENCE");
        strict_1.default.equal(result.reviewed_files.length, 1);
        strict_1.default.deepEqual(mockState.createdFiles, []);
        strict_1.default.deepEqual(mockState.parseCalls, []);
    });
    (0, node_test_1.test)("uploads files and parses a mocked structured OpenAI response", async () => {
        const result = await runBatchReview({
            jobId: "job_456",
            contractId: "contract_job_456",
            description: "Create a responsive landing page with a hero and contact form.",
            sourceFiles: [reviewFile("source.txt", "source")],
            previewFiles: [reviewFile("preview.txt", "preview")],
        });
        strict_1.default.deepEqual(mockState.createdFiles, ["file_mock_1", "file_mock_2"]);
        strict_1.default.equal(mockState.parseCalls.length, 1);
        strict_1.default.equal(result.request_context.input_completeness, "COMPLETE");
        strict_1.default.equal(result.verdicts.preview_vs_source.verdict, "MATCH");
        strict_1.default.equal(result.comparison_notes.confidence, "HIGH");
        strict_1.default.equal(result.user_visible.summary, "Mock review passed.");
        strict_1.default.deepEqual(result.reviewed_files.map((file) => file.file_id), ["file_mock_1", "file_mock_2"]);
    });
    (0, node_test_1.test)("marks preview verdicts insufficient when only source files are supplied", async () => {
        const result = await runBatchReview({
            jobId: "job_456",
            contractId: "contract_job_456",
            description: "Create a responsive landing page with a hero and contact form.",
            sourceFiles: [reviewFile("source.txt", "source")],
            previewFiles: [],
        });
        strict_1.default.deepEqual(mockState.createdFiles, ["file_mock_1"]);
        strict_1.default.equal(result.request_context.input_completeness, "PARTIAL");
        strict_1.default.equal(result.verdicts.preview_vs_source.verdict, "INSUFFICIENT_EVIDENCE");
        strict_1.default.equal(result.verdicts.preview_vs_description.verdict, "INSUFFICIENT_EVIDENCE");
        strict_1.default.equal(result.verdicts.source_vs_description.verdict, "MATCH");
    });
});
function reviewFile(name, role) {
    return {
        file: new File([`contents for ${name}`], name, { type: "text/plain" }),
        role,
        clientId: `${role}_1`,
    };
}
