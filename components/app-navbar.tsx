"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/", label: "Start" },
  { href: "/post-job", label: "Create" },
  { href: "/find-job", label: "Find a job" },
  { href: "/my-jobs", label: "My jobs" },
  { href: "/profile?view=customer", label: "Client" },
  { href: "/profile?view=freelancer", label: "Freelancer" },
  { href: "/messages", label: "Inbox", badge: "B" },
];

export function AppNavbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

        <div className="hidden items-center gap-4 lg:flex xl:gap-6">
          <ThemeToggle />
          {navItems.map((item) => {
            const active = isActiveNavItem(item.href, pathname, searchParams);

            return (
              <Link
                className={`flex items-center gap-2 text-[13px] font-black uppercase tracking-normal transition ${
                  active
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-primary)] hover:text-[var(--text-muted)]"
                }`}
                href={item.href}
                key={item.href}
              >
                <span>{item.label}</span>
                {"badge" in item && item.badge && (
                  <span className="relative grid h-5 w-5 place-items-center rounded-full bg-[#f45b63] text-[10px] font-black text-white">
                    {item.badge}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-[var(--background)] bg-[#20c878]" />
                  </span>
                )}
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
              const active = isActiveNavItem(item.href, pathname, searchParams);

              return (
                <Link
                  className={`flex items-center justify-center gap-2 rounded-[9px] border px-3 py-3 text-center text-[12px] font-black uppercase ${
                    active
                      ? "border-[var(--border-strong)] bg-[var(--surface-strong)] text-[var(--text-primary)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                  }`}
                  href={item.href}
                  key={item.href}
                  onClick={() => setOpen(false)}
                >
                  <span>{item.label}</span>
                  {"badge" in item && item.badge && (
                    <span className="relative grid h-5 w-5 place-items-center rounded-full bg-[#f45b63] text-[10px] font-black text-white">
                      {item.badge}
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-[var(--surface)] bg-[#20c878]" />
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

function isActiveNavItem(
  href: string,
  pathname: string,
  searchParams: URLSearchParams,
) {
  const [hrefPath, hrefQuery] = href.split("?");

  if (pathname !== hrefPath) {
    return false;
  }

  if (!hrefQuery) {
    return true;
  }

  const expected = new URLSearchParams(hrefQuery);

  for (const [key, value] of expected.entries()) {
    if (searchParams.get(key) !== value) {
      return false;
    }
  }

  return true;
}
