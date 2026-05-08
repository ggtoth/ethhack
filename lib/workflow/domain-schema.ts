import { z } from "zod";

export const DomainIdSchema = z.string().trim().min(1);
export const IsoDateTimeSchema = z.string().datetime();

export const JobStatusSchema = z.enum([
  "open",
  "in_progress",
  "submitted",
  "ai_reviewed",
  "completed",
  "revision_requested",
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

export const StoredFileSchema = z.object({
  id: DomainIdSchema,
  url: z.string().trim().min(1),
  filename: z.string().trim().min(1),
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
  previewFile: StoredFileSchema.nullable(),
  finalFile: StoredFileSchema.nullable(),
  aiReview: AiReviewSchema.nullable(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

export const EscrowContractSchema = z.object({
  id: DomainIdSchema,
  jobId: DomainIdSchema,
  clientId: DomainIdSchema,
  freelancerId: DomainIdSchema.nullable(),
  amount: z.number().nonnegative(),
  currency: z.string().trim().min(1),
  status: EscrowContractStatusSchema,
  fundedAt: IsoDateTimeSchema.nullable(),
  releasedAt: IsoDateTimeSchema.nullable(),
  cancelledAt: IsoDateTimeSchema.nullable(),
  transactionHash: z.string().trim().min(1).nullable(),
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
  previewFile: StoredFileSchema.nullable().optional(),
  finalFile: StoredFileSchema.nullable().optional(),
  aiReview: AiReviewSchema.nullable().optional(),
  escrow: z
    .object({
      amount: z.number().nonnegative().optional(),
      currency: z.string().trim().min(1).optional(),
      status: EscrowContractStatusSchema.optional(),
      fundedAt: IsoDateTimeSchema.nullable().optional(),
      releasedAt: IsoDateTimeSchema.nullable().optional(),
      cancelledAt: IsoDateTimeSchema.nullable().optional(),
      transactionHash: z.string().trim().min(1).nullable().optional(),
    })
    .optional(),
});

export const UpdateJobInputSchema = JobSchema.partial().omit({
  id: true,
  contractId: true,
  createdAt: true,
  updatedAt: true,
});

export type JobStatus = z.infer<typeof JobStatusSchema>;
export type EscrowContractStatus = z.infer<typeof EscrowContractStatusSchema>;
export type StoredFile = z.infer<typeof StoredFileSchema>;
export type AiReview = z.infer<typeof AiReviewSchema>;
export type Job = z.infer<typeof JobSchema>;
export type EscrowContract = z.infer<typeof EscrowContractSchema>;
export type CreateJobInput = z.infer<typeof CreateJobInputSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobInputSchema>;
