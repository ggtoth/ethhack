"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModelResultSchema = exports.ReviewResultSchema = exports.ReviewedFileSchema = exports.VerdictSchema = exports.ReviewedFileRoleSchema = exports.ReviewConfidenceSchema = exports.InputCompletenessSchema = exports.VerdictEnumSchema = void 0;
const zod_1 = require("zod");
exports.VerdictEnumSchema = zod_1.z.enum([
    "MATCH",
    "PARTIAL_MATCH",
    "MISMATCH",
    "INSUFFICIENT_EVIDENCE",
]);
exports.InputCompletenessSchema = zod_1.z.enum([
    "COMPLETE",
    "PARTIAL",
    "INSUFFICIENT",
]);
exports.ReviewConfidenceSchema = zod_1.z.enum(["HIGH", "MEDIUM", "LOW"]);
exports.ReviewedFileRoleSchema = zod_1.z.enum(["preview", "source", "other"]);
exports.VerdictSchema = zod_1.z.object({
    verdict: exports.VerdictEnumSchema,
    reason: zod_1.z.string(),
    evidence: zod_1.z.array(zod_1.z.string()),
});
exports.ReviewedFileSchema = zod_1.z.object({
    file_id: zod_1.z.string().nullable(),
    file_name: zod_1.z.string(),
    file_path: zod_1.z.string().nullable(),
    role: exports.ReviewedFileRoleSchema,
    hash: zod_1.z.object({
        algorithm: zod_1.z.string().nullable(),
        value: zod_1.z.string().nullable(),
        provided: zod_1.z.boolean(),
    }),
    timestamps: zod_1.z.object({
        created_at: zod_1.z.string().nullable(),
        updated_at: zod_1.z.string().nullable(),
        reviewed_at: zod_1.z.string(),
    }),
    notes: zod_1.z.array(zod_1.z.string()),
});
exports.ReviewResultSchema = zod_1.z.object({
    schema_version: zod_1.z.literal("1.0"),
    review_timestamp: zod_1.z.string(),
    request_context: zod_1.z.object({
        description_summary: zod_1.z.string(),
        input_completeness: exports.InputCompletenessSchema,
    }),
    verdicts: zod_1.z.object({
        preview_vs_source: exports.VerdictSchema,
        preview_vs_description: exports.VerdictSchema,
        source_vs_description: exports.VerdictSchema,
    }),
    reviewed_files: zod_1.z.array(exports.ReviewedFileSchema),
    comparison_notes: zod_1.z.object({
        key_gaps: zod_1.z.array(zod_1.z.string()),
        ambiguities: zod_1.z.array(zod_1.z.string()),
        confidence: exports.ReviewConfidenceSchema,
    }),
    user_visible: zod_1.z.object({
        summary: zod_1.z.string(),
        what_user_will_see: zod_1.z.array(zod_1.z.string()),
    }),
});
exports.ReviewModelResultSchema = exports.ReviewResultSchema;
