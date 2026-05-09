"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const dummy_endpoints_1 = require("@/lib/workflow/dummy-endpoints");
const escrowContractActionsRoute = __importStar(require("../app/escrow-contracts/[contractId]/actions/route"));
const onChainEscrowConfirmRoute = __importStar(require("../app/escrow-contracts/[contractId]/onchain/confirm/route"));
const onChainEscrowPrepareRoute = __importStar(require("../app/escrow-contracts/[contractId]/onchain/prepare/route"));
const escrowContractRoute = __importStar(require("../app/escrow-contracts/[contractId]/route"));
const onChainEscrowFundingConfirmRoute = __importStar(require("../app/escrow-contracts/onchain/fund/confirm/route"));
const onChainEscrowFundingPrepareRoute = __importStar(require("../app/escrow-contracts/onchain/fund/prepare/route"));
const escrowContractsRoute = __importStar(require("../app/escrow-contracts/route"));
const availableJobsRoute = __importStar(require("../app/freelancer/jobs/available/route"));
const freelancerJobsRoute = __importStar(require("../app/freelancer/jobs/route"));
const acceptRoute = __importStar(require("../app/jobs/[jobId]/accept/route"));
const acceptJobRoute = __importStar(require("../app/jobs/[jobId]/accept-job/route"));
const requestAiReviewRoute = __importStar(require("../app/jobs/[jobId]/request-ai-review/route"));
const requestRevisionRoute = __importStar(require("../app/jobs/[jobId]/request-revision/route"));
const jobRoute = __importStar(require("../app/jobs/[jobId]/route"));
const submitRoute = __importStar(require("../app/jobs/[jobId]/submit/route"));
const uploadFinalRoute = __importStar(require("../app/jobs/[jobId]/upload-final/route"));
const uploadPreviewRoute = __importStar(require("../app/jobs/[jobId]/upload-preview/route"));
const jobsRoute = __importStar(require("../app/jobs/route"));
const currentUserJobsRoute = __importStar(require("../app/users/me/jobs/route"));
(0, node_test_1.describe)("workflow route handlers", () => {
    (0, node_test_1.beforeEach)(() => {
        (0, dummy_endpoints_1.resetDummyStoreForTests)();
    });
    (0, node_test_1.test)("lists and creates jobs from the store", async () => {
        const listResponse = await jobsRoute.GET();
        const jobs = await listResponse.json();
        strict_1.default.equal(listResponse.status, 200);
        strict_1.default.deepEqual(jobs.map((job) => job.id), ["job_123", "job_456", "job_789"]);
        const createResponse = await jobsRoute.POST(new Request("http://test.local/jobs", {
            method: "POST",
            body: JSON.stringify({
                title: "Route-created job",
                budget: 321,
            }),
        }));
        const created = await createResponse.json();
        strict_1.default.equal(createResponse.status, 201);
        strict_1.default.equal(created.id, "job_new_1");
        strict_1.default.equal(created.title, "Route-created job");
        strict_1.default.equal(created.budget, 321);
        strict_1.default.equal(created.contract.id, "contract_job_new_1");
        const nextListResponse = await jobsRoute.GET();
        const nextJobs = await nextListResponse.json();
        strict_1.default.equal(nextJobs.length, 4);
    });
    (0, node_test_1.test)("returns 400 for invalid job create payloads", async () => {
        const response = await jobsRoute.POST(new Request("http://test.local/jobs", {
            method: "POST",
            body: JSON.stringify({
                title: "",
                budget: -1,
            }),
        }));
        const payload = await response.json();
        strict_1.default.equal(response.status, 400);
        strict_1.default.equal(payload.error, "Invalid job payload.");
        strict_1.default.ok(payload.details.fieldErrors.title);
        strict_1.default.ok(payload.details.fieldErrors.budget);
    });
    (0, node_test_1.test)("reads job details with escrow and returns 404 for missing jobs", async () => {
        const found = await jobRoute.GET(new Request("http://test.local"), context("job_456"));
        const foundPayload = await found.json();
        strict_1.default.equal(found.status, 200);
        strict_1.default.equal(foundPayload.job.id, "job_456");
        strict_1.default.equal(foundPayload.contract.id, "contract_job_456");
        const missing = await jobRoute.GET(new Request("http://test.local"), context("missing"));
        strict_1.default.equal(missing.status, 404);
        strict_1.default.deepEqual(await missing.json(), { error: "Job not found." });
    });
    (0, node_test_1.test)("lists role-specific jobs from the store", async () => {
        const freelancerResponse = await freelancerJobsRoute.GET();
        const freelancerJobs = await freelancerResponse.json();
        strict_1.default.deepEqual(freelancerJobs.map((job) => job.id), ["job_123", "job_456"]);
        const availableResponse = await availableJobsRoute.GET();
        const availableJobs = await availableResponse.json();
        strict_1.default.deepEqual(availableJobs.map((job) => job.id), ["job_789"]);
        const currentUserResponse = await currentUserJobsRoute.GET();
        const currentUserJobs = await currentUserResponse.json();
        strict_1.default.deepEqual(currentUserJobs.map((job) => job.id), ["job_123", "job_789"]);
    });
    (0, node_test_1.test)("reads and patches escrow contracts from the store", async () => {
        const listResponse = await escrowContractsRoute.GET();
        const contracts = await listResponse.json();
        strict_1.default.deepEqual(contracts.map((contract) => contract.id), ["contract_job_123", "contract_job_456", "contract_job_789"]);
        const found = await escrowContractRoute.GET(new Request("http://test.local"), contractContext("contract_job_456"));
        const foundPayload = await found.json();
        strict_1.default.equal(found.status, 200);
        strict_1.default.equal(foundPayload.jobId, "job_456");
        strict_1.default.equal(foundPayload.status, "locked");
        const patched = await escrowContractRoute.PATCH(new Request("http://test.local", {
            method: "PATCH",
            body: JSON.stringify({ disputeReason: "Manual note." }),
        }), contractContext("contract_job_456"));
        const patchedPayload = await patched.json();
        strict_1.default.equal(patched.status, 200);
        strict_1.default.equal(patchedPayload.disputeReason, "Manual note.");
        const invalidPatch = await escrowContractRoute.PATCH(new Request("http://test.local", {
            method: "PATCH",
            body: JSON.stringify({ status: "released" }),
        }), contractContext("contract_job_456"));
        strict_1.default.equal(invalidPatch.status, 400);
        strict_1.default.equal((await invalidPatch.json()).error, "Invalid escrow contract payload.");
    });
    (0, node_test_1.test)("mutates escrow contracts through action routes", async () => {
        const submitted = await submitRoute.POST(new Request("http://test.local", {
            method: "POST",
            body: JSON.stringify({
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
                submissionNotes: "Route submission notes.",
            }),
        }), context("job_456"));
        strict_1.default.equal((await submitted.json()).contract.status, "release_requested");
        const released = await escrowContractActionsRoute.POST(new Request("http://test.local", {
            method: "POST",
            body: JSON.stringify({
                action: "release",
                transactionHash: "0xrelease456",
            }),
        }), contractContext("contract_job_456"));
        const releasedPayload = await released.json();
        strict_1.default.equal(released.status, 200);
        strict_1.default.equal(releasedPayload.contract.status, "released");
        strict_1.default.equal(releasedPayload.contract.releaseTransactionHash, "0xrelease456");
        strict_1.default.equal(releasedPayload.message, "Escrow released successfully");
        const invalid = await escrowContractActionsRoute.POST(new Request("http://test.local", {
            method: "POST",
            body: JSON.stringify({ action: "refund" }),
        }), contractContext("contract_job_456"));
        strict_1.default.equal(invalid.status, 409);
        strict_1.default.deepEqual(await invalid.json(), {
            error: 'Cannot refund an escrow contract with status "released".',
        });
    });
    (0, node_test_1.test)("prepares and confirms on-chain escrow actions without wallet logic", async () => {
        process.env.NEXT_PUBLIC_SMARTJOBS_ESCROW_ADDRESS =
            "0x0000000000000000000000000000000000009999";
        const prepare = await onChainEscrowPrepareRoute.POST(new Request("http://test.local", {
            method: "POST",
            body: JSON.stringify({
                action: "lock",
                freelancerId: "freelancer_wallet_test",
                freelancerWalletAddress: "0x0000000000000000000000000000000000000abc",
            }),
        }), contractContext("contract_job_789"));
        const prepared = await prepare.json();
        strict_1.default.equal(prepare.status, 200);
        strict_1.default.equal(prepared.transaction.chainId, 11155111);
        strict_1.default.equal(prepared.transaction.functionName, "lockEscrow");
        strict_1.default.equal(prepared.transaction.args[1], "0x0000000000000000000000000000000000000aBc");
        strict_1.default.equal(prepared.confirmation.href, "/escrow-contracts/contract_job_789/onchain/confirm");
        const confirm = await onChainEscrowConfirmRoute.POST(new Request("http://test.local", {
            method: "POST",
            body: JSON.stringify({
                action: "lock",
                transactionHash: "0xlock789",
                freelancerId: "freelancer_wallet_test",
                freelancerWalletAddress: "0x0000000000000000000000000000000000000abc",
            }),
        }), contractContext("contract_job_789"));
        const confirmed = await confirm.json();
        strict_1.default.equal(confirm.status, 200);
        strict_1.default.equal(confirmed.contract.status, "locked");
        strict_1.default.equal(confirmed.contract.freelancerId, "freelancer_wallet_test");
        strict_1.default.equal(confirmed.contract.freelancerWalletAddress, "0x0000000000000000000000000000000000000aBc");
        strict_1.default.equal(confirmed.contract.lockTransactionHash, "0xlock789");
        strict_1.default.equal(confirmed.transactionHash, "0xlock789");
    });
    (0, node_test_1.test)("prepares and confirms on-chain escrow funding as a ledger entry", async () => {
        process.env.NEXT_PUBLIC_SMARTJOBS_ESCROW_ADDRESS =
            "0x0000000000000000000000000000000000009999";
        const prepare = await onChainEscrowFundingPrepareRoute.POST(new Request("http://test.local", {
            method: "POST",
            body: JSON.stringify({
                jobId: "job_chain_new",
                contractId: "contract_job_chain_new",
                amountEth: "0.25",
            }),
        }));
        const prepared = await prepare.json();
        strict_1.default.equal(prepare.status, 200);
        strict_1.default.equal(prepared.jobId, "job_chain_new");
        strict_1.default.equal(prepared.contractId, "contract_job_chain_new");
        strict_1.default.equal(prepared.transaction.functionName, "createEscrow");
        strict_1.default.equal(prepared.transaction.value, "0x3782dace9d90000");
        const confirm = await onChainEscrowFundingConfirmRoute.POST(new Request("http://test.local", {
            method: "POST",
            body: JSON.stringify({
                id: "job_chain_new",
                contractId: "contract_job_chain_new",
                title: "Chain-funded route job",
                description: "Create after the frontend sends a chain transaction.",
                budget: 875,
                requirements: "Record tx hash and keep AI review context local.",
                transactionHash: "0xfunded",
                amountEth: "0.25",
                clientWalletAddress: "0x0000000000000000000000000000000000000abc",
                submissionNotes: "Funded from the frontend wallet.",
            }),
        }));
        const confirmed = await confirm.json();
        strict_1.default.equal(confirm.status, 201);
        strict_1.default.equal(confirmed.id, "job_chain_new");
        strict_1.default.equal(confirmed.contract.status, "funded");
        strict_1.default.equal(confirmed.contract.fundingTransactionHash, "0xfunded");
        strict_1.default.equal(confirmed.contract.amount, 0.25);
        strict_1.default.equal(confirmed.contract.chainId, 11155111);
        strict_1.default.equal(confirmed.contract.escrowAddress, "0x0000000000000000000000000000000000009999");
        strict_1.default.equal(confirmed.contract.clientWalletAddress, "0x0000000000000000000000000000000000000abc");
    });
    (0, node_test_1.test)("mutates jobs through action routes", async () => {
        const accepted = await acceptJobRoute.POST(new Request("http://test.local"), context("job_789"));
        const acceptedPayload = await accepted.json();
        strict_1.default.equal(acceptedPayload.id, "job_789");
        strict_1.default.equal(acceptedPayload.status, "in_progress");
        strict_1.default.equal(acceptedPayload.assignedTo, "freelancer_123");
        strict_1.default.equal(acceptedPayload.contract.status, "locked");
        const preview = await uploadPreviewRoute.POST(new Request("http://test.local", {
            method: "POST",
            body: JSON.stringify({
                previewFile: {
                    id: "preview_job_789",
                    url: "https://demo.app/preview",
                    filename: "preview",
                },
            }),
        }), context("job_789"));
        const previewPayload = await preview.json();
        strict_1.default.equal(previewPayload.previewFile.id, "preview_job_789");
        const final = await uploadFinalRoute.POST(new Request("http://test.local", {
            method: "POST",
            body: JSON.stringify({
                finalFile: {
                    id: "final_job_789",
                    url: "https://github.com/demo/source/archive.zip",
                    filename: "archive.zip",
                },
            }),
        }), context("job_789"));
        const finalPayload = await final.json();
        strict_1.default.equal(finalPayload.finalFile.id, "final_job_789");
        const submitted = await submitRoute.POST(new Request("http://test.local", {
            method: "POST",
            body: JSON.stringify({
                submittedSourceFiles: [
                    {
                        id: "source_job_789",
                        url: "https://github.com/demo/source/archive.zip",
                        filename: "archive.zip",
                    },
                ],
                submissionNotes: "Ready for review.",
            }),
        }), context("job_789"));
        const submittedPayload = await submitted.json();
        strict_1.default.equal(submittedPayload.status, "submitted");
        strict_1.default.equal(submittedPayload.reviewInputs.sourceFiles[0].id, "source_job_789");
        strict_1.default.equal(submittedPayload.contract.status, "release_requested");
        const aiReview = await requestAiReviewRoute.POST(new Request("http://test.local"), context("job_789"));
        const aiReviewPayload = await aiReview.json();
        strict_1.default.equal(aiReviewPayload.status, "ai_reviewed");
        strict_1.default.equal(aiReviewPayload.reviewInputs.submissionNotes, "Ready for review.");
        const revision = await requestRevisionRoute.POST(new Request("http://test.local"), context("job_789"));
        const revisionPayload = await revision.json();
        strict_1.default.equal(revisionPayload.id, "job_789");
        strict_1.default.equal(revisionPayload.status, "revision_requested");
        const completed = await acceptRoute.POST(new Request("http://test.local"), context("job_789"));
        const completedPayload = await completed.json();
        strict_1.default.equal(completedPayload.id, "job_789");
        strict_1.default.equal(completedPayload.status, "completed");
        strict_1.default.equal(completedPayload.contract.status, "released");
    });
    (0, node_test_1.test)("job completion route returns conflict for invalid escrow state", async () => {
        const response = await acceptRoute.POST(new Request("http://test.local"), context("job_789"));
        strict_1.default.equal(response.status, 409);
        strict_1.default.deepEqual(await response.json(), {
            error: 'Cannot release an escrow contract with status "funded".',
        });
    });
});
function context(jobId) {
    return {
        params: Promise.resolve({ jobId }),
    };
}
function contractContext(contractId) {
    return {
        params: Promise.resolve({ contractId }),
    };
}
