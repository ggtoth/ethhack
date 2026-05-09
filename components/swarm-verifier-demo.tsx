"use client";

import { useState, type FormEvent } from "react";

type DemoState =
  | { status: "idle" }
  | { status: "loading"; label: string }
  | { status: "success"; label: string; payload: unknown }
  | { status: "error"; label: string; message: string };

const examples = [
  {
    label: "Immutable URL",
    description:
      "Use a direct immutable Swarm reference or gateway bytes URL to verify a proof package before release.",
    placeholder: "bzz://<64-hex-reference>",
  },
  {
    label: "Feed URL",
    description:
      "Feed parsing is scaffolded here so we can test future support without forcing feeds into the escrow workflow.",
    placeholder: "swarm-feed://<owner>/<topic>",
  },
  {
    label: "Failure case",
    description:
      "Try a bad reference or mismatched gateway URL to see the explicit failure returned by the verification route.",
    placeholder: "https://gateway.ethswarm.org/bytes/<bad-reference>",
  },
];

export function SwarmVerifierDemo() {
  const [urls, setUrls] = useState<Record<string, string>>({
    "Immutable URL": "",
    "Feed URL": "",
    "Failure case": "",
  });
  const [state, setState] = useState<DemoState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>, label: string) {
    event.preventDefault();
    const url = urls[label]?.trim();

    if (!url) {
      setState({
        status: "error",
        label,
        message: "Enter a URL before running the demo.",
      });
      return;
    }

    setState({ status: "loading", label });

    try {
      const response = await fetch("/api/swarm/verify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Verification failed.");
      }

      setState({ status: "success", label, payload });
    } catch (error) {
      setState({
        status: "error",
        label,
        message: error instanceof Error ? error.message : "Verification failed.",
      });
    }
  }

  return (
    <section className="mx-auto grid w-full max-w-[1180px] gap-5 px-4 pb-12 sm:px-6 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-3">
        {examples.map((example) => (
          <form
            className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]"
            key={example.label}
            onSubmit={(event) => handleSubmit(event, example.label)}
          >
            <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
              {example.label}
            </p>
            <p className="mt-3 text-[14px] leading-6 text-[var(--text-secondary)]">
              {example.description}
            </p>
            <input
              className="mt-4 h-12 w-full rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-4 text-[14px] outline-none"
              placeholder={example.placeholder}
              value={urls[example.label] ?? ""}
              onChange={(event) =>
                setUrls((current) => ({
                  ...current,
                  [example.label]: event.target.value,
                }))
              }
            />
            <button
              className="mt-4 inline-flex h-[46px] w-full items-center justify-center rounded-[10px] bg-[var(--button)] px-4 text-[14px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)]"
              type="submit"
            >
              Run verification
            </button>
          </form>
        ))}
      </div>

      <section className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
        <p className="text-[11px] font-black uppercase text-[var(--text-muted)]">
          Latest result
        </p>
        <div className="mt-4 rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] p-4">
          {state.status === "idle" && (
            <p className="text-[14px] leading-6 text-[var(--text-secondary)]">
              Run one of the demo checks above to inspect the verification response.
            </p>
          )}

          {state.status === "loading" && (
            <p className="text-[14px] leading-6 text-[var(--text-primary)]">
              Checking {state.label}...
            </p>
          )}

          {state.status === "error" && (
            <div className="grid gap-2">
              <p className="text-[14px] font-black text-rose-300">{state.label}</p>
              <p className="text-[14px] leading-6 text-rose-200">{state.message}</p>
            </div>
          )}

          {state.status === "success" && (
            <div className="grid gap-2">
              <p className="text-[14px] font-black text-[var(--text-primary)]">
                {state.label}
              </p>
              <pre className="overflow-auto text-[12px] leading-5 text-[var(--text-secondary)]">
                {JSON.stringify(state.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
