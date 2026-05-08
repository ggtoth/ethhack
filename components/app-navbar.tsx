"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { navItems } from "@/lib/marketplace-data";

export function AppNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_92%,transparent)] backdrop-blur">
      <nav className="mx-auto flex min-h-16 w-full max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          className="flex items-center gap-3 text-[13px] font-bold text-[var(--text-primary)]"
          href="/"
          onClick={() => setOpen(false)}
        >
          <span className="grid h-8 w-8 place-items-center rounded-[8px] bg-[var(--accent)] text-[11px] text-[var(--accent-contrast)]">
            AI
          </span>
          <span>SmartJobs</span>
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 lg:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                className={`rounded-full px-3 py-2 text-[12px] font-semibold transition ${
                  active
                    ? "bg-[var(--surface-strong)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            aria-expanded={open}
            aria-label="Toggle navigation"
            className="grid h-9 w-9 place-items-center rounded-[8px] border border-[var(--border)] bg-[var(--surface)] text-[18px] font-semibold text-[var(--text-primary)] lg:hidden"
            type="button"
            onClick={() => setOpen((current) => !current)}
          >
            =
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-[var(--border)] bg-[var(--background)] px-4 py-3 lg:hidden">
          <div className="mx-auto grid max-w-[1480px] gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  className={`rounded-[8px] px-3 py-3 text-[13px] font-semibold ${
                    active
                      ? "bg-[var(--surface-strong)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)]"
                  }`}
                  href={item.href}
                  key={item.href}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
