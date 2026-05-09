"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobComparisonRequestSchema = exports.WorkflowStateSchema = exports.WorkflowTrackingEventSchema = exports.ContractFormationSchema = exports.FreelancerReservationSchema = exports.JobSubmissionSchema = exports.WorkflowActorSchema = exports.WorkflowIdSchema = void 0;
const zod_1 = require("zod");
exports.WorkflowIdSchema = zod_1.z.string().min(1);
exports.WorkflowActorSchema = zod_1.z.object({
    id: exports.WorkflowIdSchema,
    name: zod_1.z.string().min(1),
    wallet_address: zod_1.z.string().min(1).optional(),
});
exports.JobSubmissionSchema = zod_1.z.object({
    job_id: exports.WorkflowIdSchema,
    client: exports.WorkflowActorSchema,
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    budget_amount: zod_1.z.string().min(1),
    budget_currency: zod_1.z.string().min(1),
    deadline_utc: zod_1.z.string().datetime(),
    created_at_utc: zod_1.z.string().datetime(),
    status: zod_1.z.literal("submitted"),
});
exports.FreelancerReservationSchema = zod_1.z.object({
    reservation_id: exports.WorkflowIdSchema,
    job_id: exports.WorkflowIdSchema,
    freelancer: exports.WorkflowActorSchema,
    reserved_at_utc: zod_1.z.string().datetime(),
    expires_at_utc: zod_1.z.string().datetime().optional(),
    status: zod_1.z.enum(["reserved", "expired", "cancelled"]),
});
exports.ContractFormationSchema = zod_1.z.object({
    contract_id: exports.WorkflowIdSchema,
    job_id: exports.WorkflowIdSchema,
    reservation_id: exports.WorkflowIdSchema,
    marton_reference: zod_1.z.string().min(1).optional(),
    escrow_amount: zod_1.z.string().min(1),
    escrow_currency: zod_1.z.string().min(1),
    formed_at_utc: zod_1.z.string().datetime(),
    status: zod_1.z.enum(["pending_marton", "formed", "failed", "cancelled"]),
});
exports.WorkflowTrackingEventSchema = zod_1.z.object({
    event_id: exports.WorkflowIdSchema,
    job_id: exports.WorkflowIdSchema,
    contract_id: exports.WorkflowIdSchema.optional(),
    type: zod_1.z.enum([
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
    message: zod_1.z.string().min(1),
    created_at_utc: zod_1.z.string().datetime(),
});
exports.WorkflowStateSchema = zod_1.z.object({
    job: exports.JobSubmissionSchema,
    reservation: exports.FreelancerReservationSchema.nullable(),
    contract: exports.ContractFormationSchema.nullable(),
    tracking_events: zod_1.z.array(exports.WorkflowTrackingEventSchema).default([]),
    current_status: zod_1.z.enum([
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
    updated_at_utc: zod_1.z.string().datetime(),
});
exports.JobComparisonRequestSchema = zod_1.z.object({
    job_id: exports.WorkflowIdSchema,
    contract_id: exports.WorkflowIdSchema.optional(),
    description: zod_1.z.string().min(1),
    pairings: zod_1.z
        .array(zod_1.z.object({
        preview_client_id: exports.WorkflowIdSchema,
        source_client_id: exports.WorkflowIdSchema,
    }))
        .default([]),
});
