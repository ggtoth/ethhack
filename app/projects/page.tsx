import { PageHeader } from "@/components/page-header";

const projects = [
  {
    title: "Landing page implementation",
    owner: "Alex",
    amount: "0.42 ETH",
    status: "AI approved",
    score: "87 / 100",
  },
  {
    title: "Checkout preview polish",
    owner: "Mira",
    amount: "0.18 ETH",
    status: "Work submitted",
    score: "Pending",
  },
  {
    title: "Mobile onboarding screens",
    owner: "Noah",
    amount: "0.31 ETH",
    status: "Job posted",
    score: "Not reviewed",
  },
];

export default function ProjectsPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="Projects"
        title="Escrow project states"
        description="A compact operational view for posted jobs, submitted work, AI review status, and release readiness."
      />
      <section className="mx-auto grid w-full max-w-[1120px] gap-4 px-4 pb-12 sm:px-6 lg:px-8">
        {projects.map((project) => (
          <article
            className="grid gap-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] md:grid-cols-[minmax(0,1fr)_140px_120px_120px]"
            key={project.title}
          >
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-[var(--text-primary)]">
                {project.title}
              </h2>
              <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
                Freelancer: {project.owner}
              </p>
            </div>
            <ProjectMetric label="Escrow" value={project.amount} />
            <ProjectMetric label="Status" value={project.status} />
            <ProjectMetric label="Score" value={project.score} />
          </article>
        ))}
      </section>
    </main>
  );
}

function ProjectMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-1 text-[13px] font-bold text-[var(--text-primary)]">
        {value}
      </div>
    </div>
  );
}
