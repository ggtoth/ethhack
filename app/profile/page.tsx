import Link from "next/link";

import { ProfileIdentityCard } from "@/components/profile-identity-card";

const history = [
  ["Wallet connected", "Done"],
  ["Job created", "Done"],
  ["Escrow funded", "Done"],
  ["Job accepted", "Current"],
  ["Proof submitted", "Next"],
  ["AI reviewed", "Pending"],
  ["Payment released", "Pending"],
];

const topics = ["Web Design", "Landing Page", "Frontend"];

export default function ProfilePage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-4 py-8 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-[980px]">
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
          <ProfileIdentityCard />

          <div className="mt-4 flex gap-2 border-b border-[var(--border)] pb-4">
            {["Jobs", "Activity", "Bids"].map((tab, index) => (
              <span
                className={`rounded-full border px-4 py-2 text-[12px] font-black ${
                  index === 0
                    ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--background)]"
                    : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-primary)]"
                }`}
                key={tab}
              >
                {tab}
              </span>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
            <article className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase text-[var(--success)]">Active job</p>
                  <h2 className="mt-2 text-[26px] font-black leading-none">Landing page design</h2>
                </div>
                <div className="rounded-[12px] bg-[var(--text-primary)] px-4 py-3 text-[var(--background)]">
                  <p className="text-[11px] font-black uppercase opacity-65">Escrow</p>
                  <p className="mt-1 text-[20px] font-black leading-none">1,500 USDT</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <span
                    className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12px] font-black"
                    key={topic}
                  >
                    {topic}
                  </span>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["Status", "Accepted"],
                  ["Bid mode", "Fixed + Hybrid"],
                  ["Next", "Submit proof"],
                ].map(([label, value]) => (
                  <div
                    className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-4"
                    key={label}
                  >
                    <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">{label}</p>
                    <p className="mt-2 text-[14px] font-black">{value}</p>
                  </div>
                ))}
              </div>

              <Link
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[12px] bg-[var(--button)] px-6 text-[13px] font-black text-[var(--button-text)] sm:w-auto"
                href="/submit-work"
              >
                Submit proof
              </Link>
            </article>

            <aside className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
              <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Activity</p>
              <div className="mt-4 grid gap-2">
                {history.map(([label, status], index) => (
                  <div
                    className="grid grid-cols-[26px_1fr_auto] items-center gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
                    key={label}
                  >
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-black ${
                        status === "Done"
                          ? "bg-[var(--text-primary)] text-[var(--background)]"
                          : status === "Current"
                            ? "border border-[var(--text-primary)] text-[var(--text-primary)]"
                            : "border border-[var(--border-strong)] text-[var(--text-muted)]"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-[12px] font-black">{label}</span>
                    <span className="text-[10px] font-black uppercase text-[var(--text-muted)]">{status}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
