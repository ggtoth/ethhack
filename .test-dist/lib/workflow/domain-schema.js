"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateJobInputSchema = exports.CreateJobInputSchema = exports.EscrowContractSchema = exports.JobSchema = exports.AiReviewSchema = exports.StoredFileSchema = exports.EscrowContractStatusSchema = exports.JobStatusSchema = exports.IsoDateTimeSchema = exports.DomainIdSchema = void 0;
const zod_1 = require("zod");
exports.DomainIdSchema = zod_1.z.string().trim().min(1);
exports.IsoDateTimeSchema = zod_1.z.string().datetime();
exports.JobStatusSchema = zod_1.z.enum([
    "open",
    "in_progress",
    "submitted",
    "ai_reviewed",
    "completed",
    "revision_requested",
    "cancelled",
]);
exports.EscrowContractStatusSchema = zod_1.z.enum([
    "pending",
    "funded",
    "locked",
    "release_requested",
    "released",
    "refunded",
    "disputed",
    "cancelled",
]);
exports.StoredFileSchema = zod_1.z.object({
    id: exports.DomainIdSchema,
    url: zod_1.z.string().trim().min(1),
    filename: zod_1.z.string().trim().min(1),
});
exports.AiReviewSchema = zod_1.z.object({
    id: exports.DomainIdSchema,
    verdict: zod_1.z.enum(["pass", "needs_revision", "fail"]),
    score: zod_1.z.number().min(0).max(1),
    summary: zod_1.z.string().trim().min(1),
    issues: zod_1.z.array(zod_1.z.string()),
});
exports.JobSchema = zod_1.z.object({
    id: exports.DomainIdSchema,
    contractId: exports.DomainIdSchema,
    title: zod_1.z.string().trim().min(1),
    description: zod_1.z.string().trim().min(1),
    budget: zod_1.z.number().nonnegative(),
    deadline: zod_1.z.string().trim().min(1),
    requirements: zod_1.z.string().trim().min(1),
    status: exports.JobStatusSchema,
    createdBy: exports.DomainIdSchema,
    assignedTo: exports.DomainIdSchema.nullable(),
    sourceFiles: zod_1.z.array(exports.StoredFileSchema),
    previewFile: exports.StoredFileSchema.nullable(),
    finalFile: exports.StoredFileSchema.nullable(),
    aiReview: exports.AiReviewSchema.nullable(),
    createdAt: exports.IsoDateTimeSchema,
    updatedAt: exports.IsoDateTimeSchema,
});
exports.EscrowContractSchema = zod_1.z.object({
    id: exports.DomainIdSchema,
    jobId: exports.DomainIdSchema,
    clientId: exports.DomainIdSchema,
    freelancerId: exports.DomainIdSchema.nullable(),
    amount: zod_1.z.number().nonnegative(),
    currency: zod_1.z.string().trim().min(1),
    status: exports.EscrowContractStatusSchema,
    fundedAt: exports.IsoDateTimeSchema.nullable(),
    releasedAt: exports.IsoDateTimeSchema.nullable(),
    cancelledAt: exports.IsoDateTimeSchema.nullable(),
    transactionHash: zod_1.z.string().trim().min(1).nullable(),
    createdAt: exports.IsoDateTimeSchema,
    updatedAt: exports.IsoDateTimeSchema,
});
exports.CreateJobInputSchema = zod_1.z.object({
    id: exports.DomainIdSchema.optional(),
    contractId: exports.DomainIdSchema.optional(),
    title: zod_1.z.string().trim().min(1).optional(),
    description: zod_1.z.string().trim().min(1).optional(),
    budget: zod_1.z.number().nonnegative().optional(),
    deadline: zod_1.z.string().trim().min(1).optional(),
    requirements: zod_1.z.string().trim().min(1).optional(),
    status: exports.JobStatusSchema.optional(),
    createdBy: exports.DomainIdSchema.optional(),
    assignedTo: exports.DomainIdSchema.nullable().optional(),
    sourceFiles: zod_1.z.array(exports.StoredFileSchema).optional(),
    previewFile: exports.StoredFileSchema.nullable().optional(),
    finalFile: exports.StoredFileSchema.nullable().optional(),
    aiReview: exports.AiReviewSchema.nullable().optional(),
    escrow: zod_1.z
        .object({
        amount: zod_1.z.number().nonnegative().optional(),
        currency: zod_1.z.string().trim().min(1).optional(),
        status: exports.EscrowContractStatusSchema.optional(),
        fundedAt: exports.IsoDateTimeSchema.nullable().optional(),
        releasedAt: exports.IsoDateTimeSchema.nullable().optional(),
        cancelledAt: exports.IsoDateTimeSchema.nullable().optional(),
        transactionHash: zod_1.z.string().trim().min(1).nullable().optional(),
    })
        .optional(),
});
exports.UpdateJobInputSchema = exports.JobSchema.partial().omit({
    id: true,
    contractId: true,
    createdAt: true,
    updatedAt: true,
});
