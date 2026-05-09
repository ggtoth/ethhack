"use client";

import { useState } from "react";

const bidModes = [
  {
    id: "fixed",
    title: "Fixed escrow",
    detail: "Client locks one price.",
  },
  {
    id: "open",
    title: "Open bids",
    detail: "Freelancers send offers.",
  },
  {
    id: "dutch",
    title: "Dutch bid",
    detail: "Freelancers can underbid.",
  },
  {
    id: "hybrid",
    title: "Hybrid",
    detail: "Fixed cap + underbids.",
  },
];

export function BidModeSelector() {
  const [selectedModes, setSelectedModes] = useState(["fixed", "hybrid"]);

  function toggleMode(modeId: string) {
    setSelectedModes((current) =>
      current.includes(modeId)
        ? current.filter((selectedMode) => selectedMode !== modeId)
        : [...current, modeId],
    );
  }

  return (
    <div className="mt-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Bid mode</p>
        <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
          {selectedModes.length} selected
        </p>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {bidModes.map((mode) => {
          const active = selectedModes.includes(mode.id);

          return (
            <button
              className={`rounded-[10px] border bg-[var(--surface)] p-2.5 text-left text-[var(--text-primary)] transition ${
                active ? "border-[var(--text-primary)]" : "border-[var(--border)]"
              }`}
              key={mode.id}
              type="button"
              onClick={() => toggleMode(mode.id)}
            >
              <span className="flex items-center gap-2 text-[12px] font-black">
                <span
                  className={`grid h-4 w-4 place-items-center rounded-full border ${
                    active
                      ? "border-[var(--text-primary)] bg-transparent"
                      : "border-[var(--border-strong)] bg-transparent"
                  }`}
                >
                  {active && <span className="h-2 w-2 rounded-full bg-[var(--text-primary)]" />}
                </span>
                <span>{mode.title}</span>
              </span>
              <span className="mt-1 block text-[11px] text-[var(--text-muted)]">
                {mode.detail}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
