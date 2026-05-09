import { createSwarmKVFromEnv, isSwarmKVConfigured } from "@/lib/swarm/swarm-kv-lib";
import { swarmKvSet } from "@/lib/swarm/kv-store";
import { updateDummyJob, getDummyJobWithContract } from "@/lib/workflow/dummy-endpoints";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (!isValidSetInput(body)) {
      return Response.json(
        { error: "Request must include 'key' (string) and 'value' (object)." },
        { status: 400 },
      );
    }

    const { key, value, jobId } = body;

    let result: {
      key: string;
      dataReference?: string;
      feedReference?: string;
      manifestReference?: string;
      reference?: string;
      url: string;
      manifestUrl?: string;
    };

    if (isSwarmKVConfigured()) {
      // Full Swarm Feeds-backed KV store
      const kv = createSwarmKVFromEnv();
      const putResult = await kv.put(key, value as string | object);

      // Also keep in-memory index for fast listing
      await swarmKvSet(key, value);

      result = {
        key: putResult.key,
        dataReference: putResult.dataReference,
        feedReference: putResult.feedReference,
        manifestReference: putResult.manifestReference,
        reference: putResult.dataReference,
        url: putResult.url,
        manifestUrl: putResult.manifestUrl,
      };
    } else {
      // Fallback: plain Swarm bytes (no Feeds)
      const entry = await swarmKvSet(key, value);

      result = { key, reference: entry.reference, url: entry.url };
    }

    if (jobId) {
      patchJobSwarmRef(jobId as string, key, result.dataReference ?? result.reference ?? "");
    }

    return Response.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Swarm KV set failed.";

    return Response.json({ error: message }, { status: 500 });
  }
}

function isValidSetInput(
  body: unknown,
): body is { key: string; value: unknown; jobId?: string } {
  return (
    typeof body === "object" &&
    body !== null &&
    "key" in body &&
    typeof (body as Record<string, unknown>).key === "string" &&
    (body as Record<string, unknown>).key !== "" &&
    "value" in body
  );
}

function patchJobSwarmRef(jobId: string, key: string, reference: string) {
  const record = getDummyJobWithContract(jobId);

  if (!record) return;

  const currentRefs = record.job.swarmRefs ?? {};
  let nextRefs = currentRefs;

  if (key.includes(":metadata")) {
    nextRefs = { ...currentRefs, metadata: reference };
  } else if (key.includes(":deliverable")) {
    nextRefs = { ...currentRefs, deliverable: reference };
  } else if (key.includes(":review")) {
    nextRefs = { ...currentRefs, review: reference };
  }

  updateDummyJob(jobId, { swarmRefs: nextRefs });
}
