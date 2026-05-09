import { createSwarmKVFromEnv, isSwarmKVConfigured } from "@/lib/swarm/swarm-kv-lib";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (
      typeof body !== "object" ||
      body === null ||
      !("key" in body) ||
      typeof (body as Record<string, unknown>).key !== "string"
    ) {
      return Response.json({ error: "Request must include 'key' (string)." }, { status: 400 });
    }

    const { key } = body as { key: string };

    if (!isSwarmKVConfigured()) {
      return Response.json(
        { error: "SWARM_KV_PRIVATE_KEY not configured — cannot sign feed deletions." },
        { status: 503 },
      );
    }

    const kv = createSwarmKVFromEnv();
    await kv.delete(key);

    return Response.json({ key, deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Swarm KV delete failed.";

    return Response.json({ error: message }, { status: 500 });
  }
}
