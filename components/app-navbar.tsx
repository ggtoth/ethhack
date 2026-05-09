"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/", label: "Start" },
  { href: "/wallet", label: "Wallet" },
  { href: "/post-job", label: "Create" },
  { href: "/browse-jobs", label: "Jobs" },
  { href: "/submit-work", label: "Proof" },
  { href: "/ai-review", label: "Review" },
  { href: "/profile", label: "Profile" },
];

export function AppNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[color-mix(in_srgb,var(--background)_94%,transparent)] font-mono backdrop-blur">
      <nav className="mx-auto flex min-h-[76px] w-full max-w-[1900px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          className="group flex h-[58px] w-[74px] items-center justify-start"
          href="/"
          onClick={() => setOpen(false)}
          aria-label="Home"
        >
          <span className="relative block h-[42px] w-[62px] -rotate-[34deg] rounded-[3px] border-2 border-[var(--text-primary)] opacity-85 transition group-hover:opacity-100">
            <span className="absolute -left-[3px] top-2 h-2 w-1 rounded-r-sm bg-[var(--background)]" />
            <span className="absolute -left-[3px] bottom-2 h-2 w-1 rounded-r-sm bg-[var(--background)]" />
            <span className="absolute -right-[3px] top-2 h-2 w-1 rounded-l-sm bg-[var(--background)]" />
            <span className="absolute -right-[3px] bottom-2 h-2 w-1 rounded-l-sm bg-[var(--background)]" />
            <span className="absolute inset-[6px] rounded-[2px] border border-[var(--text-primary)]" />
            <span className="absolute left-[23px] top-[11px] block h-[20px] w-[7px] rounded-full bg-[var(--text-primary)]" />
            <span className="absolute left-[32px] top-[15px] block h-[12px] w-[7px] rounded-full bg-[var(--text-primary)]" />
          </span>
        </Link>

        <div className="hidden items-center gap-5 lg:flex xl:gap-7">
          <ThemeToggle />
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                className={`text-[14px] font-black uppercase tracking-normal transition ${
                  active
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-primary)] hover:text-[var(--text-muted)]"
                }`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <ThemeToggle />
          <button
            aria-expanded={open}
            aria-label="Toggle navigation"
            className="grid h-10 w-10 place-items-center rounded-[9px] border border-[var(--border-strong)] bg-[var(--surface)] text-[18px] font-black text-[var(--text-primary)]"
            type="button"
            onClick={() => setOpen((current) => !current)}
          >
            {open ? "x" : "="}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-y border-[var(--border)] bg-[var(--background)] px-4 py-3 lg:hidden">
          <div className="mx-auto grid max-w-[480px] grid-cols-2 gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  className={`rounded-[9px] border px-3 py-3 text-center text-[12px] font-black uppercase ${
                    active
                      ? "border-[var(--border-strong)] bg-[var(--surface-strong)] text-[var(--text-primary)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
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
