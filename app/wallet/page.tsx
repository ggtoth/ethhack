import Link from "next/link";

const steps = ["Connect", "Create", "Accept", "Proof", "Review"];

export default function WalletPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-4 py-10 font-mono text-[var(--text-primary)] sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-[860px]">
        <div className="flex flex-wrap gap-2 text-[12px] font-black uppercase text-[var(--text-muted)]">
          {steps.map((step, index) => (
            <span
              className={`rounded-full border px-3 py-2 ${
                index === 0
                  ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                  : "border-[var(--border)]"
              }`}
              key={step}
            >
              {index + 1}. {step}
            </span>
          ))}
        </div>

        <div className="mt-8 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-8">
          <p className="text-[13px] font-black uppercase text-[var(--text-muted)]">
            Wallet login
          </p>
          <h1 className="mt-3 text-[42px] font-black leading-none sm:text-[62px]">
            Connect
            <br />
            MetaMask
          </h1>

          <div className="mt-8 grid gap-3 rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[13px] text-[var(--text-muted)]">Status</span>
              <span className="text-[14px] font-black text-[var(--success)]">Connected</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[13px] text-[var(--text-muted)]">Wallet</span>
              <span className="break-all text-right text-[14px] font-black">0xA71...9F2</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[13px] text-[var(--text-muted)]">Network</span>
              <span className="text-[14px] font-black">Sepolia</span>
            </div>
          </div>

          <Link
            className="mt-6 inline-flex h-[50px] w-full items-center justify-center rounded-[10px] bg-[var(--button)] px-6 text-[15px] font-black text-[var(--button-text)] transition hover:bg-[var(--accent-hover)] sm:w-auto"
            href="/post-job"
          >
            Create job
          </Link>
        </div>
      </section>
    </main>
  );
}
