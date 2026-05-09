"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const domain_schema_1 = require("../lib/workflow/domain-schema");
(0, node_test_1.describe)("workflow domain schemas", () => {
    (0, node_test_1.test)("validates complete job records", () => {
        const parsed = domain_schema_1.JobSchema.parse({
            id: "job_schema",
            contractId: "contract_job_schema",
            title: "Schema test job",
            description: "Validate job records.",
            budget: 42,
            deadline: "2026-06-01",
            requirements: "Use a schema.",
            status: "open",
            createdBy: "user_123",
            assignedTo: null,
            sourceFiles: [],
            previewFile: null,
            finalFile: null,
            aiReview: null,
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:00:00.000Z",
        });
        strict_1.default.equal(parsed.id, "job_schema");
        strict_1.default.equal(parsed.status, "open");
    });
    (0, node_test_1.test)("validates escrow contract records", () => {
        const parsed = domain_schema_1.EscrowContractSchema.parse({
            id: "contract_schema",
            jobId: "job_schema",
            clientId: "user_123",
            freelancerId: null,
            amount: 42,
            currency: "ETH",
            status: "funded",
            fundedAt: "2026-05-08T00:00:00.000Z",
            releasedAt: null,
            cancelledAt: null,
            transactionHash: "0xmock",
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:00:00.000Z",
        });
        strict_1.default.equal(parsed.jobId, "job_schema");
        strict_1.default.equal(parsed.status, "funded");
    });
    (0, node_test_1.test)("accepts reasonable create and update inputs", () => {
        strict_1.default.equal(domain_schema_1.CreateJobInputSchema.parse({
            title: "Create input",
            budget: 3,
            escrow: { currency: "ETH" },
        }).title, "Create input");
        strict_1.default.equal(domain_schema_1.UpdateJobInputSchema.parse({
            status: "submitted",
            assignedTo: "freelancer_123",
        }).status, "submitted");
    });
    (0, node_test_1.test)("rejects malformed domain records", () => {
        strict_1.default.throws(() => domain_schema_1.JobSchema.parse({
            id: "",
            contractId: "contract_bad",
            title: "",
            description: "Bad",
            budget: -1,
            deadline: "2026-06-01",
            requirements: "Bad",
            status: "open",
            createdBy: "user_123",
            assignedTo: null,
            sourceFiles: [],
            previewFile: null,
            finalFile: null,
            aiReview: null,
            createdAt: "not-a-date",
            updatedAt: "2026-05-08T00:00:00.000Z",
        }), /String must contain at least 1 character/);
        strict_1.default.throws(() => domain_schema_1.EscrowContractSchema.parse({
            id: "contract_bad",
            jobId: "job_bad",
            clientId: "user_123",
            freelancerId: null,
            amount: -1,
            currency: "",
            status: "missing",
            fundedAt: null,
            releasedAt: null,
            cancelledAt: null,
            transactionHash: null,
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:00:00.000Z",
        }), /Number must be greater than or equal to 0/);
    });
});
