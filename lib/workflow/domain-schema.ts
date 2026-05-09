import { z } from "zod";

export const DomainIdSchema = z.string().trim().min(1);
export const IsoDateTimeSchema = z.string().datetime();
export const WalletAddressSchema = z.string().trim().min(1);
export const TransactionHashSchema = z.string().trim().min(1);

export const JobStatusSchema = z.enum([
  "open",
  "in_progress",
  "submitted",
  "ai_reviewed",
  "completed",
  "revision_requested",
  "disputed",
  "cancelled",
]);

export const EscrowContractStatusSchema = z.enum([
  "pending",
  "funded",
  "locked",
  "release_requested",
  "released",
  "refunded",
  "disputed",
  "cancelled",
]);

export const EscrowContractActionSchema = z.enum([
  "fund",
  "lock",
  "request_release",
  "release",
  "refund",
  "dispute",
  "cancel",
]);

export const OnChainEscrowActionSchema = z.enum([
  "lock",
  "request_release",
  "release",
  "refund",
  "dispute",
  "cancel",
]);

export const StoredFileSchema = z.object({
  id: DomainIdSchema,
  url: z.string().trim().min(1),
  filename: z.string().trim().min(1),
  storageKind: z
    .enum(["generic_url", "swarm_immutable", "swarm_feed"])
    .optional(),
  verification: z
    .object({
      status: z.enum(["verified", "failed"]),
      kind: z.enum(["immutable", "feed_payload", "feed_reference"]),
      requestedUrl: z.string().trim().min(1),
      gatewayUrl: z.string().trim().min(1),
      resolvedReference: z.string().trim().min(1).nullable(),
      verifiedAt: IsoDateTimeSchema,
      feed: z
        .object({
          owner: z.string().trim().min(1),
          topic: z.string().trim().min(1),
          index: z.string().trim().min(1).nullable(),
        })
        .nullable(),
      details: z.object({
        rootChunkReference: z.string().trim().min(1).optional(),
        manifestPath: z.string().trim().min(1).nullable().optional(),
        chunkCount: z.number().int().nonnegative().nullable().optional(),
        notes: z.array(z.string()).optional(),
      }),
      error: z
        .object({
          code: z.string().trim().min(1),
          message: z.string().trim().min(1),
        })
        .nullable(),
    })
    .nullable()
    .optional(),
});

export const AiReviewSchema = z.object({
  id: DomainIdSchema,
  verdict: z.enum(["pass", "needs_revision", "fail"]),
  score: z.number().min(0).max(1),
  summary: z.string().trim().min(1),
  issues: z.array(z.string()),
});

