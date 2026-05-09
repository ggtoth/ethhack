"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmOnChainEscrowFundingInputSchema = exports.PrepareOnChainEscrowFundingInputSchema = exports.ConfirmOnChainEscrowActionInputSchema = exports.PrepareOnChainEscrowActionInputSchema = exports.EscrowContractActionInputSchema = exports.UpdateEscrowContractInputSchema = exports.UpdateJobInputSchema = exports.CreateJobInputSchema = exports.EscrowContractSchema = exports.JobSchema = exports.AiReviewSchema = exports.StoredFileSchema = exports.OnChainEscrowActionSchema = exports.EscrowContractActionSchema = exports.EscrowContractStatusSchema = exports.JobStatusSchema = exports.TransactionHashSchema = exports.WalletAddressSchema = exports.IsoDateTimeSchema = exports.DomainIdSchema = void 0;
const zod_1 = require("zod");
exports.DomainIdSchema = zod_1.z.string().trim().min(1);
exports.IsoDateTimeSchema = zod_1.z.string().datetime();
exports.WalletAddressSchema = zod_1.z.string().trim().min(1);
exports.TransactionHashSchema = zod_1.z.string().trim().min(1);
exports.JobStatusSchema = zod_1.z.enum([
    "open",
    "in_progress",
    "submitted",
    "ai_reviewed",
    "completed",
    "revision_requested",
    "disputed",
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
exports.EscrowContractActionSchema = zod_1.z.enum([
    "fund",
    "lock",
    "request_release",
    "release",
    "refund",
    "dispute",
    "cancel",
]);
exports.OnChainEscrowActionSchema = zod_1.z.enum([
    "lock",
    "request_release",
    "release",
    "refund",
    "dispute",
    "cancel",
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
    submittedSourceFiles: zod_1.z.array(exports.StoredFileSchema).default([]),
    previewFile: exports.StoredFileSchema.nullable(),
    finalFile: exports.StoredFileSchema.nullable(),
    submissionNotes: zod_1.z.string().trim().min(1).nullable(),
    aiReview: exports.AiReviewSchema.nullable(),
    createdAt: exports.IsoDateTimeSchema,
    updatedAt: exports.IsoDateTimeSchema,
});
exports.EscrowContractSchema = zod_1.z.object({
    id: exports.DomainIdSchema,
    jobId: exports.DomainIdSchema,
    clientId: exports.DomainIdSchema,
    freelancerId: exports.DomainIdSchema.nullable(),
    clientWalletAddress: exports.WalletAddressSchema.nullable().default(null),
    freelancerWalletAddress: exports.WalletAddressSchema.nullable().default(null),
    amount: zod_1.z.number().nonnegative(),
    currency: zod_1.z.string().trim().min(1),
    status: exports.EscrowContractStatusSchema,
    fundedAt: exports.IsoDateTimeSchema.nullable(),
    lockedAt: exports.IsoDateTimeSchema.nullable().default(null),
    releaseRequestedAt: exports.IsoDateTimeSchema.nullable().default(null),
    releasedAt: exports.IsoDateTimeSchema.nullable(),
    disputedAt: exports.IsoDateTimeSchema.nullable().default(null),
    cancelledAt: exports.IsoDateTimeSchema.nullable(),
    transactionHash: exports.TransactionHashSchema.nullable(),
    chainId: zod_1.z.number().int().positive().nullable().default(null),
    escrowAddress: exports.WalletAddressSchema.nullable().default(null),
    fundingTransactionHash: exports.TransactionHashSchema.nullable().default(null),
    lockTransactionHash: exports.TransactionHashSchema.nullable().default(null),
    releaseRequestTransactionHash: exports.TransactionHashSchema.nullable().default(null),
    releaseTransactionHash: exports.TransactionHashSchema.nullable().default(null),
    refundTransactionHash: exports.TransactionHashSchema.nullable().default(null),
    disputeTransactionHash: exports.TransactionHashSchema.nullable().default(null),
    cancelTransactionHash: exports.TransactionHashSchema.nullable().default(null),
    disputeReason: zod_1.z.string().trim().min(1).nullable().default(null),
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
    submittedSourceFiles: zod_1.z.array(exports.StoredFileSchema).optional(),
    previewFile: exports.StoredFileSchema.nullable().optional(),
    finalFile: exports.StoredFileSchema.nullable().optional(),
    submissionNotes: zod_1.z.string().trim().min(1).nullable().optional(),
    aiReview: exports.AiReviewSchema.nullable().optional(),
    escrow: zod_1.z
        .object({
        amount: zod_1.z.number().nonnegative().optional(),
        currency: zod_1.z.string().trim().min(1).optional(),
        status: exports.EscrowContractStatusSchema.optional(),
        fundedAt: exports.IsoDateTimeSchema.nullable().optional(),
        lockedAt: exports.IsoDateTimeSchema.nullable().optional(),
        releaseRequestedAt: exports.IsoDateTimeSchema.nullable().optional(),
        releasedAt: exports.IsoDateTimeSchema.nullable().optional(),
        disputedAt: exports.IsoDateTimeSchema.nullable().optional(),
        cancelledAt: exports.IsoDateTimeSchema.nullable().optional(),
        transactionHash: exports.TransactionHashSchema.nullable().optional(),
        chainId: zod_1.z.number().int().positive().nullable().optional(),
        escrowAddress: exports.WalletAddressSchema.nullable().optional(),
        fundingTransactionHash: exports.TransactionHashSchema.nullable().optional(),
        lockTransactionHash: exports.TransactionHashSchema.nullable().optional(),
        releaseRequestTransactionHash: exports.TransactionHashSchema.nullable().optional(),
        releaseTransactionHash: exports.TransactionHashSchema.nullable().optional(),
        refundTransactionHash: exports.TransactionHashSchema.nullable().optional(),
        disputeTransactionHash: exports.TransactionHashSchema.nullable().optional(),
        cancelTransactionHash: exports.TransactionHashSchema.nullable().optional(),
        disputeReason: zod_1.z.string().trim().min(1).nullable().optional(),
        clientWalletAddress: exports.WalletAddressSchema.nullable().optional(),
        freelancerWalletAddress: exports.WalletAddressSchema.nullable().optional(),
    })
        .optional(),
});
exports.UpdateJobInputSchema = exports.JobSchema.partial().omit({
    id: true,
    contractId: true,
    createdAt: true,
    updatedAt: true,
});
exports.UpdateEscrowContractInputSchema = exports.EscrowContractSchema.pick({
    clientWalletAddress: true,
    freelancerWalletAddress: true,
    fundedAt: true,
    lockedAt: true,
    releaseRequestedAt: true,
    releasedAt: true,
    disputedAt: true,
    cancelledAt: true,
    transactionHash: true,
    chainId: true,
    escrowAddress: true,
    fundingTransactionHash: true,
    lockTransactionHash: true,
    releaseRequestTransactionHash: true,
    releaseTransactionHash: true,
    refundTransactionHash: true,
    disputeTransactionHash: true,
    cancelTransactionHash: true,
    disputeReason: true,
})
    .partial()
    .strict();
exports.EscrowContractActionInputSchema = zod_1.z.object({
    action: exports.EscrowContractActionSchema,
    transactionHash: exports.TransactionHashSchema.optional(),
    freelancerId: exports.DomainIdSchema.optional(),
    clientWalletAddress: exports.WalletAddressSchema.optional(),
    freelancerWalletAddress: exports.WalletAddressSchema.optional(),
    disputeReason: zod_1.z.string().trim().min(1).optional(),
});
exports.PrepareOnChainEscrowActionInputSchema = zod_1.z.object({
    action: exports.OnChainEscrowActionSchema,
    freelancerId: exports.DomainIdSchema.optional(),
    freelancerWalletAddress: exports.WalletAddressSchema.optional(),
    disputeReason: zod_1.z.string().trim().min(1).optional(),
});
exports.ConfirmOnChainEscrowActionInputSchema = zod_1.z.object({
    action: exports.OnChainEscrowActionSchema,
    transactionHash: exports.TransactionHashSchema,
    clientWalletAddress: exports.WalletAddressSchema.optional(),
    freelancerId: exports.DomainIdSchema.optional(),
    freelancerWalletAddress: exports.WalletAddressSchema.optional(),
    disputeReason: zod_1.z.string().trim().min(1).optional(),
});
exports.PrepareOnChainEscrowFundingInputSchema = zod_1.z.object({
    jobId: exports.DomainIdSchema.optional(),
    contractId: exports.DomainIdSchema.optional(),
    amountEth: zod_1.z.string().trim().min(1),
});
exports.ConfirmOnChainEscrowFundingInputSchema = exports.CreateJobInputSchema.extend({
    id: exports.DomainIdSchema,
    contractId: exports.DomainIdSchema,
    transactionHash: exports.TransactionHashSchema,
    amountEth: zod_1.z.string().trim().min(1).optional(),
    clientWalletAddress: exports.WalletAddressSchema.optional(),
    escrowAddress: exports.WalletAddressSchema.nullable().optional(),
    chainId: zod_1.z.number().int().positive().nullable().optional(),
});
