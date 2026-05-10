"use client";

import { useEffect, useRef, useState } from "react";

type EnsResult = { name: string | null; avatar: string | null };
type Message = { side: "me" | "them"; text: string; time: string };

const ensCache = new Map<string, EnsResult>();

function useEns(address: string) {
  const [result, setResult] = useState<EnsResult>(
    () => ensCache.get(address) ?? { name: null, avatar: null },
  );
  useEffect(() => {
    if (!address?.startsWith("0x")) return;
    if (ensCache.has(address)) { setResult(ensCache.get(address)!); return; }
    fetch(`/api/ens/${address}`)
      .then((r) => r.json())
      .then((data: EnsResult) => { ensCache.set(address, data); setResult(data); })
      .catch(() => {});
  }, [address]);
  return result;
}

function now() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const THREADS = [
  {
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    fallbackName: "vitalik.eth",
    logo: null,
    online: true,
    messages: [
      { side: "them", text: "escrow is live on Sepolia. lockEscrow enforces msg.sender = freelancer.", time: "9:04" },
      { side: "me",   text: "does AI review store to Swarm before release?", time: "9:06" },
      { side: "them", text: "yes — kv.put() after GPT batch. buyer sees the Swarm reference on the review page.", time: "9:07" },
      { side: "me",   text: "perfect. testing full flow now.", time: "9:09" },
      { side: "them", text: "final package uploaded. ready for AI review.", time: "Now" },
    ] as Message[],
  },
  {
    address: "0x3A1b2C4d5E6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B",
    fallbackName: "Jakub Konopka",
    logo: "https://assets.devfolio.co/hackathons/368ad6996207410780b05484ca048cda/judges/0583f7eb7a9849b9abf4c5796c2d12dd/916.jpeg",
    online: true,
    messages: [
      { side: "them", text: "Hey, saw your SmartJobs submission — interesting use of on-chain escrow with AI arbitration. What track are you entering?", time: "10:15" },
      { side: "me",   text: "Network Economy main track + Swarm, ENS, Sourcify, and Umia bounties.", time: "10:18" },
      { side: "them", text: "The AI review angle is compelling. How do you handle disputes if the AI verdict is wrong?", time: "10:20" },
      { side: "me",   text: "Client can reject the AI verdict and escalate — we store the Swarm hash of the reviewed work so there's an immutable audit trail.", time: "10:23" },
      { side: "them", text: "Good. Immutability is key. Make that the centerpiece of your pitch — trustless arbitration, not just automation.", time: "10:25" },
      { side: "me",   text: "Will do. Thanks for the feedback — pitch is at 14:00 tomorrow?", time: "10:26" },
      { side: "them", text: "Yes, slot confirmed. See you there.", time: "10:27" },
    ] as Message[],
  },
  {
    address: "0x9b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0C",
    fallbackName: "Migle Rakitaite",
    logo: "https://assets.devfolio.co/hackathons/368ad6996207410780b05484ca048cda/judges/d9a9a6c8cdc94fa59e40340453d1e7d1/738.jpeg",
    online: false,
    messages: [
      { side: "them", text: "Hi! Migle from Swarm Foundation. I see bee-js in your package.json — what exactly are you storing on Swarm?", time: "8:30" },
      { side: "me",   text: "Two things: AI review verdicts via SwarmKV (Feeds-based KV store), and freelancer work packages via verified-fetch with BMT hash verification.", time: "8:34" },
      { side: "them", text: "verified-fetch client-side? Without a running Bee node?", time: "8:35" },
      { side: "me",   text: "Exactly — we use the public gateway and verify the chunk hash in the browser. No node needed.", time: "8:37" },
      { side: "them", text: "That covers both our bounties — Trust No Gateway ($250) and Simple KV on Swarm ($200). Have you submitted on Devfolio?", time: "8:39" },
      { side: "me",   text: "Submitting now. Both features are live and tested on the demo.", time: "8:40" },
      { side: "them", text: "Great. Come find me at the Swarm booth if you want to walk through the demo together.", time: "8:41" },
    ] as Message[],
  },
  {
    address: "0x4C5d6E7f8A9b0C1d2E3f4A5b6C7d8E9f0A1b2C3d",
    fallbackName: "Kevin",
    logo: "https://assets.devfolio.co/hackathons/368ad6996207410780b05484ca048cda/judges/0aba01bef75a453ba6cd87d2ed267713/761.jpeg",
    online: true,
    messages: [
      { side: "them", text: "Kevin from ENS. Love seeing reverse resolution used across the whole UI — not just the wallet page.", time: "11:10" },
      { side: "me",   text: "Thanks! Everywhere we show an address we resolve to ENS first. Freelancer profiles, job listings, escrow receipts.", time: "11:12" },
      { side: "them", text: "Are you using ENS text records at all? That would unlock AI Agents prize ($2k).", time: "11:14" },
      { side: "me",   text: "Planning to set reviewer.smartjobs.eth with a text record pointing to the Swarm feed of verdicts.", time: "11:16" },
      { side: "them", text: "That's the move. AI agent with an ENS identity + verifiable output on Swarm — very clean.", time: "11:17" },
      { side: "me",   text: "Also thinking freelancers set a 'portfolio' text record → always resolves to their latest Swarm upload.", time: "11:19" },
      { side: "them", text: "Submit under both AI Agents and Most Creative Use. We can only award one, but jury sees the full picture.", time: "11:20" },
    ] as Message[],
  },
  {
    address: "0x7E8f9A0b1C2d3E4f5A6b7C8d9E0f1A2b3C4d5E6f",
    fallbackName: "Manuel Wedler",
    logo: "https://assets.devfolio.co/hackathons/368ad6996207410780b05484ca048cda/judges/6d5b0c0460e140588a45471b4cd22522/891.jpeg",
    online: false,
    messages: [
      { side: "them", text: "Manuel from Sourcify. Is your escrow contract verified? Full match is required for the bounty.", time: "Yesterday" },
      { side: "me",   text: "Not yet — deployed on Sepolia at 0x81dfFC433dcE76dB8915726a476d97E19Af96557. Built with Hardhat.", time: "Yesterday" },
      { side: "them", text: "Run npx hardhat verify and upload the metadata.json to sourcify.dev. Partial match won't count.", time: "Yesterday" },
      { side: "me",   text: "Submitted — metadata + ABI uploaded. Devfolio says Full Match now.", time: "5h" },
      { side: "them", text: "Confirmed on our end. You're eligible for the $4k bounty. Nice work.", time: "4h" },
      { side: "me",   text: "Thanks! Will mention Sourcify verification in the pitch as a trustability argument.", time: "4h" },
      { side: "them", text: "Good call. Verified contracts are a UX signal too — clients can audit the code before paying.", time: "3h" },
    ] as Message[],
  },
  {
    address: "0xB0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9",
    fallbackName: "Moncesco",
    logo: "https://assets.devfolio.co/hackathons/368ad6996207410780b05484ca048cda/judges/294e511f598a4bf696fce18412f3f80a/888.jpeg",
    online: true,
    messages: [
      { side: "them", text: "Moncesco from Umia. $12k Best Agentic Venture bounty. Is your AI reviewer autonomous or scripted?", time: "10:02" },
      { side: "me",   text: "Currently single GPT call. Upgrading to Anthropic tool-use — tools: verify_swarm_upload, check_requirements, store_verdict, release_escrow.", time: "10:06" },
      { side: "them", text: "The release_escrow tool is key — if the agent can trigger on-chain actions itself, that's a full agentic loop.", time: "10:08" },
      { side: "me",   text: "Exactly the plan. Agent fetches work from Swarm, evaluates against requirements, then either releases or flags for human review.", time: "10:10" },
      { side: "them", text: "That's autonomous. Submit under Best Agentic Venture — make sure the demo shows the agent picking tools, not just getting a result.", time: "10:12" },
      { side: "me",   text: "Will log each tool call in the UI. Upgrading the reviewer now.", time: "10:13" },
    ] as Message[],
  },
  {
    address: "0xD1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8D9e0",
    fallbackName: "Filip Rezabek",
    logo: "https://assets.devfolio.co/hackathons/368ad6996207410780b05484ca048cda/judges/c64345c9e3ea4f158077bdcea3115378/470.png",
    online: false,
    messages: [
      { side: "them", text: "Filip from SpaceComputer. $6k prize. What's the financial model behind SmartJobs?", time: "2d" },
      { side: "me",   text: "ETH locked in escrow until AI review passes. No intermediary holds funds — pure smart contract.", time: "2d" },
      { side: "them", text: "Can the locked ETH earn yield while the work is in progress? That's what our composable finance angle targets.", time: "2d" },
      { side: "me",   text: "Could integrate Aave — deposit locked ETH into lending pool, accrue yield, pay freelancer principal, return yield to client.", time: "2d" },
      { side: "them", text: "Yes. That turns idle escrow capital into productive capital. Even a small integration shows you understand DeFi composability.", time: "2d" },
      { side: "me",   text: "Adding Aave deposit/withdraw to the escrow contract. Demo will show yield accrued during a 2-day job.", time: "1d" },
      { side: "them", text: "Strong. Come by our booth Day 1 and we can look at it together before the judging session.", time: "1d" },
    ] as Message[],
  },
  {
    address: "0xF2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1",
    fallbackName: "Jakub Kopecky",
    logo: "https://assets.devfolio.co/hackathons/368ad6996207410780b05484ca048cda/judges/d85ba30d82424208b0e0fe83531a023c/378.png",
    online: false,
    messages: [
      { side: "them", text: "Jakub from Apify. $3.7k bounty — use our Actors to automate real data pipelines. What data does SmartJobs need?", time: "2d" },
      { side: "me",   text: "Market rate data — if a client posts a $50 job that takes 20 hrs, the AI should flag that as under-market.", time: "2d" },
      { side: "them", text: "Perfect use case. Build an Actor that scrapes freelance rate data and feeds it into your AI reviewer as context.", time: "2d" },
      { side: "me",   text: "Building it now — Actor pulls Upwork/Fiverr median rates by category, AI reviewer gets that as extra context.", time: "1d" },
      { side: "them", text: "That's a meaningful integration — real-world data making on-chain decisions smarter. Submit when ready.", time: "1d" },
      { side: "me",   text: "Submitted. Actor is live on Apify platform. Link in the Devfolio description.", time: "6h" },
      { side: "them", text: "Checking it now. Looking good — we'll review before final judging.", time: "5h" },
    ] as Message[],
  },
];

