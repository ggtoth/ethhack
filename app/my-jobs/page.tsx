import { JobCard } from "@/components/marketplace/job-card";
import { PageHeader } from "@/components/page-header";
import { jobs } from "@/lib/marketplace-data";

const tabs = ["Open", "In Progress", "Submitted", "Completed", "Disputed"];

export default function MyJobsPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="My Jobs"
        title="Client and freelancer work queues."
        description="Tabs are prepared for the full job lifecycle and role-aware job lists."
      />
      <section className="mx-auto grid w-full max-w-[1180px] gap-4 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              className="h-9 rounded-[8px] border border-[var(--border)] px-4 text-[12px] font-bold text-[var(--text-secondary)] first:bg-[var(--surface-strong)] first:text-[var(--text-primary)]"
              key={tab}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
        {jobs.map((job) => (
          <JobCard job={job} key={job.id} />
        ))}
      </section>
    </main>
  );
}
