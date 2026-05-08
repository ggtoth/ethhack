import Link from "next/link";

export default function SubmitWorkPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-4 py-10 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-[860px] rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-8">
        <p className="text-[13px] font-black uppercase text-[var(--text-muted)]">
          5. Submit proof
        </p>
        <h1 className="mt-3 text-[42px] font-black leading-none sm:text-[62px]">
          Proof
          <br />
          package
        </h1>

        <div className="mt-8 grid gap-4">
          <label className="grid gap-2">
            <span className="text-[13px] font-black uppercase text-[var(--text-muted)]">
              Preview
            </span>
            <input
              className="h-12 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-4 text-[15px] outline-none"
              defaultValue="https://demo.app/landing"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[13px] font-black uppercase text-[var(--text-muted)]">
              Source
            </span>
            <input
              className="h-12 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-4 text-[15px] outline-none"
              defaultValue="https://github.com/demo/source"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[13px] font-black uppercase text-[var(--text-muted)]">
              Notes
            </span>
            <textarea
              className="min-h-28 rounded-[10px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-4 py-3 text-[15px] leading-7 outline-none"
              defaultValue="Responsive page completed. Preview and source are attached."
            />
          </label>
        </div>

        <Link
          className="mt-6 inline-flex h-[50px] w-full items-center justify-center rounded-[10px] bg-[var(--button)] px-6 text-[15px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)] sm:w-auto"
          href="/ai-review"
        >
          Submit proof
        </Link>
      </section>
    </main>
  );
}
