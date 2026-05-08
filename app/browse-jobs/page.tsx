import { JobCard } from "@/components/marketplace/job-card";
import { PageHeader } from "@/components/page-header";
import { jobs } from "@/lib/marketplace-data";

export default function BrowseJobsPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="Browse Jobs"
        title="Find crypto-paid freelance work."
        description="Dummy marketplace data with filters prepared for category, budget, deadline, skill, and status."
      />
      <section className="mx-auto grid w-full max-w-[1180px] gap-4 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-5">
          {["Category", "Budget", "Deadline", "Skill", "Status"].map((filter) => (
            <div
              className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-[13px] font-bold text-[var(--text-secondary)]"
              key={filter}
            >
              {filter}
            </div>
          ))}
        </div>
        {jobs.map((job) => (
          <JobCard job={job} key={job.id} />
        ))}
      </section>
    </main>
  );
}
