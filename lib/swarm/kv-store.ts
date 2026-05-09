import { uploadJson, downloadJson, isBeeNodeConfigured } from "./bee-client";
import { getSwarmKvEntry, setSwarmKvEntry } from "@/lib/workflow/dummy-endpoints";
import type { SwarmKvEntry } from "./types";

export type { SwarmKvEntry };

export async function swarmKvSet(
  key: string,
  value: unknown,
): Promise<SwarmKvEntry> {
  if (!isBeeNodeConfigured()) {
    return mockKvEntry(key);
  }

  const { reference, url } = await uploadJson(value);
  const entry: SwarmKvEntry = {
    key,
    reference,
    url,
    storedAt: new Date().toISOString(),
  };

  setSwarmKvEntry(key, entry);

  return entry;
}

export async function swarmKvGet(key: string): Promise<{ entry: SwarmKvEntry; data: unknown } | null> {
  const entry = getSwarmKvEntry(key);

  if (!entry) {
    return null;
  }

  if (!isBeeNodeConfigured()) {
    return { entry, data: null };
  }

  const data = await downloadJson(entry.reference);

  return { entry, data };
}

function mockKvEntry(key: string): SwarmKvEntry {
  const fakeRef = Array.from(
    { length: 64 },
    (_, i) => ((key.charCodeAt(i % key.length) + i) % 16).toString(16),
  ).join("");

  return {
    key,
    reference: fakeRef,
    url: `https://gateway.ethswarm.org/bzz/${fakeRef}`,
    storedAt: new Date().toISOString(),
  };
}