export const JobSchema = z.object({
  id: DomainIdSchema,
  contractId: DomainIdSchema,
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  budget: z.number().nonnegative(),
  deadline: z.string().trim().min(1),
  requirements: z.string().trim().min(1),
  status: JobStatusSchema,
  createdBy: DomainIdSchema,
  assignedTo: DomainIdSchema.nullable(),
  sourceFiles: z.array(StoredFileSchema),
  submittedSourceFiles: z.array(StoredFileSchema).default([]),
  previewFile: StoredFileSchema.nullable(),
  finalFile: StoredFileSchema.nullable(),
  submissionNotes: z.string().trim().min(1).nullable(),
  aiReview: AiReviewSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const EscrowContractSchema = z.object({
  id: DomainIdSchema,
  jobId: DomainIdSchema,
  clientId: DomainIdSchema,
  freelancerId: DomainIdSchema.nullable(),
  clientWalletAddress: WalletAddressSchema.nullable().default(null),
  freelancerWalletAddress: WalletAddressSchema.nullable().default(null),
  amount: z.number().nonnegative(),
  bidAmount: z.number().nonnegative().default(0),
  currency: z.string().trim().min(1),
  status: EscrowContractStatusSchema,
  fundedAt: IsoDateTimeSchema.nullable(),
  lockedAt: IsoDateTimeSchema.nullable().default(null),
  releaseRequestedAt: IsoDateTimeSchema.nullable().default(null),
  releasedAt: IsoDateTimeSchema.nullable(),
  disputedAt: IsoDateTimeSchema.nullable().default(null),
  cancelledAt: IsoDateTimeSchema.nullable(),
  transactionHash: TransactionHashSchema.nullable(),
  chainId: z.number().int().positive().nullable().default(null),
  escrowAddress: WalletAddressSchema.nullable().default(null),
  fundingTransactionHash: TransactionHashSchema.nullable().default(null),
  lockTransactionHash: TransactionHashSchema.nullable().default(null),
  releaseRequestTransactionHash: TransactionHashSchema.nullable().default(null),
  releaseTransactionHash: TransactionHashSchema.nullable().default(null),
  refundTransactionHash: TransactionHashSchema.nullable().default(null),
  disputeTransactionHash: TransactionHashSchema.nullable().default(null),
  cancelTransactionHash: TransactionHashSchema.nullable().default(null),
  disputeReason: z.string().trim().min(1).nullable().default(null),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const CreateJobInputSchema = z.object({
  id: DomainIdSchema.optional(),
  contractId: DomainIdSchema.optional(),
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  budget: z.number().nonnegative().optional(),
  deadline: z.string().trim().min(1).optional(),
  requirements: z.string().trim().min(1).optional(),
  status: JobStatusSchema.optional(),
  createdBy: DomainIdSchema.optional(),
  assignedTo: DomainIdSchema.nullable().optional(),
  sourceFiles: z.array(StoredFileSchema).optional(),
  submittedSourceFiles: z.array(StoredFileSchema).optional(),
  previewFile: StoredFileSchema.nullable().optional(),
  finalFile: StoredFileSchema.nullable().optional(),
  submissionNotes: z.string().trim().min(1).nullable().optional(),
  aiReview: AiReviewSchema.nullable().optional(),
  escrow: z
    .object({
      amount: z.number().nonnegative().optional(),
      bidAmount: z.number().nonnegative().optional(),
      currency: z.string().trim().min(1).optional(),
      status: EscrowContractStatusSchema.optional(),
      fundedAt: IsoDateTimeSchema.nullable().optional(),
      lockedAt: IsoDateTimeSchema.nullable().optional(),
      releaseRequestedAt: IsoDateTimeSchema.nullable().optional(),
      releasedAt: IsoDateTimeSchema.nullable().optional(),
      disputedAt: IsoDateTimeSchema.nullable().optional(),
      cancelledAt: IsoDateTimeSchema.nullable().optional(),
      transactionHash: TransactionHashSchema.nullable().optional(),
      chainId: z.number().int().positive().nullable().optional(),
      escrowAddress: WalletAddressSchema.nullable().optional(),
      fundingTransactionHash: TransactionHashSchema.nullable().optional(),
      lockTransactionHash: TransactionHashSchema.nullable().optional(),
      releaseRequestTransactionHash: TransactionHashSchema.nullable().optional(),
      releaseTransactionHash: TransactionHashSchema.nullable().optional(),
      refundTransactionHash: TransactionHashSchema.nullable().optional(),
      disputeTransactionHash: TransactionHashSchema.nullable().optional(),
      cancelTransactionHash: TransactionHashSchema.nullable().optional(),
      disputeReason: z.string().trim().min(1).nullable().optional(),
      clientWalletAddress: WalletAddressSchema.nullable().optional(),
      freelancerWalletAddress: WalletAddressSchema.nullable().optional(),
    })
    .optional(),
});

export const UpdateJobInputSchema = JobSchema.partial().omit({
  id: true,
  contractId: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateEscrowContractInputSchema = EscrowContractSchema.pick({
  bidAmount: true,
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

export const EscrowContractActionInputSchema = z.object({
  action: EscrowContractActionSchema,
  transactionHash: TransactionHashSchema.optional(),
  freelancerId: DomainIdSchema.optional(),
  clientWalletAddress: WalletAddressSchema.optional(),
  freelancerWalletAddress: WalletAddressSchema.optional(),
  bidAmount: z.number().nonnegative().optional(),
  disputeReason: z.string().trim().min(1).optional(),
});

export const PrepareOnChainEscrowActionInputSchema = z.object({
  action: OnChainEscrowActionSchema,
  freelancerId: DomainIdSchema.optional(),
  freelancerWalletAddress: WalletAddressSchema.optional(),
  bidAmountEth: z.string().trim().min(1).optional(),
  disputeReason: z.string().trim().min(1).optional(),
});

export const ConfirmOnChainEscrowActionInputSchema = z.object({
  action: OnChainEscrowActionSchema,
  transactionHash: TransactionHashSchema,
  clientWalletAddress: WalletAddressSchema.optional(),
  freelancerId: DomainIdSchema.optional(),
  freelancerWalletAddress: WalletAddressSchema.optional(),
  bidAmountEth: z.string().trim().min(1).optional(),
  disputeReason: z.string().trim().min(1).optional(),
});

export const PrepareOnChainEscrowFundingInputSchema = z.object({
  jobId: DomainIdSchema.optional(),
  contractId: DomainIdSchema.optional(),
  amountEth: z.string().trim().min(1),
});

export const ConfirmOnChainEscrowFundingInputSchema = CreateJobInputSchema.extend({
  id: DomainIdSchema,
  contractId: DomainIdSchema,
  transactionHash: TransactionHashSchema,
  amountEth: z.string().trim().min(1).optional(),
  clientWalletAddress: WalletAddressSchema.optional(),
  escrowAddress: WalletAddressSchema.nullable().optional(),
  chainId: z.number().int().positive().nullable().optional(),
});

export type JobStatus = z.infer<typeof JobStatusSchema>;
export type EscrowContractStatus = z.infer<typeof EscrowContractStatusSchema>;
export type EscrowContractAction = z.infer<typeof EscrowContractActionSchema>;
export type OnChainEscrowAction = z.infer<typeof OnChainEscrowActionSchema>;
export type StoredFile = z.infer<typeof StoredFileSchema>;
export type AiReview = z.infer<typeof AiReviewSchema>;
export type Job = z.infer<typeof JobSchema>;
export type EscrowContract = z.infer<typeof EscrowContractSchema>;
export type CreateJobInput = z.infer<typeof CreateJobInputSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobInputSchema>;
export type UpdateEscrowContractInput = z.infer<
  typeof UpdateEscrowContractInputSchema
>;
export type EscrowContractActionInput = z.infer<
  typeof EscrowContractActionInputSchema
>;
export type PrepareOnChainEscrowActionInput = z.infer<
  typeof PrepareOnChainEscrowActionInputSchema
>;
export type ConfirmOnChainEscrowActionInput = z.infer<
  typeof ConfirmOnChainEscrowActionInputSchema
>;
export type PrepareOnChainEscrowFundingInput = z.infer<
  typeof PrepareOnChainEscrowFundingInputSchema
>;
export type ConfirmOnChainEscrowFundingInput = z.infer<
  typeof ConfirmOnChainEscrowFundingInputSchema
>;
