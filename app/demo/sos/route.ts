import {
  acceptDummyJob,
  applyDummyEscrowContractAction,
  createDummyJob,
  getDummyEscrowContract,
  getDummyJob,
  getDummyJobWithContract,
  listCurrentUserDummyJobs,
  listDummyJobs,
  requestDummyAiReview,
  submitDummyJob,
} from "@/lib/workflow/dummy-endpoints";

type SosRequest = {
  path?: unknown;
  jobId?: unknown;
};

export async function POST(request: Request) {
  const body = (await readJson(request)) as SosRequest;
  const path = typeof body.path === "string" ? body.path : "/";
  const requestedJobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
  const record = ensureDemoJob(requestedJobId || undefined);
  const jobId = record.job.id;

  if (path === "/" || path === "/workflow") {
    return Response.json({ nextUrl: "/post-job" });
  }

  if (path === "/post-job" || path === "/fund-escrow") {
    ensureFunded(jobId);
    return Response.json({ nextUrl: `/jobs/landing-page-implementation?job=${encodeURIComponent(jobId)}` });
  }

  if (path === "/jobs/landing-page-implementation") {
    ensureFunded(jobId);
    return Response.json({
      nextUrl: `/jobs/landing-page-implementation/accepted?job=${encodeURIComponent(jobId)}`,
    });
  }

  if (path === "/jobs/landing-page-implementation/accepted") {
    ensureFunded(jobId);
    return Response.json({ nextUrl: `/find-job?job=${encodeURIComponent(jobId)}` });
  }

  if (path === "/find-job" || path === "/browse-jobs") {
    ensureAccepted(jobId);
    return Response.json({ nextUrl: `/submit-work?job=${encodeURIComponent(jobId)}` });
  }

  if (path === "/submit-work") {
    ensureReadyForReview(jobId);
    return Response.json({ nextUrl: `/review?job=${encodeURIComponent(jobId)}` });
  }

  if (path === "/review/pending") {
    ensureReadyForReview(jobId);
    return Response.json({ nextUrl: `/review?job=${encodeURIComponent(jobId)}` });
  }

  if (path === "/review" || path === "/ai-review") {
    ensureReleased(jobId);
    return Response.json({ nextUrl: `/review/success?job=${encodeURIComponent(jobId)}` });
  }

  if (path === "/review/success") {
    return Response.json({ nextUrl: "/my-jobs" });
  }

  if (path === "/my-jobs") {
    const nextReviewJob = findCurrentUserReviewJobId();
    return Response.json({
      nextUrl: nextReviewJob
        ? `/review?job=${encodeURIComponent(nextReviewJob)}`
        : `/find-job?job=${encodeURIComponent(jobId)}`,
    });
  }

  return Response.json({ nextUrl: "/post-job" });
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function ensureDemoJob(jobId?: string) {
  const existing = jobId ? getDummyJobWithContract(jobId) : null;

  if (existing) {
    return existing;
  }

  const latest = latestCurrentUserJob();

  if (latest) {
    const record = getDummyJobWithContract(latest.id);

    if (record) {
      return record;
    }
  }

  const created = createDummyJob({
    title: "Demo landing page job",
    description: "Demo fallback job for the Smart Jobs hackathon flow.",
    requirements:
      "Create a clean landing page, submit a preview, and provide the source package for AI review.",
    budget: 0.03,
    deadline: "2026-06-30",
    escrow: {
      status: "funded",
      amount: 0.03,
      transactionHash: "0xsosfunded",
      fundingTransactionHash: "0xsosfunded",
      clientWalletAddress: "0x0000000000000000000000000000000000000abc",
    },
  });
  const record = getDummyJobWithContract(created.id);

  if (!record) {
    throw new Error("Could not create SOS demo job.");
  }

  return record;
}

function latestCurrentUserJob() {
  const jobs = [...listCurrentUserDummyJobs()].sort(compareNewestFirst);

  return (
    jobs.find((job) => {
      const status = getDummyJobWithContract(job.id)?.contract.status;

      return status !== "released" && status !== "refunded" && status !== "cancelled";
    }) ??
    jobs[0] ??
    null
  );
}

function compareNewestFirst(a: { createdAt?: string; updatedAt?: string }, b: { createdAt?: string; updatedAt?: string }) {
  const aTime = Date.parse(a.createdAt ?? a.updatedAt ?? "");
  const bTime = Date.parse(b.createdAt ?? b.updatedAt ?? "");

  return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
}

function ensureFunded(jobId: string) {
  const record = getDummyJobWithContract(jobId);

  if (!record || record.contract.status !== "pending") {
    return;
  }

  applyDummyEscrowContractAction(record.contract.id, {
    action: "fund",
    transactionHash: `0xsosfunded${Date.now()}`,
    clientWalletAddress:
      record.contract.clientWalletAddress ?? "0x0000000000000000000000000000000000000abc",
  });
}

function ensureAccepted(jobId: string) {
  ensureFunded(jobId);

  const record = getDummyJobWithContract(jobId);

  if (!record || record.contract.status !== "funded") {
    return;
  }

  acceptDummyJob(jobId);
}

function ensureReadyForReview(jobId: string) {
  ensureAccepted(jobId);

  const record = getDummyJobWithContract(jobId);

  if (!record) {
    return;
  }

  if (record.contract.status === "locked" || record.job.status === "in_progress") {
    submitDummyJob(jobId, {
      submissionNotes: "SOS demo submission: completed work package for review.",
    });
  }

  requestDummyAiReview(jobId);
}

function ensureReleased(jobId: string) {
  ensureReadyForReview(jobId);

  const record = getDummyJobWithContract(jobId);

  if (!record) {
    return;
  }

  const contract = getDummyEscrowContract(record.contract.id);

  if (contract?.status === "locked" || contract?.status === "release_requested") {
    applyDummyEscrowContractAction(contract.id, {
      action: "release",
      transactionHash: `0xsosrelease${Date.now()}`,
    });
  }
}

function findCurrentUserReviewJobId() {
  return listCurrentUserDummyJobs().find((job) => {
    const record = getDummyJobWithContract(job.id);
    const status = record?.contract.status;

    return status === "release_requested" || job.status === "submitted" || job.status === "ai_reviewed";
  })?.id;
}
