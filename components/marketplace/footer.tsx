import Link from "next/link";

const links = ["About", "Docs", "Privacy", "Terms", "Contact", "Social"];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p className="text-[13px] font-bold text-[var(--text-primary)]">SmartJobs</p>
        <div className="flex flex-wrap gap-4">
          {links.map((link) => (
            <Link
              className="text-[12px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              href={link === "Docs" ? "/how-it-works" : "/settings"}
              key={link}
            >
              {link}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
