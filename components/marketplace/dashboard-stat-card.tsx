export function DashboardStatsCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <p className="text-[12px] font-bold uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-3xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="mt-2 text-[13px] text-[var(--text-secondary)]">{detail}</p>
    </article>
  );
}
