import { PageHeader } from "@/components/page-header";

const transactions = [
  ["Escrow locked", "0.42 ETH", "Landing page implementation"],
  ["Incoming payment", "0.18 ETH", "Wallet copy draft"],
  ["Payment released", "0.31 ETH", "Mobile onboarding screens"],
];

export default function WalletPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="Wallet"
        title="Wallet and escrow balances."
        description="Wallet connection, balances, locked funds, incoming payments, and transaction history are prepared for Web3 integration."
      />
      <section className="mx-auto grid w-full max-w-[1180px] gap-4 px-4 pb-12 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-8">
        <article className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <p className="text-[12px] font-bold uppercase text-[var(--text-muted)]">Connected wallet</p>
          <p className="mt-3 break-all text-[14px] font-bold text-[var(--text-primary)]">0x71f2...8d91</p>
          <p className="mt-6 text-3xl font-bold text-[var(--text-primary)]">2.41 ETH</p>
          <p className="mt-2 text-[13px] text-[var(--text-secondary)]">1.84 ETH locked in escrow</p>
        </article>
        <div className="grid gap-3">
          {transactions.map(([type, amount, detail]) => (
            <article className="grid gap-2 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-[1fr_140px]" key={detail}>
              <div>
                <p className="text-[13px] font-bold text-[var(--text-primary)]">{type}</p>
                <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{detail}</p>
              </div>
              <p className="text-[14px] font-bold text-[var(--text-primary)]">{amount}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
