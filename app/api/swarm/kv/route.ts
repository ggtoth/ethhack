import { createSwarmKVFromEnv, isSwarmKVConfigured } from "@/lib/swarm/swarm-kv-lib";
import { listSwarmKvEntries } from "@/lib/workflow/dummy-endpoints";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (isSwarmKVConfigured()) {
      const kv = createSwarmKVFromEnv();
      const keys = await kv.list();

      return Response.json({
        keys,
        count: keys.length,
        ownerAddress: kv.ownerAddress,
        backend: "swarm-feeds",
      });
    }

    const entries = listSwarmKvEntries();

    return Response.json({
      entries,
      count: entries.length,
      backend: "in-memory",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Swarm KV list failed.";

    return Response.json({ error: message }, { status: 500 });
  }
}