function ThreadAvatar({ address, logo, inverted = false, size = "sm" }: { address: string; logo?: string | null; inverted?: boolean; size?: "sm" | "md" }) {
  const { avatar, name } = useEns(address);
  const dim = size === "md" ? "h-10 w-10" : "h-9 w-9";
  const img = logo ?? avatar;
  return (
    <span className={`relative grid ${dim} shrink-0 place-items-center overflow-hidden rounded-full font-black text-[11px] ${inverted ? "bg-[var(--background)] text-[var(--text-primary)]" : "bg-[var(--text-primary)] text-[var(--background)]"}`}>
      {img
        // eslint-disable-next-line @next/next/no-img-element
        ? <img alt={name ?? address.slice(2, 4)} className="h-full w-full object-cover" src={img} />
        : address.slice(2, 4).toUpperCase()
      }
    </span>
  );
}

function ThreadName({ address, fallback }: { address: string; fallback: string }) {
  const { name } = useEns(address);
  return <>{name ?? fallback}</>;
}

export default function MessagesPage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [allMessages, setAllMessages] = useState(() => THREADS.map((t) => [...t.messages]));
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const active = THREADS[activeIdx];
  const messages = allMessages[activeIdx];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setAllMessages((prev) =>
      prev.map((msgs, i) =>
        i === activeIdx ? [...msgs, { side: "me", text, time: now() }] : msgs,
      ),
    );
    setInput("");
    inputRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <main className="flex flex-1 overflow-hidden bg-[var(--background)] px-4 py-6 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid min-w-0 w-full max-w-[980px] gap-3 lg:grid-cols-[300px_minmax(0,1fr)]">

        {/* Thread list */}
        <aside className="message-card self-start rounded-[14px] p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black">Inbox</h1>
            <span className="relative grid h-8 w-8 place-items-center rounded-full bg-[#f45b63] text-[12px] font-black text-white">
              B
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] bg-[#20c878]" />
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            {THREADS.map((thread, idx) => {
              const isActive = idx === activeIdx;
              const lastMsg = allMessages[idx].at(-1);
              return (
                <button
                  className={`w-full rounded-[12px] p-3 text-left transition-colors ${
                    isActive
                      ? "bg-[var(--text-primary)] text-[var(--background)]"
                      : "bg-[var(--surface-strong)] text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
                  }`}
                  key={thread.address}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                >
                  <div className="flex items-center gap-3">
                    <ThreadAvatar address={thread.address} logo={thread.logo} inverted={isActive} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-black">
                          <ThreadName address={thread.address} fallback={thread.fallbackName} />
                        </p>
                        <p className="text-[11px] font-black opacity-60">{lastMsg?.time ?? ""}</p>
                      </div>
                      <p className="mt-1 truncate text-[12px] opacity-70">
                      {lastMsg ? lastMsg.text.slice(0, 30) + (lastMsg.text.length > 30 ? "…" : "") : ""}
                    </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat panel */}
        <section className="message-card flex h-[620px] min-w-0 flex-col overflow-hidden rounded-[14px]">
          <header className="flex items-center justify-between border-b border-[var(--border)] p-4">
            <div className="flex items-center gap-3">
              <span className="relative">
                <ThreadAvatar address={active.address} logo={active.logo} size="md" />
                {active.online && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] bg-[#20c878]" />
                )}
              </span>
              <div>
                <p className="font-black">
                  <ThreadName address={active.address} fallback={active.fallbackName} />
                </p>
                <p className="text-[12px] text-[var(--text-muted)]">
                  {shortAddress(active.address)} · {active.online ? "online" : "offline"}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1.5 text-[11px] font-black uppercase text-[var(--text-muted)]">
              SmartJobs
            </span>
          </header>

          {/* Messages */}
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-end gap-2 ${msg.side === "me" ? "flex-row-reverse" : ""}`}
              >
                {msg.side === "them" && (
                  <ThreadAvatar address={active.address} logo={active.logo} size="sm" />
                )}
                <div className="flex max-w-[72%] flex-col gap-1">
                  <div
                    className={`rounded-[16px] px-4 py-3 text-[14px] leading-[1.5] ${
                      msg.side === "me"
                        ? "bg-[var(--text-primary)] text-[var(--background)]"
                        : "bg-[var(--surface-strong)] text-[var(--text-primary)]"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p className={`text-[10px] text-[var(--text-muted)] ${msg.side === "me" ? "text-right" : ""}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <footer className="border-t border-[var(--border)] p-3">
            <div className="flex items-end gap-2 rounded-[14px] bg-[var(--surface-strong)] px-4 py-3">
              <textarea
                ref={inputRef}
                className="flex-1 resize-none bg-transparent text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                placeholder="Type a message... (Enter to send)"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKey}
              />
              <button
                className="shrink-0 rounded-[10px] bg-[var(--text-primary)] px-4 py-2 text-[12px] font-black text-[var(--background)] transition-opacity disabled:opacity-30"
                disabled={!input.trim()}
                type="button"
                onClick={send}
              >
                Send
              </button>
            </div>
          </footer>
        </section>
      </section>

      <MessagesStyles />
    </main>
  );
}

function MessagesStyles() {
  return (
    <style>{`
      .message-card {
        background:
          linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.58)),
          color-mix(in srgb, var(--surface) 88%, white);
        border: 1px solid rgba(20,26,35,0.08);
        box-shadow: 0 24px 64px rgba(15,23,42,0.055), inset 0 1px 0 rgba(255,255,255,0.72);
      }
      :root[data-theme="dark"] .message-card {
        background:
          linear-gradient(180deg, rgba(32,36,43,0.72), rgba(25,27,32,0.58)),
          var(--surface);
        border-color: var(--border);
      }
    `}</style>
  );
}
