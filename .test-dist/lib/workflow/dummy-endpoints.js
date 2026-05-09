"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DummyWorkflowConflictError = void 0;
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
exports.updateDummyEscrowContract = updateDummyEscrowContract;
exports.applyDummyEscrowContractAction = applyDummyEscrowContractAction;
exports.confirmDummyOnChainFunding = confirmDummyOnChainFunding;
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
const onchain_escrow_actions_1 = require("@/lib/contracts/onchain-escrow-actions");
const ethereum_1 = require("@/lib/wallet/ethereum");
class DummyWorkflowConflictError extends Error {
    constructor(message) {
        super(message);
        this.name = "DummyWorkflowConflictError";
    }
}
exports.DummyWorkflowConflictError = DummyWorkflowConflictError;
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
        submittedSourceFiles: [
            {
                id: "file_submitted_source_123",
                url: "https://dummy-filestore.com/source-logo-package.zip",
                filename: "source-logo-package.zip",
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
        submissionNotes: "Includes vector source files and export variants.",
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
        submittedSourceFiles: [],
        previewFile: null,
        finalFile: null,
        submissionNotes: null,
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
        submittedSourceFiles: [],
        previewFile: null,
        finalFile: null,
        submissionNotes: null,
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
        clientWalletAddress: "0x0000000000000000000000000000000000000123",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000456",
        amount: 100,
        currency: DEFAULT_ESCROW_CURRENCY,
        status: "released",
        fundedAt: seedTimestamp,
        lockedAt: seedTimestamp,
        releaseRequestedAt: seedTimestamp,
        releasedAt: seedTimestamp,
        disputedAt: null,
        cancelledAt: null,
        transactionHash: "0xmockreleased123",
        chainId: 1,
        escrowAddress: "0x0000000000000000000000000000000000000123",
        fundingTransactionHash: "0xmockfunded123",
        lockTransactionHash: "0xmocklocked123",
        releaseRequestTransactionHash: "0xmockrequest123",
        releaseTransactionHash: "0xmockreleased123",
        refundTransactionHash: null,
        disputeTransactionHash: null,
        cancelTransactionHash: null,
        disputeReason: null,
        createdAt: seedTimestamp,
        updatedAt: seedTimestamp,
    }),
    parseContract({
        id: "contract_job_456",
        jobId: "job_456",
        clientId: "user_456",
        freelancerId: DUMMY_FREELANCER_ID,
        clientWalletAddress: "0x0000000000000000000000000000000000000abc",
        freelancerWalletAddress: "0x0000000000000000000000000000000000000def",
        amount: 250,
        currency: DEFAULT_ESCROW_CURRENCY,
        status: "locked",
        fundedAt: seedTimestamp,
        lockedAt: seedTimestamp,
        releaseRequestedAt: null,
        releasedAt: null,
        disputedAt: null,
        cancelledAt: null,
        transactionHash: "0xmocklocked456",
        chainId: 1,
        escrowAddress: "0x0000000000000000000000000000000000000456",
        fundingTransactionHash: "0xmockfunded456",
        lockTransactionHash: "0xmocklocked456",
        releaseRequestTransactionHash: null,
        releaseTransactionHash: null,
        refundTransactionHash: null,
        disputeTransactionHash: null,
        cancelTransactionHash: null,
        disputeReason: null,
        createdAt: seedTimestamp,
        updatedAt: seedTimestamp,
    }),
    parseContract({
        id: "contract_job_789",
        jobId: "job_789",
        clientId: DUMMY_CLIENT_ID,
        freelancerId: null,
        clientWalletAddress: "0x0000000000000000000000000000000000000789",
        freelancerWalletAddress: null,
        amount: 80,
        currency: DEFAULT_ESCROW_CURRENCY,
        status: "funded",
        fundedAt: seedTimestamp,
        lockedAt: null,
        releaseRequestedAt: null,
        releasedAt: null,
        disputedAt: null,
        cancelledAt: null,
        transactionHash: "0xmockfunded789",
        chainId: 1,
        escrowAddress: "0x0000000000000000000000000000000000000789",
        fundingTransactionHash: "0xmockfunded789",
        lockTransactionHash: null,
        releaseRequestTransactionHash: null,
        releaseTransactionHash: null,
        refundTransactionHash: null,
        disputeTransactionHash: null,
        cancelTransactionHash: null,
        disputeReason: null,
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
        submittedSourceFiles: parsedInput.submittedSourceFiles ?? [],
        previewFile: parsedInput.previewFile ?? null,
        finalFile: parsedInput.finalFile ?? null,
        submissionNotes: parsedInput.submissionNotes ?? null,
        aiReview: parsedInput.aiReview ?? null,
        createdAt: now,
        updatedAt: now,
    });
    const contract = parseContract({
        id: contractId,
        jobId: id,
        clientId: job.createdBy,
        freelancerId: job.assignedTo,
        clientWalletAddress: parsedInput.escrow?.clientWalletAddress ?? null,
        freelancerWalletAddress: parsedInput.escrow?.freelancerWalletAddress ?? null,
        amount: parsedInput.escrow?.amount ?? job.budget,
        currency: parsedInput.escrow?.currency ?? DEFAULT_ESCROW_CURRENCY,
        status: parsedInput.escrow?.status ?? getInitialEscrowStatus(job.status),
        fundedAt: parsedInput.escrow?.fundedAt ?? now,
        lockedAt: parsedInput.escrow?.lockedAt ?? null,
        releaseRequestedAt: parsedInput.escrow?.releaseRequestedAt ?? null,
        releasedAt: parsedInput.escrow?.releasedAt ?? null,
        disputedAt: parsedInput.escrow?.disputedAt ?? null,
        cancelledAt: parsedInput.escrow?.cancelledAt ?? null,
        transactionHash: parsedInput.escrow?.transactionHash ?? `0xmock${id}`,
        chainId: parsedInput.escrow?.chainId ?? 1,
        escrowAddress: parsedInput.escrow?.escrowAddress ??
            `0x${id.replaceAll("_", "").padStart(40, "0").slice(-40)}`,
        fundingTransactionHash: parsedInput.escrow?.fundingTransactionHash ?? `0xmockfunded${id}`,
        lockTransactionHash: parsedInput.escrow?.lockTransactionHash ?? null,
        releaseRequestTransactionHash: parsedInput.escrow?.releaseRequestTransactionHash ?? null,
        releaseTransactionHash: parsedInput.escrow?.releaseTransactionHash ?? null,
        refundTransactionHash: parsedInput.escrow?.refundTransactionHash ?? null,
        disputeTransactionHash: parsedInput.escrow?.disputeTransactionHash ?? null,
        cancelTransactionHash: parsedInput.escrow?.cancelTransactionHash ?? null,
        disputeReason: parsedInput.escrow?.disputeReason ?? null,
        createdAt: now,
        updatedAt: now,
    });
    store.jobs.set(job.id, cloneRecord(job));
    store.contracts.set(contract.id, cloneRecord(contract));
    syncJobAfterContractTransition(contract);
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
function updateDummyEscrowContract(contractId, updates) {
    const parsedUpdates = domain_schema_1.UpdateEscrowContractInputSchema.parse(updates);
    return updateDummyContract(contractId, parsedUpdates);
}
function applyDummyEscrowContractAction(contractId, input) {
    const parsedInput = domain_schema_1.EscrowContractActionInputSchema.parse(input);
    const contract = store.contracts.get(contractId);
    if (!contract) {
        return null;
    }
    const now = new Date().toISOString();
    const nextContract = transitionContract(contract, parsedInput, now);
    store.contracts.set(contractId, cloneRecord(nextContract));
    syncJobAfterContractTransition(nextContract);
    return {
        contract: cloneRecord(nextContract),
        message: getContractActionMessage(parsedInput.action),
    };
}
function confirmDummyOnChainFunding(input) {
    const parsedInput = domain_schema_1.ConfirmOnChainEscrowFundingInputSchema.parse(input);
    const now = new Date().toISOString();
    const configuredEscrowAddress = (0, onchain_escrow_actions_1.getConfiguredEscrowAddress)();
    const amount = parsedInput.escrow?.amount ??
        (parsedInput.amountEth ? Number(parsedInput.amountEth) : undefined) ??
        parsedInput.budget ??
        0;
    return createDummyJob({
        id: parsedInput.id,
        contractId: parsedInput.contractId,
        title: parsedInput.title,
        description: parsedInput.description,
        budget: parsedInput.budget,
        deadline: parsedInput.deadline,
        requirements: parsedInput.requirements,
        status: parsedInput.status ?? "open",
        createdBy: parsedInput.createdBy,
        assignedTo: parsedInput.assignedTo,
        sourceFiles: parsedInput.sourceFiles,
        submittedSourceFiles: parsedInput.submittedSourceFiles,
        previewFile: parsedInput.previewFile,
        finalFile: parsedInput.finalFile,
        submissionNotes: parsedInput.submissionNotes,
        aiReview: parsedInput.aiReview,
        escrow: {
            ...parsedInput.escrow,
            amount,
            currency: parsedInput.escrow?.currency ?? DEFAULT_ESCROW_CURRENCY,
            status: "funded",
            fundedAt: parsedInput.escrow?.fundedAt ?? now,
            transactionHash: parsedInput.transactionHash,
            chainId: parsedInput.chainId ??
                parsedInput.escrow?.chainId ??
                ethereum_1.SEPOLIA_CHAIN_ID_DECIMAL,
            escrowAddress: parsedInput.escrowAddress ??
                parsedInput.escrow?.escrowAddress ??
                configuredEscrowAddress ??
                null,
            fundingTransactionHash: parsedInput.transactionHash,
            clientWalletAddress: parsedInput.clientWalletAddress ??
                parsedInput.escrow?.clientWalletAddress ??
                null,
        },
    });
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
        lockedAt: new Date().toISOString(),
    });
    syncJobAfterContractTransition(store.contracts.get(job.contractId));
    return {
        id: job.id,
        status: getDummyJob(job.id)?.status ?? "in_progress",
        assignedTo: DUMMY_FREELANCER_ID,
        contract: getDummyEscrowContract(job.contractId),
        message: "Job accepted by freelancer",
    };
}
function completeDummyJob(jobId) {
    const job = store.jobs.get(jobId);
    if (!job) {
        return null;
    }
    const result = applyDummyEscrowContractAction(job.contractId, {
        action: "release",
    });
    return {
        id: job.id,
        status: getDummyJob(jobId)?.status ?? "completed",
        contract: result?.contract ?? null,
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
function uploadDummyPreview(jobId, previewFile) {
    const job = store.jobs.get(jobId);
    if (!job) {
        return null;
    }
    const nextPreview = previewFile ?? makePreviewFile(jobId);
    const updatedJob = updateDummyJob(jobId, {
        status: "in_progress",
        previewFile: nextPreview,
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
function uploadDummyFinal(jobId, finalFile) {
    const job = store.jobs.get(jobId);
    if (!job) {
        return null;
    }
    const previewFile = job.previewFile ?? makePreviewFile(jobId);
    const nextFinal = finalFile ?? makeFinalFile(jobId);
    const updatedJob = updateDummyJob(jobId, {
        status: "in_progress",
        previewFile,
        finalFile: nextFinal,
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
function submitDummyJob(jobId, input = {}) {
    const job = store.jobs.get(jobId);
    if (!job) {
        return null;
    }
    const previewFile = input.previewFile ?? job.previewFile ?? makePreviewFile(jobId);
    const submittedSourceFiles = input.submittedSourceFiles && input.submittedSourceFiles.length > 0
        ? input.submittedSourceFiles
        : job.submittedSourceFiles.length > 0
            ? job.submittedSourceFiles
            : [makeFinalFile(jobId)];
    const finalFile = input.finalFile ??
        job.finalFile ??
        submittedSourceFiles[0] ??
        makeFinalFile(jobId);
    const updatedJob = updateDummyJob(jobId, {
        status: "submitted",
        previewFile,
        finalFile,
        submittedSourceFiles,
        submissionNotes: input.submissionNotes ?? job.submissionNotes ?? null,
    });
    if (!updatedJob) {
        return null;
    }
    const contractResult = applyDummyEscrowContractAction(updatedJob.contractId, {
        action: "request_release",
    });
    return {
        id: updatedJob.id,
        status: updatedJob.status,
        sourceFiles: updatedJob.sourceFiles,
        submittedSourceFiles: updatedJob.submittedSourceFiles,
        previewFile: updatedJob.previewFile,
        finalFile: updatedJob.finalFile,
        submissionNotes: updatedJob.submissionNotes,
        userVisiblePreview: updatedJob.previewFile,
        reviewInputs: {
            sourceFiles: updatedJob.submittedSourceFiles,
            previewFile: updatedJob.previewFile,
            finalFile: updatedJob.finalFile,
            submissionNotes: updatedJob.submissionNotes,
        },
        contract: contractResult?.contract ?? getDummyEscrowContract(updatedJob.contractId),
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
                sourceFiles: updatedJob.submittedSourceFiles,
                previewFile: updatedJob.previewFile,
                finalFile: updatedJob.finalFile,
                submissionNotes: updatedJob.submissionNotes,
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
    syncJobAfterContractTransition(nextContract);
    return cloneRecord(nextContract);
}
function transitionContract(contract, input, now) {
    const transactionHash = input.transactionHash ?? contract.transactionHash;
    switch (input.action) {
        case "fund":
            assertContractStatus(contract, ["pending"], input.action);
            return parseContract({
                ...contract,
                status: "funded",
                fundedAt: now,
                transactionHash,
                fundingTransactionHash: transactionHash,
                clientWalletAddress: input.clientWalletAddress ?? contract.clientWalletAddress,
                updatedAt: now,
            });
        case "lock":
            assertContractStatus(contract, ["funded"], input.action);
            return parseContract({
                ...contract,
                freelancerId: input.freelancerId ?? contract.freelancerId,
                freelancerWalletAddress: input.freelancerWalletAddress ?? contract.freelancerWalletAddress,
                status: "locked",
                lockedAt: now,
                transactionHash,
                lockTransactionHash: transactionHash,
                updatedAt: now,
            });
        case "request_release":
            assertContractStatus(contract, ["locked"], input.action);
            return parseContract({
                ...contract,
                status: "release_requested",
                releaseRequestedAt: now,
                transactionHash,
                releaseRequestTransactionHash: transactionHash,
                updatedAt: now,
            });
        case "release":
            assertContractStatus(contract, ["locked", "release_requested"], input.action);
            return parseContract({
                ...contract,
                status: "released",
                releasedAt: now,
                transactionHash,
                releaseTransactionHash: transactionHash,
                updatedAt: now,
            });
        case "refund":
            assertContractStatus(contract, ["funded", "locked", "release_requested", "disputed"], input.action);
            return parseContract({
                ...contract,
                status: "refunded",
                cancelledAt: now,
                transactionHash,
                refundTransactionHash: transactionHash,
                updatedAt: now,
            });
        case "dispute":
            assertContractStatus(contract, ["locked", "release_requested"], input.action);
            return parseContract({
                ...contract,
                status: "disputed",
                disputedAt: now,
                disputeReason: input.disputeReason ?? contract.disputeReason ?? "Dispute opened.",
                transactionHash,
                disputeTransactionHash: transactionHash,
                updatedAt: now,
            });
        case "cancel":
            assertContractStatus(contract, ["pending", "funded"], input.action);
            return parseContract({
                ...contract,
                status: "cancelled",
                cancelledAt: now,
                transactionHash,
                cancelTransactionHash: transactionHash,
                updatedAt: now,
            });
    }
}
function syncJobAfterContractTransition(contract) {
    const job = store.jobs.get(contract.jobId);
    if (!job) {
        return;
    }
    const nextStatus = getJobStatusForContractStatus(contract.status);
    if (job.status === nextStatus) {
        return;
    }
    const nextJob = parseJob({
        ...job,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
    });
    store.jobs.set(job.id, cloneRecord(nextJob));
}
function getJobStatusForContractStatus(status) {
    switch (status) {
        case "funded":
            return "open";
        case "locked":
            return "in_progress";
        case "release_requested":
            return "submitted";
        case "released":
            return "completed";
        case "refunded":
        case "cancelled":
            return "cancelled";
        case "disputed":
            return "disputed";
        case "pending":
            return "open";
    }
}
function assertContractStatus(contract, allowedStatuses, action) {
    if (!allowedStatuses.includes(contract.status)) {
        throw new DummyWorkflowConflictError(`Cannot ${action.replace("_", " ")} an escrow contract with status "${contract.status}".`);
    }
}
function getContractActionMessage(action) {
    switch (action) {
        case "fund":
            return "Escrow contract funded";
        case "lock":
            return "Escrow contract locked for freelancer";
        case "request_release":
            return "Escrow release requested";
        case "release":
            return "Escrow released successfully";
        case "refund":
            return "Escrow refunded successfully";
        case "dispute":
            return "Escrow dispute opened";
        case "cancel":
            return "Escrow contract cancelled";
    }
}
function getInitialEscrowStatus(jobStatus) {
    if (jobStatus === "completed") {
        return "released";
    }
    if (jobStatus === "in_progress" || jobStatus === "submitted") {
        return "locked";
    }
    return "funded";
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
