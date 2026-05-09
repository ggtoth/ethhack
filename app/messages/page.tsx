const threads = [
  {
    active: true,
    initials: "BF",
    name: "Bence Farkas",
    preview: "I uploaded the final package.",
    time: "Now",
  },
  {
    active: false,
    initials: "MC",
    name: "Mira Chen",
    preview: "Landing proof is ready for review.",
    time: "12m",
  },
  {
    active: false,
    initials: "SG",
    name: "theserverguy",
    preview: "Thanks for the quick approval.",
    time: "1h",
  },
];

const chat = [
  ["them", "Hey, I finished the mobile landing page and added the source files."],
  ["me", "Looks good. Can you include the responsive screenshots too?"],
  ["them", "Done. I attached the archive and preview link."],
  ["me", "Perfect, submitting it to AI review now."],
];

export default function MessagesPage() {
  return (
    <main className="flex flex-1 bg-[var(--background)] px-4 py-6 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-[980px] gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="message-card self-start rounded-[14px] p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black">Inbox</h1>
            <span className="relative grid h-8 w-8 place-items-center rounded-full bg-[#f45b63] text-[12px] font-black text-white">
              B
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] bg-[#20c878]" />
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            {threads.map((thread) => (
              <article
                className={`rounded-[12px] p-3 ${
                  thread.active
                    ? "bg-[var(--text-primary)] text-[var(--background)]"
                    : "bg-[var(--surface-strong)] text-[var(--text-primary)]"
                }`}
                key={thread.name}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-full text-[12px] font-black ${
                      thread.active
                        ? "bg-[var(--background)] text-[var(--text-primary)]"
                        : "bg-[var(--text-primary)] text-[var(--background)]"
                    }`}
                  >
                    {thread.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13px] font-black">{thread.name}</p>
                      <p className="text-[11px] font-black opacity-60">{thread.time}</p>
                    </div>
                    <p className="mt-1 truncate text-[12px] opacity-70">{thread.preview}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </aside>

        <section className="message-card grid min-h-[560px] grid-rows-[auto_1fr_auto] overflow-hidden rounded-[14px]">
          <header className="flex items-center justify-between border-b border-[var(--border)] p-4">
            <div className="flex items-center gap-3">
              <span className="relative grid h-10 w-10 place-items-center rounded-full bg-[var(--text-primary)] text-[12px] font-black text-[var(--background)]">
                BF
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] bg-[#20c878]" />
              </span>
              <div>
                <p className="font-black">Bence Farkas</p>
                <p className="text-[12px] text-[var(--text-muted)]">Developer online</p>
              </div>
            </div>
            <p className="rounded-full bg-[var(--surface-strong)] px-3 py-1.5 text-[12px] font-black">
              Demo chat
            </p>
          </header>

          <div className="grid content-end gap-3 p-4">
            {chat.map(([side, text]) => (
              <div
                className={`max-w-[76%] rounded-[16px] px-4 py-3 text-[14px] leading-5 ${
                  side === "me"
                    ? "ml-auto bg-[var(--text-primary)] text-[var(--background)]"
                    : "bg-[var(--surface-strong)] text-[var(--text-primary)]"
                }`}
                key={text}
              >
                {text}
              </div>
            ))}
          </div>

          <footer className="border-t border-[var(--border)] p-4">
            <div className="flex items-center gap-2 rounded-full bg-[var(--surface-strong)] px-4 py-3 text-[13px] text-[var(--text-muted)]">
              <span className="h-2 w-2 rounded-full bg-[#20c878]" />
              Type a message to the developer...
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
          linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.58)),
          color-mix(in srgb, var(--surface) 88%, white);
        border: 1px solid rgba(20, 26, 35, 0.08);
        box-shadow:
          0 24px 64px rgba(15, 23, 42, 0.055),
          inset 0 1px 0 rgba(255, 255, 255, 0.72);
      }

      :root[data-theme="dark"] .message-card {
        background:
          linear-gradient(180deg, rgba(32, 36, 43, 0.72), rgba(25, 27, 32, 0.58)),
          var(--surface);
        border-color: var(--border);
      }
    `}</style>
  );
}
