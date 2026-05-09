"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDummyStoreForTests = resetDummyStoreForTests;
exports.listDummyJobs = listDummyJobs;
exports.listDummyEscrowContracts = listDummyEscrowContracts;
exports.listCurrentUserDummyJobs = listCurrentUserDummyJobs;
exports.listFreelancerDummyJobs = listFreelancerDummyJobs;
exports.listAvailableDummyJobs = listAvailableDummyJobs;
exports.getDummyJob = getDummyJob;
exports.getDummyEscrowContract = getDummyEscrowContract;
exports.getDummyEscrowContractForJob = getDummyEscrowContractForJob;
exports.getDummyJobWithContract = getDummyJobWithContract;
exports.createDummyJob = createDummyJob;
exports.updateDummyJob = updateDummyJob;
exports.acceptDummyJob = acceptDummyJob;
exports.completeDummyJob = completeDummyJob;
exports.requestDummyRevision = requestDummyRevision;
exports.uploadDummyPreview = uploadDummyPreview;
exports.uploadDummyFinal = uploadDummyFinal;
exports.submitDummyJob = submitDummyJob;
exports.requestDummyAiReview = requestDummyAiReview;
exports.toJobListItem = toJobListItem;
exports.makePreviewFile = makePreviewFile;
exports.makeFinalFile = makeFinalFile;
const domain_schema_1 = require("@/lib/workflow/domain-schema");
const DUMMY_CLIENT_ID = "user_123";
const DUMMY_FREELANCER_ID = "freelancer_123";
const DEFAULT_ESCROW_CURRENCY = "ETH";
const seedTimestamp = "2026-05-08T00:00:00.000Z";
const seedJobs = [
    parseJob({
        id: "job_123",
        contractId: "contract_job_123",
        title: "Create a logo",
        description: "Need a simple coffee shop logo",
        budget: 100,
        deadline: "2026-06-01",
        requirements: "Include a coffee cup and warm colors",
        status: "ai_reviewed",
        createdBy: DUMMY_CLIENT_ID,
        assignedTo: DUMMY_FREELANCER_ID,
        sourceFiles: [
            {
                id: "file_source_123",
                url: "https://dummy-filestore.com/source-logo-brief.png",
                filename: "source-logo-brief.png",
            },
        ],
        previewFile: {
            id: "file_preview_123",
            url: "https://dummy-filestore.com/preview.png",
            filename: "preview.png",
        },
        finalFile: {
            id: "file_final_123",
            url: "https://dummy-filestore.com/final.zip",
            filename: "final.zip",
        },
        aiReview: {
            id: "review_123",
            verdict: "pass",
            score: 0.87,
            summary: "The delivery mostly satisfies the job requirements.",
            issues: ["Source file is missing"],
        },
        createdAt: seedTimestamp,
        updatedAt: seedTimestamp,
    }),
    parseJob({
        id: "job_456",
        contractId: "contract_job_456",
        title: "Build a landing page",
        description: "Need a basic landing page for a startup",
        budget: 250,
        deadline: "2026-06-10",
        requirements: "Create a responsive landing page with a hero and contact form",
        status: "in_progress",
        createdBy: "user_456",
        assignedTo: DUMMY_FREELANCER_ID,
        sourceFiles: [
            {
                id: "file_source_456",
                url: "https://dummy-filestore.com/source-wireframe.png",
                filename: "source-wireframe.png",
            },
        ],
        previewFile: null,
        finalFile: null,
        aiReview: null,
        createdAt: seedTimestamp,
        updatedAt: seedTimestamp,
    }),
    parseJob({
        id: "job_789",
        contractId: "contract_job_789",
        title: "Write product copy",
        description: "Need concise copy for a productivity app",
        budget: 80,
        deadline: "2026-06-15",
        requirements: "Write headline, subheadline, and three feature blurbs",
        status: "open",
        createdBy: DUMMY_CLIENT_ID,
        assignedTo: null,
        sourceFiles: [
            {
                id: "file_source_789",
                url: "https://dummy-filestore.com/source-copy-brief.pdf",
                filename: "source-copy-brief.pdf",
            },
        ],
        previewFile: null,
        finalFile: null,
        aiReview: null,
        createdAt: seedTimestamp,
        updatedAt: seedTimestamp,
    }),
];
const seedContracts = [
    parseContract({
        id: "contract_job_123",
        jobId: "job_123",
        clientId: DUMMY_CLIENT_ID,
        freelancerId: DUMMY_FREELANCER_ID,
        amount: 100,
        currency: DEFAULT_ESCROW_CURRENCY,
        status: "released",
        fundedAt: seedTimestamp,
        releasedAt: seedTimestamp,
        cancelledAt: null,
        transactionHash: "0xmockreleased123",
        createdAt: seedTimestamp,
        updatedAt: seedTimestamp,
    }),
    parseContract({
        id: "contract_job_456",
        jobId: "job_456",
        clientId: "user_456",
        freelancerId: DUMMY_FREELANCER_ID,
        amount: 250,
        currency: DEFAULT_ESCROW_CURRENCY,
        status: "locked",
        fundedAt: seedTimestamp,
        releasedAt: null,
        cancelledAt: null,
        transactionHash: "0xmocklocked456",
        createdAt: seedTimestamp,
        updatedAt: seedTimestamp,
    }),
    parseContract({
        id: "contract_job_789",
        jobId: "job_789",
        clientId: DUMMY_CLIENT_ID,
        freelancerId: null,
        amount: 80,
        currency: DEFAULT_ESCROW_CURRENCY,
        status: "funded",
        fundedAt: seedTimestamp,
        releasedAt: null,
        cancelledAt: null,
        transactionHash: "0xmockfunded789",
        createdAt: seedTimestamp,
        updatedAt: seedTimestamp,
    }),
];
const store = createSeededStore();
function resetDummyStoreForTests() {
    const nextStore = createSeededStore();
    store.jobs = nextStore.jobs;
    store.contracts = nextStore.contracts;
    store.nextJobNumber = nextStore.nextJobNumber;
}
function listDummyJobs() {
    return Array.from(store.jobs.values()).map(cloneRecord);
}
function listDummyEscrowContracts() {
    return Array.from(store.contracts.values()).map(cloneRecord);
}
function listCurrentUserDummyJobs() {
    return listDummyJobs().filter((job) => job.createdBy === DUMMY_CLIENT_ID);
}
function listFreelancerDummyJobs() {
    return listDummyJobs().filter((job) => job.assignedTo === DUMMY_FREELANCER_ID);
}
function listAvailableDummyJobs() {
    return listDummyJobs().filter((job) => job.status === "open" && job.assignedTo === null);
}
function getDummyJob(jobId) {
    const job = store.jobs.get(jobId);
    return job ? cloneRecord(job) : null;
}
function getDummyEscrowContract(contractId) {
    const contract = store.contracts.get(contractId);
    return contract ? cloneRecord(contract) : null;
}
function getDummyEscrowContractForJob(jobId) {
    const job = store.jobs.get(jobId);
    return job ? getDummyEscrowContract(job.contractId) : null;
}
function getDummyJobWithContract(jobId) {
    const job = getDummyJob(jobId);
    if (!job) {
        return null;
    }
    const contract = getDummyEscrowContract(job.contractId);
    return contract ? { job, contract } : null;
}
function createDummyJob(input = {}) {
    const parsedInput = domain_schema_1.CreateJobInputSchema.parse(input);
    const now = new Date().toISOString();
    const id = parsedInput.id ?? `job_new_${store.nextJobNumber++}`;
    const contractId = parsedInput.contractId ?? `contract_${id}`;
    const job = parseJob({
        id,
        contractId,
        title: parsedInput.title ?? "New dummy job",
        description: parsedInput.description ?? "This is a stubbed job creation response.",
        budget: parsedInput.budget ?? 150,
        deadline: parsedInput.deadline ?? "2026-06-30",
        requirements: parsedInput.requirements ?? "Dummy requirements for frontend integration.",
        status: parsedInput.status ?? "open",
        createdBy: parsedInput.createdBy ?? DUMMY_CLIENT_ID,
        assignedTo: parsedInput.assignedTo ?? null,
        sourceFiles: parsedInput.sourceFiles ?? [makeSourceFile(id)],
        previewFile: parsedInput.previewFile ?? null,
        finalFile: parsedInput.finalFile ?? null,
        aiReview: parsedInput.aiReview ?? null,
        createdAt: now,
        updatedAt: now,
    });
    const contract = parseContract({
        id: contractId,
        jobId: id,
        clientId: job.createdBy,
        freelancerId: job.assignedTo,
        amount: parsedInput.escrow?.amount ?? job.budget,
        currency: parsedInput.escrow?.currency ?? DEFAULT_ESCROW_CURRENCY,
        status: parsedInput.escrow?.status ?? getInitialEscrowStatus(job),
        fundedAt: parsedInput.escrow?.fundedAt ?? now,
        releasedAt: parsedInput.escrow?.releasedAt ?? null,
        cancelledAt: parsedInput.escrow?.cancelledAt ?? null,
        transactionHash: parsedInput.escrow?.transactionHash ?? `0xmock${id}`,
        createdAt: now,
        updatedAt: now,
    });
    store.jobs.set(job.id, cloneRecord(job));
    store.contracts.set(contract.id, cloneRecord(contract));
    return {
        ...cloneRecord(job),
        contract: cloneRecord(contract),
        message: "Job created successfully",
    };
}
function updateDummyJob(jobId, updates) {
    const job = store.jobs.get(jobId);
    if (!job) {
        return null;
    }
    const parsedUpdates = domain_schema_1.UpdateJobInputSchema.parse(updates);
    const nextJob = parseJob({
        ...job,
        ...parsedUpdates,
        updatedAt: new Date().toISOString(),
    });
    store.jobs.set(jobId, cloneRecord(nextJob));
    return cloneRecord(nextJob);
}
function acceptDummyJob(jobId) {
    const job = updateDummyJob(jobId, {
        status: "in_progress",
        assignedTo: DUMMY_FREELANCER_ID,
    });
    if (!job) {
        return null;
    }
    updateDummyContract(job.contractId, {
        freelancerId: DUMMY_FREELANCER_ID,
        status: "locked",
    });
    return {
        id: job.id,
        status: job.status,
        assignedTo: job.assignedTo,
        contract: getDummyEscrowContract(job.contractId),
        message: "Job accepted by freelancer",
    };
}
function completeDummyJob(jobId) {
    const job = updateDummyJob(jobId, { status: "completed" });
    if (!job) {
        return null;
    }
    const contract = updateDummyContract(job.contractId, {
        status: "released",
        releasedAt: new Date().toISOString(),
    });
    return {
        id: job.id,
        status: job.status,
        contract,
        message: "Job accepted successfully",
    };
}
function requestDummyRevision(jobId) {
    const job = updateDummyJob(jobId, { status: "revision_requested" });
    return job
        ? {
            id: job.id,
            status: job.status,
            contract: getDummyEscrowContract(job.contractId),
            message: "Revision requested successfully",
        }
        : null;
}
function uploadDummyPreview(jobId) {
    const job = store.jobs.get(jobId);
    if (!job) {
        return null;
    }
    const previewFile = makePreviewFile(jobId);
    const updatedJob = updateDummyJob(jobId, {
        status: "in_progress",
        previewFile,
    });
    return updatedJob
        ? {
            id: updatedJob.id,
            status: updatedJob.status,
            previewFile: updatedJob.previewFile,
            userVisiblePreview: updatedJob.previewFile,
            sourceFiles: updatedJob.sourceFiles,
            contract: getDummyEscrowContract(updatedJob.contractId),
            message: "Preview uploaded successfully and is visible to the client",
        }
        : null;
}
function uploadDummyFinal(jobId) {
    const job = store.jobs.get(jobId);
    if (!job) {
        return null;
    }
    const previewFile = job.previewFile ?? makePreviewFile(jobId);
    const finalFile = makeFinalFile(jobId);
    const updatedJob = updateDummyJob(jobId, {
        status: "in_progress",
        previewFile,
        finalFile,
    });
    return updatedJob
        ? {
            id: updatedJob.id,
            status: updatedJob.status,
            previewFile: updatedJob.previewFile,
            userVisiblePreview: updatedJob.previewFile,
            finalFile: updatedJob.finalFile,
            sourceFiles: updatedJob.sourceFiles,
            contract: getDummyEscrowContract(updatedJob.contractId),
            message: "Final delivery uploaded successfully",
        }
        : null;
}
function submitDummyJob(jobId) {
    const job = store.jobs.get(jobId);
    if (!job) {
        return null;
    }
    const previewFile = job.previewFile ?? makePreviewFile(jobId);
    const finalFile = job.finalFile ?? makeFinalFile(jobId);
    const updatedJob = updateDummyJob(jobId, {
        status: "submitted",
        previewFile,
        finalFile,
    });
    if (!updatedJob) {
        return null;
    }
    const contract = updateDummyContract(updatedJob.contractId, {
        status: "release_requested",
    });
    return {
        id: updatedJob.id,
        status: updatedJob.status,
        sourceFiles: updatedJob.sourceFiles,
        previewFile: updatedJob.previewFile,
        finalFile: updatedJob.finalFile,
        userVisiblePreview: updatedJob.previewFile,
        reviewInputs: {
            sourceFiles: updatedJob.sourceFiles,
            previewFile: updatedJob.previewFile,
        },
        contract,
        message: "Job submitted for client and AI review",
    };
}
function requestDummyAiReview(jobId) {
    const job = store.jobs.get(jobId);
    if (!job) {
        return null;
    }
    const previewFile = job.previewFile ?? makePreviewFile(jobId);
    const aiReview = makeAiReview(jobId);
    const updatedJob = updateDummyJob(jobId, {
        status: "ai_reviewed",
        previewFile,
        aiReview,
    });
    return updatedJob
        ? {
            jobId: updatedJob.id,
            status: updatedJob.status,
            reviewInputs: {
                sourceFiles: updatedJob.sourceFiles,
                previewFile: updatedJob.previewFile,
            },
            aiReview: updatedJob.aiReview,
            contract: getDummyEscrowContract(updatedJob.contractId),
            message: "AI review completed successfully",
        }
        : null;
}
function toJobListItem(job) {
    return {
        id: job.id,
        contractId: job.contractId,
        title: job.title,
        description: job.description,
        budget: job.budget,
        deadline: job.deadline,
        status: job.status,
        createdBy: job.createdBy,
        assignedTo: job.assignedTo,
        updatedAt: job.updatedAt,
    };
}
function makePreviewFile(jobId) {
    return {
        id: `file_preview_${jobId}`,
        url: "https://dummy-filestore.com/preview.png",
        filename: "preview.png",
    };
}
function makeFinalFile(jobId) {
    return {
        id: `file_final_${jobId}`,
        url: "https://dummy-filestore.com/final.zip",
        filename: "final.zip",
    };
}
function createSeededStore() {
    return {
        jobs: new Map(seedJobs.map((job) => [job.id, cloneRecord(parseJob(job))])),
        contracts: new Map(seedContracts.map((contract) => [
            contract.id,
            cloneRecord(parseContract(contract)),
        ])),
        nextJobNumber: 1,
    };
}
function updateDummyContract(contractId, updates) {
    const contract = store.contracts.get(contractId);
    if (!contract) {
        return null;
    }
    const nextContract = parseContract({
        ...contract,
        ...updates,
        updatedAt: new Date().toISOString(),
    });
    store.contracts.set(contractId, cloneRecord(nextContract));
    return cloneRecord(nextContract);
}
function getInitialEscrowStatus(job) {
    if (job.status === "open") {
        return "funded";
    }
    if (job.status === "completed") {
        return "released";
    }
    return "locked";
}
function makeSourceFile(jobId) {
    return {
        id: `file_source_${jobId}`,
        url: "https://dummy-filestore.com/source-brief.pdf",
        filename: "source-brief.pdf",
    };
}
function makeAiReview(jobId) {
    return {
        id: `review_${jobId}`,
        verdict: "pass",
        score: 0.87,
        summary: "The delivery mostly satisfies the job requirements.",
        issues: ["Source file is missing"],
    };
}
function parseJob(value) {
    return domain_schema_1.JobSchema.parse(value);
}
function parseContract(value) {
    return domain_schema_1.EscrowContractSchema.parse(value);
}
function cloneRecord(value) {
    return structuredClone(value);
}
