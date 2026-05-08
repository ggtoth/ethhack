import { PageHeader } from "@/components/page-header";

const messages = [
  ["Client", "Please confirm the pricing spacing before final approval."],
  ["Freelancer", "Updated spacing and added notes to the handoff."],
  ["AI", "Latest submission now matches 4 of 5 tracked requirements."],
];

export default function MessagesPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="Messages"
        title="Job-linked communication."
        description="A prepared message thread for client-freelancer chat, file sharing, and AI review context."
      />
      <section className="mx-auto grid w-full max-w-[860px] gap-3 px-4 pb-12 sm:px-6 lg:px-8">
        {messages.map(([sender, message]) => (
          <article className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]" key={message}>
            <p className="text-[12px] font-bold uppercase text-[var(--text-muted)]">{sender}</p>
            <p className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">{message}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
