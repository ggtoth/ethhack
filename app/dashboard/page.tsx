import { DashboardStatsCard } from "@/components/marketplace/dashboard-stat-card";
import { JobCard } from "@/components/marketplace/job-card";
import { PageHeader } from "@/components/page-header";
import { dashboardStats, jobs } from "@/lib/marketplace-data";

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="Dashboard"
        title="Operational overview for escrow jobs."
        description="Track active jobs, submitted work, pending AI reviews, locked escrow, received payments, and disputes from one place."
      />
      <section className="mx-auto grid w-full max-w-[1180px] gap-4 px-4 pb-8 sm:px-6 md:grid-cols-5 lg:px-8">
        {dashboardStats.map((stat) => (
          <DashboardStatsCard {...stat} key={stat.label} />
        ))}
      </section>
      <section className="mx-auto grid w-full max-w-[1180px] gap-4 px-4 pb-12 sm:px-6 lg:px-8">
        <JobCard job={jobs[0]} />
      </section>
    </main>
  );
}
