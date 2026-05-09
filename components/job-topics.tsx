"use client";

import { useState } from "react";

const topics = [
  "Web Design",
  "Landing Page",
  "Frontend",
  "Responsive",
  "No-code",
  "Branding",
  "Bug Fix",
  "Smart Contract",
];

export function JobTopics() {
  const [selectedTopics, setSelectedTopics] = useState(["Web Design", "Landing Page", "Frontend"]);

  function toggleTopic(topic: string) {
    setSelectedTopics((current) =>
      current.includes(topic)
        ? current.filter((selected) => selected !== topic)
        : [...current, topic],
    );
  }

  return (
    <div className="mt-4 rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
      <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">Topics</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {topics.map((topic) => {
          const active = selectedTopics.includes(topic);

          return (
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-black transition ${
                active
                  ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--background)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
              }`}
              key={topic}
            >
              <input
                checked={active}
                className="sr-only"
                type="checkbox"
                onChange={() => toggleTopic(topic)}
              />
              <span>{active ? "✓" : "+"}</span>
              <span>{topic}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
