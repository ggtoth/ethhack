import { PageHeader } from "@/components/page-header";

export default function ProfilePage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="Profile"
        title="Role, wallet, skills, and reputation."
        description="Profiles are prepared for client, freelancer, or mixed-role accounts with ratings and work history."
      />
      <section className="mx-auto grid w-full max-w-[960px] gap-4 px-4 pb-12 sm:px-6 md:grid-cols-[280px_1fr] lg:px-8">
        <article className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="grid h-20 w-20 place-items-center rounded-[8px] bg-[var(--accent)] text-2xl font-bold text-[var(--accent-contrast)]">MC</div>
          <h2 className="mt-4 text-xl font-bold text-[var(--text-primary)]">Mira Chen</h2>
          <p className="mt-2 text-[13px] text-[var(--text-secondary)]">Freelancer and client</p>
        </article>
        <article className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["Wallet", "0x71f2...8d91"],
              ["Skills", "Next.js, Tailwind, UX"],
              ["Rating", "4.9 / 5"],
              ["Completed jobs", "24"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[12px] font-bold uppercase text-[var(--text-muted)]">{label}</p>
                <p className="mt-2 text-[14px] font-bold text-[var(--text-primary)]">{value}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
