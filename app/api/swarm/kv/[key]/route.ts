import { createSwarmKVFromEnv, isSwarmKVConfigured } from "@/lib/swarm/swarm-kv-lib";
import { swarmKvGet } from "@/lib/swarm/kv-store";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/swarm/kv/[key]">,
) {
  try {
    const { key } = await ctx.params;
    const decoded = decodeURIComponent(key);

    if (isSwarmKVConfigured()) {
      const kv = createSwarmKVFromEnv();
      const result = await kv.get(decoded);

      if (!result) {
        return Response.json(
          { error: `No Swarm entry found for key: ${decoded}` },
          { status: 404 },
        );
      }

      return Response.json({
        key: result.key,
        reference: result.dataReference,
        url: result.url,
        data: result.value,
        backend: "swarm-feeds",
      });
    }

    // Fallback: plain bytes KV
    const result = await swarmKvGet(decoded);

    if (!result) {
      return Response.json(
        { error: `No Swarm entry found for key: ${decoded}` },
        { status: 404 },
      );
    }

    return Response.json({
      key: result.entry.key,
      reference: result.entry.reference,
      url: result.entry.url,
      storedAt: result.entry.storedAt,
      data: result.data,
      backend: "swarm-bytes",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Swarm KV get failed.";

    return Response.json({ error: message }, { status: 500 });
  }
}
