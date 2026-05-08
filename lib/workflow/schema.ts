import { z } from "zod";

export const WorkflowIdSchema = z.string().min(1);

export const WorkflowActorSchema = z.object({
  id: WorkflowIdSchema,
  name: z.string().min(1),
  wallet_address: z.string().min(1).optional(),
});

export const JobSubmissionSchema = z.object({
  job_id: WorkflowIdSchema,
  client: WorkflowActorSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  budget_amount: z.string().min(1),
  budget_currency: z.string().min(1),
  deadline_utc: z.string().datetime(),
  created_at_utc: z.string().datetime(),
  status: z.literal("submitted"),
});

export const FreelancerReservationSchema = z.object({
  reservation_id: WorkflowIdSchema,
  job_id: WorkflowIdSchema,
  freelancer: WorkflowActorSchema,
  reserved_at_utc: z.string().datetime(),
  expires_at_utc: z.string().datetime().optional(),
  status: z.enum(["reserved", "expired", "cancelled"]),
});

export const ContractFormationSchema = z.object({
  contract_id: WorkflowIdSchema,
  job_id: WorkflowIdSchema,
  reservation_id: WorkflowIdSchema,
  marton_reference: z.string().min(1).optional(),
  escrow_amount: z.string().min(1),
  escrow_currency: z.string().min(1),
  formed_at_utc: z.string().datetime(),
  status: z.enum(["pending_marton", "formed", "failed", "cancelled"]),
});

export const WorkflowTrackingEventSchema = z.object({
  event_id: WorkflowIdSchema,
  job_id: WorkflowIdSchema,
  contract_id: WorkflowIdSchema.optional(),
  type: z.enum([
    "job_submitted",
    "freelancer_reserved",
    "contract_pending",
    "contract_formed",
    "work_submitted",
    "comparison_started",
    "comparison_completed",
    "approved",
    "changes_requested",
    "paid",
    "cancelled",
  ]),
  message: z.string().min(1),
  created_at_utc: z.string().datetime(),
});

export const WorkflowStateSchema = z.object({
  job: JobSubmissionSchema,
  reservation: FreelancerReservationSchema.nullable(),
  contract: ContractFormationSchema.nullable(),
  tracking_events: z.array(WorkflowTrackingEventSchema).default([]),
  current_status: z.enum([
    "submitted",
    "reserved",
    "contract_pending",
    "contract_formed",
    "work_submitted",
    "under_review",
    "approved",
    "changes_requested",
    "paid",
    "cancelled",
  ]),
  updated_at_utc: z.string().datetime(),
});

export const JobComparisonRequestSchema = z.object({
  job_id: WorkflowIdSchema,
  contract_id: WorkflowIdSchema.optional(),
  description: z.string().min(1),
  pairings: z
    .array(
      z.object({
        preview_client_id: WorkflowIdSchema,
        source_client_id: WorkflowIdSchema,
      }),
    )
    .default([]),
});

export type WorkflowActor = z.infer<typeof WorkflowActorSchema>;
export type JobSubmission = z.infer<typeof JobSubmissionSchema>;
export type FreelancerReservation = z.infer<typeof FreelancerReservationSchema>;
export type ContractFormation = z.infer<typeof ContractFormationSchema>;
export type WorkflowTrackingEvent = z.infer<typeof WorkflowTrackingEventSchema>;
export type WorkflowState = z.infer<typeof WorkflowStateSchema>;
export type JobComparisonRequest = z.infer<typeof JobComparisonRequestSchema>;
