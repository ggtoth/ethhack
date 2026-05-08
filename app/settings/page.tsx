import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="Settings"
        title="Account, notifications, and wallet settings."
        description="Placeholder settings for the modules that will arrive after the frontend MVP."
      />
      <section className="mx-auto grid w-full max-w-[860px] gap-3 px-4 pb-12 sm:px-6 lg:px-8">
        {["Account settings", "Notification settings", "Wallet settings"].map((item) => (
          <article className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]" key={item}>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{item}</h2>
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              Prepared UI area for future configuration.
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
