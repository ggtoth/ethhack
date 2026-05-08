import { WalletConnectCard } from "@/components/wallet-connect-card";

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

        <WalletConnectCard />
      </section>
    </main>
  );
}
