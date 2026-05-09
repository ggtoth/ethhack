"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dummy_endpoints_1 = require("../lib/workflow/dummy-endpoints");
(0, node_test_1.describe)("workflow dummy in-memory store", () => {
    (0, node_test_1.beforeEach)(() => {
        (0, dummy_endpoints_1.resetDummyStoreForTests)();
    });
    (0, node_test_1.test)("seeds jobs on reset and returns cloned records", () => {
        const jobs = (0, dummy_endpoints_1.listDummyJobs)();
        const contracts = (0, dummy_endpoints_1.listDummyEscrowContracts)();
        strict_1.default.equal(jobs.length, 3);
        strict_1.default.equal(contracts.length, 3);
        strict_1.default.deepEqual(jobs.map((job) => job.id), ["job_123", "job_456", "job_789"]);
        strict_1.default.deepEqual(contracts.map((contract) => contract.id), ["contract_job_123", "contract_job_456", "contract_job_789"]);
        jobs[0].title = "Mutated outside the store";
        strict_1.default.equal((0, dummy_endpoints_1.getDummyJob)("job_123")?.title, "Create a logo");
        contracts[0].status = "cancelled";
        strict_1.default.equal((0, dummy_endpoints_1.getDummyEscrowContract)("contract_job_123")?.status, "released");
    });
    (0, node_test_1.test)("returns null for missing jobs", () => {
        strict_1.default.equal((0, dummy_endpoints_1.getDummyJob)("missing"), null);
        strict_1.default.equal((0, dummy_endpoints_1.updateDummyJob)("missing", { status: "completed" }), null);
        strict_1.default.equal((0, dummy_endpoints_1.acceptDummyJob)("missing"), null);
        strict_1.default.equal((0, dummy_endpoints_1.completeDummyJob)("missing"), null);
        strict_1.default.equal((0, dummy_endpoints_1.requestDummyRevision)("missing"), null);
        strict_1.default.equal((0, dummy_endpoints_1.uploadDummyPreview)("missing"), null);
        strict_1.default.equal((0, dummy_endpoints_1.uploadDummyFinal)("missing"), null);
        strict_1.default.equal((0, dummy_endpoints_1.submitDummyJob)("missing"), null);
        strict_1.default.equal((0, dummy_endpoints_1.requestDummyAiReview)("missing"), null);
    });
    (0, node_test_1.test)("creates jobs with defaults and stores them", () => {
        const created = (0, dummy_endpoints_1.createDummyJob)({
            title: "API integration test job",
            requirements: "Return data from the in-memory DB.",
        });
        strict_1.default.equal(created.id, "job_new_1");
        strict_1.default.equal(created.contractId, "contract_job_new_1");
        strict_1.default.equal(created.title, "API integration test job");
        strict_1.default.equal(created.status, "open");
        strict_1.default.equal(created.contract.id, "contract_job_new_1");
        strict_1.default.equal(created.contract.jobId, "job_new_1");
        strict_1.default.equal(created.contract.amount, 150);
        strict_1.default.equal(created.contract.status, "funded");
        strict_1.default.equal(created.contract.chainId, 1);
        strict_1.default.equal(created.contract.fundingTransactionHash, "0xmockfundedjob_new_1");
        strict_1.default.equal(created.message, "Job created successfully");
        strict_1.default.equal((0, dummy_endpoints_1.getDummyJob)(created.id)?.requirements, "Return data from the in-memory DB.");
        strict_1.default.equal((0, dummy_endpoints_1.getDummyEscrowContract)(created.contractId)?.jobId, created.id);
    });
    (0, node_test_1.test)("rejects invalid create and update payloads", () => {
        strict_1.default.throws(() => (0, dummy_endpoints_1.createDummyJob)({ title: "", budget: -1 }), /String must contain at least 1 character/);
        strict_1.default.throws(() => (0, dummy_endpoints_1.updateDummyJob)("job_123", { budget: -10 }), /Number must be greater than or equal to 0/);
    });
    (0, node_test_1.test)("updates jobs and exposes list filters", () => {
        const updated = (0, dummy_endpoints_1.updateDummyJob)("job_789", {
            assignedTo: "freelancer_123",
            status: "in_progress",
        });
        strict_1.default.equal(updated?.assignedTo, "freelancer_123");
        strict_1.default.equal(updated?.status, "in_progress");
        strict_1.default.deepEqual((0, dummy_endpoints_1.listFreelancerDummyJobs)().map((job) => job.id).sort(), ["job_123", "job_456", "job_789"]);
        strict_1.default.deepEqual((0, dummy_endpoints_1.listCurrentUserDummyJobs)().map((job) => job.id).sort(), ["job_123", "job_789"]);
        strict_1.default.deepEqual((0, dummy_endpoints_1.listAvailableDummyJobs)().map((job) => job.id), []);
    });
    (0, node_test_1.test)("accepts and completes jobs through store actions", () => {
        const accepted = (0, dummy_endpoints_1.acceptDummyJob)("job_789");
        strict_1.default.equal(accepted?.id, "job_789");
        strict_1.default.equal(accepted?.status, "in_progress");
        strict_1.default.equal(accepted?.assignedTo, "freelancer_123");
        strict_1.default.equal(accepted?.contract?.status, "locked");
        strict_1.default.equal(accepted?.message, "Job accepted by freelancer");
        strict_1.default.equal((0, dummy_endpoints_1.getDummyJob)("job_789")?.assignedTo, "freelancer_123");
        strict_1.default.equal((0, dummy_endpoints_1.getDummyEscrowContractForJob)("job_789")?.freelancerId, "freelancer_123");
        const completed = (0, dummy_endpoints_1.completeDummyJob)("job_789");
        strict_1.default.equal(completed?.id, "job_789");
        strict_1.default.equal(completed?.status, "completed");
        strict_1.default.equal(completed?.contract?.status, "released");
        strict_1.default.ok(completed?.contract?.releasedAt);
        strict_1.default.equal(completed?.message, "Job accepted successfully");
        strict_1.default.equal((0, dummy_endpoints_1.getDummyJob)("job_789")?.status, "completed");
    });
    (0, node_test_1.test)("uploads preview and final files through store actions", () => {
        const preview = (0, dummy_endpoints_1.uploadDummyPreview)("job_456", {
            id: "preview_custom",
            url: "https://demo.app/landing",
            filename: "landing",
        });
        strict_1.default.equal(preview?.status, "in_progress");
        strict_1.default.equal(preview?.previewFile?.id, "preview_custom");
        strict_1.default.equal(preview?.userVisiblePreview?.id, "preview_custom");
        strict_1.default.equal((0, dummy_endpoints_1.getDummyJob)("job_456")?.previewFile?.filename, "landing");
        const final = (0, dummy_endpoints_1.uploadDummyFinal)("job_456", {
            id: "final_custom",
            url: "https://github.com/demo/source",
            filename: "source.zip",
        });
        strict_1.default.equal(final?.status, "in_progress");
        strict_1.default.equal(final?.finalFile?.id, "final_custom");
        strict_1.default.equal(final?.contract?.id, "contract_job_456");
        strict_1.default.equal((0, dummy_endpoints_1.getDummyJob)("job_456")?.finalFile?.filename, "source.zip");
    });
    (0, node_test_1.test)("submits jobs and stores source files plus notes", () => {
        const submitted = (0, dummy_endpoints_1.submitDummyJob)("job_456", {
            previewFile: {
                id: "preview_submit",
                url: "https://demo.app/landing",
                filename: "landing",
            },
            finalFile: {
                id: "final_submit",
                url: "https://github.com/demo/source/archive.zip",
                filename: "archive.zip",
            },
            submittedSourceFiles: [
                {
                    id: "source_submit",
                    url: "https://github.com/demo/source/archive.zip",
                    filename: "archive.zip",
                },
            ],
            submissionNotes: "Responsive page completed.",
        });
        strict_1.default.equal(submitted?.status, "submitted");
        strict_1.default.equal(submitted?.previewFile?.id, "preview_submit");
        strict_1.default.equal(submitted?.finalFile?.id, "final_submit");
        strict_1.default.equal(submitted?.submittedSourceFiles[0]?.id, "source_submit");
        strict_1.default.equal(submitted?.submissionNotes, "Responsive page completed.");
        strict_1.default.equal(submitted?.contract?.status, "release_requested");
        strict_1.default.equal((0, dummy_endpoints_1.getDummyJob)("job_456")?.status, "submitted");
    });
    (0, node_test_1.test)("updates and transitions escrow contracts explicitly", () => {
        const patched = (0, dummy_endpoints_1.updateDummyEscrowContract)("contract_job_456", {
            disputeReason: "Needs client attention.",
        });
        strict_1.default.equal(patched?.disputeReason, "Needs client attention.");
        const submitted = (0, dummy_endpoints_1.submitDummyJob)("job_456");
        strict_1.default.equal(submitted?.contract?.status, "release_requested");
        const disputed = (0, dummy_endpoints_1.applyDummyEscrowContractAction)("contract_job_456", {
            action: "dispute",
            disputeReason: "The final delivery is incomplete.",
            transactionHash: "0xdispute456",
        });
        strict_1.default.equal(disputed?.contract.status, "disputed");
        strict_1.default.equal(disputed?.contract.disputeReason, "The final delivery is incomplete.");
        strict_1.default.equal(disputed?.contract.disputeTransactionHash, "0xdispute456");
        strict_1.default.equal((0, dummy_endpoints_1.getDummyJob)("job_456")?.status, "disputed");
        const refunded = (0, dummy_endpoints_1.applyDummyEscrowContractAction)("contract_job_456", {
            action: "refund",
            transactionHash: "0xrefund456",
        });
        strict_1.default.equal(refunded?.contract.status, "refunded");
        strict_1.default.equal(refunded?.contract.refundTransactionHash, "0xrefund456");
        strict_1.default.equal((0, dummy_endpoints_1.getDummyJob)("job_456")?.status, "cancelled");
        strict_1.default.throws(() => (0, dummy_endpoints_1.applyDummyEscrowContractAction)("contract_job_456", {
            action: "release",
        }), dummy_endpoints_1.DummyWorkflowConflictError);
    });
    (0, node_test_1.test)("confirms on-chain funding into the in-memory ledger", () => {
        const created = (0, dummy_endpoints_1.confirmDummyOnChainFunding)({
            id: "job_chain_new",
            contractId: "contract_job_chain_new",
            title: "Chain-funded route job",
            description: "Create after the frontend sends a chain transaction.",
            budget: 875,
            requirements: "Record tx hash and keep AI review context local.",
            transactionHash: "0xfunded",
            amountEth: "0.25",
            clientWalletAddress: "0x0000000000000000000000000000000000000abc",
            escrowAddress: "0x0000000000000000000000000000000000009999",
            chainId: 11155111,
        });
        strict_1.default.equal(created.id, "job_chain_new");
        strict_1.default.equal(created.contract.status, "funded");
        strict_1.default.equal(created.contract.fundingTransactionHash, "0xfunded");
        strict_1.default.equal(created.contract.amount, 0.25);
        strict_1.default.equal(created.contract.chainId, 11155111);
        strict_1.default.equal(created.contract.escrowAddress, "0x0000000000000000000000000000000000009999");
        strict_1.default.equal(created.contract.clientWalletAddress, "0x0000000000000000000000000000000000000abc");
    });
    (0, node_test_1.test)("returns null for missing escrow contract actions", () => {
        strict_1.default.equal((0, dummy_endpoints_1.updateDummyEscrowContract)("missing", { disputeReason: "Missing." }), null);
        strict_1.default.equal((0, dummy_endpoints_1.applyDummyEscrowContractAction)("missing", { action: "release" }), null);
    });
    (0, node_test_1.test)("requests revisions and AI reviews through store actions", () => {
        const revision = (0, dummy_endpoints_1.requestDummyRevision)("job_456");
        strict_1.default.equal(revision?.id, "job_456");
        strict_1.default.equal(revision?.status, "revision_requested");
        strict_1.default.equal(revision?.contract?.id, "contract_job_456");
        strict_1.default.equal(revision?.message, "Revision requested successfully");
        (0, dummy_endpoints_1.submitDummyJob)("job_456", {
            submittedSourceFiles: [(0, dummy_endpoints_1.makeFinalFile)("job_456")],
            submissionNotes: "Ready for review.",
        });
        const review = (0, dummy_endpoints_1.requestDummyAiReview)("job_456");
        strict_1.default.equal(review?.jobId, "job_456");
        strict_1.default.equal(review?.status, "ai_reviewed");
        strict_1.default.equal(review?.aiReview?.id, "review_job_456");
        strict_1.default.equal(review?.contract?.id, "contract_job_456");
        strict_1.default.equal(review?.reviewInputs.sourceFiles[0]?.id, "file_final_job_456");
        strict_1.default.equal(review?.reviewInputs.submissionNotes, "Ready for review.");
        strict_1.default.equal((0, dummy_endpoints_1.getDummyJob)("job_456")?.aiReview?.verdict, "pass");
        strict_1.default.equal((0, dummy_endpoints_1.getDummyJobWithContract)("job_456")?.contract.id, "contract_job_456");
    });
    (0, node_test_1.test)("maps job list items and file factories", () => {
        const job = (0, dummy_endpoints_1.getDummyJob)("job_123");
        strict_1.default.ok(job);
        strict_1.default.deepEqual((0, dummy_endpoints_1.toJobListItem)(job), {
            id: "job_123",
            contractId: "contract_job_123",
            title: "Create a logo",
            description: "Need a simple coffee shop logo",
            budget: 100,
            deadline: "2026-06-01",
            status: "ai_reviewed",
            createdBy: "user_123",
            assignedTo: "freelancer_123",
            updatedAt: "2026-05-08T00:00:00.000Z",
        });
        strict_1.default.deepEqual((0, dummy_endpoints_1.makePreviewFile)("job_x"), {
            id: "file_preview_job_x",
            url: "https://dummy-filestore.com/preview.png",
            filename: "preview.png",
        });
        strict_1.default.deepEqual((0, dummy_endpoints_1.makeFinalFile)("job_x"), {
            id: "file_final_job_x",
            url: "https://dummy-filestore.com/final.zip",
            filename: "final.zip",
        });
    });
});
