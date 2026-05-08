import Link from "next/link";
import type { ReactNode } from "react";

export function PreviewCard({
  href,
  title,
  description,
  meta,
  children,
}: {
  href: string;
  title: string;
  description: string;
  meta: string;
  children: ReactNode;
}) {
  return (
    <Link
      className="group flex min-h-[240px] flex-col rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition hover:border-[var(--border-strong)]"
      href={href}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-bold uppercase text-[var(--text-muted)]">
          {meta}
        </span>
        <span className="text-[18px] text-[var(--text-muted)] transition group-hover:translate-x-1">
          -&gt;
        </span>
      </div>
      <div className="mt-5">{children}</div>
      <div className="mt-auto pt-6">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
    </Link>
  );
}
