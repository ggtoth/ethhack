import { UsdtPaymentCard } from "@/components/usdt-payment-card";

export default function FundEscrowPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] px-3 py-4 font-mono text-[var(--text-primary)] sm:px-6 sm:py-6 lg:px-8 lg:py-3">
      <section className="mx-auto grid w-full max-w-[860px]">
        <UsdtPaymentCard />
      </section>
    </main>
  );
}
