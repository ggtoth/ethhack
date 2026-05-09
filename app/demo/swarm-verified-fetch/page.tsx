import { PageHeader } from "@/components/page-header";
import { SwarmVerifierDemo } from "@/components/swarm-verifier-demo";

export const dynamic = "force-dynamic";

export default function SwarmVerifiedFetchDemoPage() {
  return (
    <main className="flex flex-1 flex-col bg-[var(--background)] text-[var(--text-primary)]">
      <PageHeader
        eyebrow="Swarm demo"
        title="Verified fetch workbench."
        description="Exercise the in-repo Swarm verifier against immutable references, feed-shaped inputs, and explicit failure cases before wiring the results into escrow release decisions."
      />
      <SwarmVerifierDemo />
    </main>
  );
}
