export type DummyJobStatus =
  | "open"
  | "in_progress"
  | "submitted"
  | "ai_reviewed"
  | "completed"
  | "revision_requested"
  | "cancelled";

export type DummyFile = {
  id: string;
  url: string;
  filename: string;
};

export type DummyAiReview = {
  id: string;
  verdict: "pass" | "needs_revision" | "fail";
  score: number;
  summary: string;
  issues: string[];
};

export type DummyJob = {
  id: string;
  contractId: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  requirements: string;
  status: DummyJobStatus;
  createdBy: string;
  assignedTo: string | null;
  sourceFiles: DummyFile[];
  previewFile: DummyFile | null;
  finalFile: DummyFile | null;
  aiReview: DummyAiReview | null;
};

export const dummyJobs: DummyJob[] = [
  {
    id: "job_123",
    contractId: "contract_job_123",
    title: "Create a logo",
    description: "Need a simple coffee shop logo",
    budget: 100,
    deadline: "2026-06-01",
    requirements: "Include a coffee cup and warm colors",
    status: "ai_reviewed",
    createdBy: "user_123",
    assignedTo: "freelancer_123",
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
  },
  {
    id: "job_456",
    contractId: "contract_job_456",
    title: "Build a landing page",
    description: "Need a basic landing page for a startup",
    budget: 250,
    deadline: "2026-06-10",
    requirements: "Create a responsive landing page with a hero and contact form",
    status: "in_progress",
    createdBy: "user_456",
    assignedTo: "freelancer_123",
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
  },
  {
    id: "job_789",
    contractId: "contract_job_789",
    title: "Write product copy",
    description: "Need concise copy for a productivity app",
    budget: 80,
    deadline: "2026-06-15",
    requirements: "Write headline, subheadline, and three feature blurbs",
    status: "open",
    createdBy: "user_123",
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
  },
];

export function getDummyJob(jobId: string) {
  return dummyJobs.find((job) => job.id === jobId) ?? makeFallbackJob(jobId);
}

export function toJobListItem(job: DummyJob) {
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
  };
}

export function makeCreatedJob(input: Partial<DummyJob> = {}) {
  return {
    ...makeFallbackJob("job_new_123"),
    contractId: input.contractId ?? "contract_job_new_123",
    title: input.title ?? "New dummy job",
    description: input.description ?? "This is a stubbed job creation response.",
    budget: input.budget ?? 150,
    deadline: input.deadline ?? "2026-06-30",
    requirements: input.requirements ?? "Dummy requirements for frontend integration.",
    status: "open" as const,
    createdBy: input.createdBy ?? "user_123",
    assignedTo: null,
    sourceFiles: [
      {
        id: "file_source_job_new_123",
        url: "https://dummy-filestore.com/source-brief.pdf",
        filename: "source-brief.pdf",
      },
    ],
    message: "Job created successfully",
  };
}

export function makePreviewFile(jobId: string): DummyFile {
  return {
    id: `file_preview_${jobId}`,
    url: "https://dummy-filestore.com/preview.png",
    filename: "preview.png",
  };
}

export function makeFinalFile(jobId: string): DummyFile {
  return {
    id: `file_final_${jobId}`,
    url: "https://dummy-filestore.com/final.zip",
    filename: "final.zip",
  };
}

export function makeAiReview(jobId: string): DummyAiReview {
  return {
    id: `review_${jobId}`,
    verdict: "pass",
    score: 0.87,
    summary: "The delivery mostly satisfies the job requirements.",
    issues: ["Source file is missing"],
  };
}

function makeFallbackJob(jobId: string): DummyJob {
  return {
    id: jobId,
    contractId: `contract_${jobId}`,
    title: "Create a logo",
    description: "Need a simple coffee shop logo",
    budget: 100,
    deadline: "2026-06-01",
    requirements: "Include a coffee cup and warm colors",
    status: "open",
    createdBy: "user_123",
    assignedTo: null,
    sourceFiles: [
      {
        id: `file_source_${jobId}`,
        url: "https://dummy-filestore.com/source-brief.pdf",
        filename: "source-brief.pdf",
      },
    ],
    previewFile: null,
    finalFile: null,
    aiReview: null,
  };
}
