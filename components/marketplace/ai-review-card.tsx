import { aiReview } from "@/lib/marketplace-data";

export function AIReviewCard() {
  return (
    <article className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold uppercase text-[var(--text-muted)]">AI review</p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {aiReview.recommendation}
          </h2>
        </div>
        <div className="rounded-[8px] bg-[var(--ai-bg)] px-4 py-3 text-center">
          <p className="text-3xl font-bold text-[var(--ai)]">{aiReview.score}</p>
          <p className="text-[11px] font-bold uppercase text-[var(--text-muted)]">Score</p>
        </div>
      </div>
      <p className="mt-4 text-[14px] leading-6 text-[var(--text-secondary)]">
        {aiReview.summary}
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <ReviewList title="Matched" items={aiReview.matched} />
        <ReviewList title="Missing" items={aiReview.missing} />
        <ReviewList title="Risk flags" items={aiReview.risks} />
      </div>
    </article>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
      <h3 className="text-[13px] font-bold text-[var(--text-primary)]">{title}</h3>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li className="text-[13px] leading-5 text-[var(--text-secondary)]" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
