"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBatchReview = runBatchReview;
const zod_1 = require("openai/helpers/zod");
const openai_1 = require("@/lib/openai");
const image_metadata_1 = require("@/lib/review/image-metadata");
const prompt_1 = require("@/lib/review/prompt");
const schema_1 = require("@/lib/review/schema");
const SUPPORTED_IMAGE_INPUT_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
]);
async function runBatchReview({ jobId, contractId, description, submissionNotes, sourceFiles, previewFiles, }) {
    const reviewTimestamp = new Date().toISOString();
    const preparedSources = await Promise.all(sourceFiles.map((file) => (0, image_metadata_1.prepareReviewFile)(file, reviewTimestamp)));
    const preparedPreviews = await Promise.all(previewFiles.map((file) => (0, image_metadata_1.prepareReviewFile)(file, reviewTimestamp)));
    const reviewedFiles = [
        ...preparedSources.map((item) => item.reviewedFile),
        ...preparedPreviews.map((item) => item.reviewedFile),
    ];
    if (!description.trim() || preparedSources.length === 0) {
        return buildInsufficientReview({
            description,
            preparedSources,
            preparedPreviews,
            reviewTimestamp,
        });
    }
    await uploadFiles(preparedSources);
    await uploadFiles(preparedPreviews);
    const client = (0, openai_1.getOpenAIClient)();
    const response = await client.responses.parse({
        model: (0, openai_1.getReviewModel)(),
        input: [
            {
                role: "system",
                content: prompt_1.REVIEW_AGENT_INSTRUCTIONS,
            },
            {
                role: "user",
                content: [
                    {
                        type: "input_text",
                        text: (0, prompt_1.buildReviewPrompt)({
                            jobId,
                            contractId,
                            description,
                            submissionNotes,
                            sources: preparedSources,
                            previews: preparedPreviews,
                        }),
                    },
                    ...preparedSources.map(toResponseInput),
                    ...preparedPreviews.map(toResponseInput),
                ],
            },
        ],
        text: {
            format: (0, zod_1.zodTextFormat)(schema_1.ReviewModelResultSchema, "file_comparison_review"),
        },
    });
    const parsed = response.output_parsed;
    if (!parsed) {
        throw new Error("The review model returned no structured output.");
    }
    return schema_1.ReviewResultSchema.parse({
        ...parsed,
        review_timestamp: reviewTimestamp,
        request_context: {
            ...parsed.request_context,
            input_completeness: getInputCompleteness({
                description,
                hasPreview: preparedPreviews.length > 0,
                hasSource: preparedSources.length > 0,
            }),
        },
        verdicts: preparedPreviews.length > 0
            ? parsed.verdicts
            : {
                ...parsed.verdicts,
                preview_vs_source: missingPreviewVerdict(),
                preview_vs_description: missingPreviewVerdict(),
            },
        reviewed_files: reviewedFiles,
    });
}
async function uploadFiles(files) {
    const client = (0, openai_1.getOpenAIClient)();
    await Promise.all(files.map(async (file) => {
        const uploaded = await client.files.create({
            file: file.openaiFile,
            purpose: "user_data",
        });
        file.reviewedFile.file_id = uploaded.id;
    }));
}
function toResponseInput(file) {
    if (SUPPORTED_IMAGE_INPUT_TYPES.has(file.file.type)) {
        return {
            type: "input_image",
            file_id: file.reviewedFile.file_id,
            detail: "high",
        };
    }
    return {
        type: "input_file",
        file_id: file.reviewedFile.file_id,
        filename: file.reviewedFile.file_name,
    };
}
function buildInsufficientReview({ description, preparedSources, preparedPreviews, reviewTimestamp, }) {
    const missingInputs = [
        !description.trim() ? "a usable project description" : null,
        preparedSources.length === 0 ? "at least one source/work file" : null,
        preparedPreviews.length === 0 ? "preview files" : null,
    ].filter((value) => Boolean(value));
    const reason = `The request is missing ${missingInputs.join(", ")}.`;
    return schema_1.ReviewResultSchema.parse({
        schema_version: "1.0",
        review_timestamp: reviewTimestamp,
        request_context: {
            description_summary: description.trim()
                ? summarizeDescription(description)
                : "No usable description was supplied.",
            input_completeness: "INSUFFICIENT",
        },
        verdicts: {
            preview_vs_source: {
                verdict: "INSUFFICIENT_EVIDENCE",
                reason,
                evidence: [],
            },
            preview_vs_description: {
                verdict: "INSUFFICIENT_EVIDENCE",
                reason,
                evidence: [],
            },
            source_vs_description: {
                verdict: "INSUFFICIENT_EVIDENCE",
                reason,
                evidence: [],
            },
        },
        reviewed_files: [
            ...preparedSources.map((item) => item.reviewedFile),
            ...preparedPreviews.map((item) => item.reviewedFile),
        ],
        comparison_notes: {
            key_gaps: missingInputs,
            ambiguities: [],
            confidence: "LOW",
        },
        user_visible: {
            summary: "The AI review could not make a defensible judgment because required inputs were missing.",
            what_user_will_see: [
                "Add the project description and submitted work files, then run the review again.",
            ],
        },
    });
}
function getInputCompleteness({ description, hasPreview, hasSource, }) {
    if (!description.trim() || !hasSource) {
        return "INSUFFICIENT";
    }
    if (!hasPreview) {
        return "PARTIAL";
    }
    return "COMPLETE";
}
function missingPreviewVerdict() {
    return {
        verdict: "INSUFFICIENT_EVIDENCE",
        reason: "No preview file or preview output was supplied for this check.",
        evidence: [],
    };
}
function summarizeDescription(description) {
    const normalized = description.trim().replace(/\s+/g, " ");
    return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}
