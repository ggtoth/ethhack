import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { beforeEach, describe, test } from "node:test";

type MockOpenAiState = {
  createdFiles: string[];
  parseCalls: Array<{ input: unknown }>;
};

const requireFromTest = createRequire(__filename);
const openAiModulePath = requireFromTest.resolve("@/lib/openai");
const mockState: MockOpenAiState = {
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
        parse: async (request: { input: unknown }) => {
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
} as NodeJS.Module;

const { runBatchReview } = requireFromTest("@/lib/review/service") as typeof import("../lib/review/service");

describe("review service", () => {
  beforeEach(() => {
    mockState.createdFiles = [];
    mockState.parseCalls = [];
  });

  test("returns an insufficient review without calling OpenAI when source files are missing", async () => {
    const result = await runBatchReview({
      jobId: "job_456",
      contractId: "contract_job_456",
      description: "Review this delivery.",
      sourceFiles: [],
      previewFiles: [reviewFile("preview.png", "preview")],
    });

    assert.equal(result.request_context.input_completeness, "INSUFFICIENT");
    assert.equal(result.verdicts.source_vs_description.verdict, "INSUFFICIENT_EVIDENCE");
    assert.equal(result.reviewed_files.length, 1);
    assert.deepEqual(mockState.createdFiles, []);
    assert.deepEqual(mockState.parseCalls, []);
  });

  test("uploads files and parses a mocked structured OpenAI response", async () => {
    const result = await runBatchReview({
      jobId: "job_456",
      contractId: "contract_job_456",
      description: "Create a responsive landing page with a hero and contact form.",
      sourceFiles: [reviewFile("source.txt", "source")],
      previewFiles: [reviewFile("preview.txt", "preview")],
    });

    assert.deepEqual(mockState.createdFiles, ["file_mock_1", "file_mock_2"]);
    assert.equal(mockState.parseCalls.length, 1);
    assert.equal(result.request_context.input_completeness, "COMPLETE");
    assert.equal(result.verdicts.preview_vs_source.verdict, "MATCH");
    assert.equal(result.comparison_notes.confidence, "HIGH");
    assert.equal(result.user_visible.summary, "Mock review passed.");
    assert.deepEqual(
      result.reviewed_files.map((file) => file.file_id),
      ["file_mock_1", "file_mock_2"],
    );
  });

  test("marks preview verdicts insufficient when only source files are supplied", async () => {
    const result = await runBatchReview({
      jobId: "job_456",
      contractId: "contract_job_456",
      description: "Create a responsive landing page with a hero and contact form.",
      sourceFiles: [reviewFile("source.txt", "source")],
      previewFiles: [],
    });

    assert.deepEqual(mockState.createdFiles, ["file_mock_1"]);
    assert.equal(result.request_context.input_completeness, "PARTIAL");
    assert.equal(result.verdicts.preview_vs_source.verdict, "INSUFFICIENT_EVIDENCE");
    assert.equal(result.verdicts.preview_vs_description.verdict, "INSUFFICIENT_EVIDENCE");
    assert.equal(result.verdicts.source_vs_description.verdict, "MATCH");
  });
});

function reviewFile(name: string, role: "source" | "preview") {
  return {
    file: new File([`contents for ${name}`], name, { type: "text/plain" }),
    role,
    clientId: `${role}_1`,
  };
}
