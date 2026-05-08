import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  CreateJobInputSchema,
  EscrowContractSchema,
  JobSchema,
  UpdateJobInputSchema,
} from "../lib/workflow/domain-schema";

describe("workflow domain schemas", () => {
  test("validates complete job records", () => {
    const parsed = JobSchema.parse({
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

    assert.equal(parsed.id, "job_schema");
    assert.equal(parsed.status, "open");
  });

  test("validates escrow contract records", () => {
    const parsed = EscrowContractSchema.parse({
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

    assert.equal(parsed.jobId, "job_schema");
    assert.equal(parsed.status, "funded");
  });

  test("accepts reasonable create and update inputs", () => {
    assert.equal(
      CreateJobInputSchema.parse({
        title: "Create input",
        budget: 3,
        escrow: { currency: "ETH" },
      }).title,
      "Create input",
    );
    assert.equal(
      UpdateJobInputSchema.parse({
        status: "submitted",
        assignedTo: "freelancer_123",
      }).status,
      "submitted",
    );
  });

  test("rejects malformed domain records", () => {
    assert.throws(
      () =>
        JobSchema.parse({
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
        }),
      /String must contain at least 1 character/,
    );
    assert.throws(
      () =>
        EscrowContractSchema.parse({
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
        }),
      /Number must be greater than or equal to 0/,
    );
  });
});
