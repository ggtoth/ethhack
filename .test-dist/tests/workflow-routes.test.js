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
const jobsRoute = __importStar(require("../app/jobs/route"));
const jobRoute = __importStar(require("../app/jobs/[jobId]/route"));
const acceptRoute = __importStar(require("../app/jobs/[jobId]/accept/route"));
const acceptJobRoute = __importStar(require("../app/jobs/[jobId]/accept-job/route"));
const requestRevisionRoute = __importStar(require("../app/jobs/[jobId]/request-revision/route"));
const uploadPreviewRoute = __importStar(require("../app/jobs/[jobId]/upload-preview/route"));
const uploadFinalRoute = __importStar(require("../app/jobs/[jobId]/upload-final/route"));
const submitRoute = __importStar(require("../app/jobs/[jobId]/submit/route"));
const requestAiReviewRoute = __importStar(require("../app/jobs/[jobId]/request-ai-review/route"));
const freelancerJobsRoute = __importStar(require("../app/freelancer/jobs/route"));
const availableJobsRoute = __importStar(require("../app/freelancer/jobs/available/route"));
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
    (0, node_test_1.test)("reads job details and returns 404 for missing jobs", async () => {
        const found = await jobRoute.GET(new Request("http://test.local"), context("job_456"));
        const foundPayload = await found.json();
        strict_1.default.equal(found.status, 200);
        strict_1.default.equal(foundPayload.id, "job_456");
        strict_1.default.equal(foundPayload.contractId, "contract_job_456");
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
    (0, node_test_1.test)("mutates jobs through action routes", async () => {
        const accepted = await acceptJobRoute.POST(new Request("http://test.local"), context("job_789"));
        const acceptedPayload = await accepted.json();
        strict_1.default.equal(acceptedPayload.id, "job_789");
        strict_1.default.equal(acceptedPayload.status, "in_progress");
        strict_1.default.equal(acceptedPayload.assignedTo, "freelancer_123");
        strict_1.default.equal(acceptedPayload.contract.status, "locked");
        strict_1.default.equal(acceptedPayload.message, "Job accepted by freelancer");
        const preview = await uploadPreviewRoute.POST(new Request("http://test.local"), context("job_789"));
        const previewPayload = await preview.json();
        strict_1.default.equal(previewPayload.previewFile.id, "file_preview_job_789");
        const final = await uploadFinalRoute.POST(new Request("http://test.local"), context("job_789"));
        const finalPayload = await final.json();
        strict_1.default.equal(finalPayload.finalFile.id, "file_final_job_789");
        const submitted = await submitRoute.POST(new Request("http://test.local"), context("job_789"));
        const submittedPayload = await submitted.json();
        strict_1.default.equal(submittedPayload.status, "submitted");
        strict_1.default.equal(submittedPayload.reviewInputs.previewFile.id, "file_preview_job_789");
        strict_1.default.equal(submittedPayload.contract.status, "release_requested");
        const aiReview = await requestAiReviewRoute.POST(new Request("http://test.local"), context("job_789"));
        const aiReviewPayload = await aiReview.json();
        strict_1.default.equal(aiReviewPayload.status, "ai_reviewed");
        strict_1.default.equal(aiReviewPayload.aiReview.id, "review_job_789");
        const revision = await requestRevisionRoute.POST(new Request("http://test.local"), context("job_789"));
        const revisionPayload = await revision.json();
        strict_1.default.equal(revisionPayload.id, "job_789");
        strict_1.default.equal(revisionPayload.status, "revision_requested");
        strict_1.default.equal(revisionPayload.contract.id, "contract_job_789");
        strict_1.default.equal(revisionPayload.message, "Revision requested successfully");
        const completed = await acceptRoute.POST(new Request("http://test.local"), context("job_789"));
        const completedPayload = await completed.json();
        strict_1.default.equal(completedPayload.id, "job_789");
        strict_1.default.equal(completedPayload.status, "completed");
        strict_1.default.equal(completedPayload.contract.status, "released");
        strict_1.default.equal(completedPayload.message, "Job accepted successfully");
    });
    (0, node_test_1.test)("action routes return 404 for missing jobs", async () => {
        const routes = [
            acceptRoute.POST,
            acceptJobRoute.POST,
            requestRevisionRoute.POST,
            uploadPreviewRoute.POST,
            uploadFinalRoute.POST,
            submitRoute.POST,
            requestAiReviewRoute.POST,
        ];
        for (const route of routes) {
            const response = await route(new Request("http://test.local"), context("missing"));
            strict_1.default.equal(response.status, 404);
            strict_1.default.deepEqual(await response.json(), { error: "Job not found." });
        }
    });
});
function context(jobId) {
    return {
        params: Promise.resolve({ jobId }),
    };
}
