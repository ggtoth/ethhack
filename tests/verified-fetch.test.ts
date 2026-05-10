/**
 * verified-fetch tests
 *
 * Unit tests (no network): construct CAC bytes in memory, verify, tamper → verified: false.
 * Live integration tests: hit bzz.limo, guarded by SKIP_LIVE_TESTS=1 env var.
 *
 * Run unit tests only:
 *   SKIP_LIVE_TESTS=1 npm test
 *
 * Run everything (requires internet):
 *   npm test
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, test, before } from "node:test";

import { SwarmKV } from "@/lib/swarm/swarm-kv-lib";
import {
  verifiedFetch,
  verifiedFetchFeed,
  verifiedFetchFile,
  verifyRawChunk,
  verifyChunkTree,
  computeCACReference,
  feedIndexToBytes,
  parseFeedIndexHex,
} from "@/lib/swarm/verified-fetch";

const GATEWAY = "https://bzz.limo";
const DEV_PRIVATE_KEY = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const NULL_STAMP = "0000000000000000000000000000000000000000000000000000000000000000";
const SKIP_LIVE = process.env.SKIP_LIVE_TESTS === "1";

// ─── test helpers ────────────────────────────────────────────────────────────

/** Build a valid CAC chunk (span LE-uint64 + payload) and compute its address. */
function makeCAC(payloadText: string): { raw: Uint8Array; reference: string } {
  const payload = new TextEncoder().encode(payloadText);
  const span = new Uint8Array(8);
  let len = payload.length;
  for (let i = 0; i < 8; i++) {
    span[i] = len & 0xff;
    len = Math.floor(len / 256);
  }
  const raw = new Uint8Array(8 + payload.length);
  raw.set(span, 0);
  raw.set(payload, 8);
  const reference = computeCACReference(raw);
  return { raw, reference };
}

/**
 * Derive the Swarm feed topic for a given key using SwarmKV's formula:
 * topic = SHA-256(key) as 64-char hex.
 */
function keyToTopicHex(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// ─── unit tests — no network ─────────────────────────────────────────────────

describe("verifyRawChunk — tamper detection (unit, no network)", () => {
  test("correctly built CAC chunk verifies as true", () => {
    const { raw, reference } = makeCAC("hello swarm");
    const result = verifyRawChunk(raw, reference);
    assert.equal(result.chunkType, "CAC");
    assert.equal(result.verified, true, "valid chunk must verify");
  });

  test("single payload byte flip → verified: false", () => {
    const { raw, reference } = makeCAC("hello swarm");
    raw[9] ^= 0x01;  // flip one bit in the payload region
    const result = verifyRawChunk(raw, reference);
    assert.equal(result.verified, false, "tampered payload must fail verification");
  });

  test("span tampering → verified: false", () => {
    const { raw, reference } = makeCAC("hello swarm");
    raw[0] ^= 0xff;  // corrupt the first span byte
    const result = verifyRawChunk(raw, reference);
    assert.equal(result.verified, false, "tampered span must fail verification");
  });

  test("wrong reference → verified: false", () => {
    const { raw } = makeCAC("hello swarm");
    const wrongRef = "b".repeat(64);
    const result = verifyRawChunk(raw, wrongRef);
    assert.equal(result.verified, false, "wrong reference must fail verification");
  });

  test("correct chunk with different reference → verified: false", () => {
    const { raw: raw1 } = makeCAC("chunk one");
    const { reference: ref2 } = makeCAC("chunk two");
    const result = verifyRawChunk(raw1, ref2);
    assert.equal(result.verified, false, "bytes from one chunk must not verify against another's reference");
  });
});

describe("feedIndexToBytes / parseFeedIndexHex — unit tests", () => {
  function roundtrip(index: number) {
    const bytes = feedIndexToBytes(index);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return parseFeedIndexHex(hex);
  }

  test("feed index 0 roundtrips to 0", () => {
    assert.equal(roundtrip(0), 0);
    assert.deepEqual(feedIndexToBytes(0), new Uint8Array(8));
  });

  test("feed index 1 roundtrips to 1", () => {
    assert.equal(roundtrip(1), 1);
  });

  test("feed index 255 roundtrips to 255", () => {
    assert.equal(roundtrip(255), 255);
  });

  test("feed index 65535 roundtrips to 65535", () => {
    assert.equal(roundtrip(65535), 65535);
  });

  test("feed index is big-endian (index 1 encodes as 0x0000000000000001)", () => {
    const bytes = feedIndexToBytes(1);
    // All bytes except the last should be 0
    for (let i = 0; i < 7; i++) {
      assert.equal(bytes[i], 0, `byte ${i} should be 0`);
    }
    assert.equal(bytes[7], 1, "last byte should be 1");
  });

  test("parseFeedIndexHex handles 16-char hex from swarm-feed-index header", () => {
    assert.equal(parseFeedIndexHex("0000000000000000"), 0);
    assert.equal(parseFeedIndexHex("0000000000000001"), 1);
    assert.equal(parseFeedIndexHex("00000000000000ff"), 255);
  });
});

// ─── multi-chunk tree unit tests (no network) ────────────────────────────────

/** Build a leaf CAC chunk from raw data bytes. */
function makeLeafCAC(data: Uint8Array): { raw: Uint8Array; reference: string } {
  const span = new Uint8Array(8);
  let len = data.length;
  for (let i = 0; i < 8; i++) { span[i] = len & 0xff; len = Math.floor(len / 256); }
  const raw = new Uint8Array(8 + data.length);
  raw.set(span, 0);
  raw.set(data, 8);
  return { raw, reference: computeCACReference(raw) };
}

/** Build an intermediate CAC chunk whose payload is child references. */
function makeIntermediateCAC(
  children: Array<{ reference: string }>,
  totalSpan: number,
): { raw: Uint8Array; reference: string } {
  const payload = new Uint8Array(children.length * 32);
  for (let i = 0; i < children.length; i++) {
    const ref = children[i].reference;
    for (let j = 0; j < 32; j++) {
      payload[i * 32 + j] = parseInt(ref.slice(j * 2, j * 2 + 2), 16);
    }
  }
  const span = new Uint8Array(8);
  let s = totalSpan;
  for (let i = 0; i < 8; i++) { span[i] = s & 0xff; s = Math.floor(s / 256); }
  const raw = new Uint8Array(8 + payload.length);
  raw.set(span, 0);
  raw.set(payload, 8);
  return { raw, reference: computeCACReference(raw) };
}

/** Build an in-memory chunk store fetcher from a reference → raw map. */
function mockFetcher(store: Map<string, Uint8Array>) {
  return async (ref: string): Promise<Uint8Array> => {
    const chunk = store.get(ref);
    if (!chunk) throw new Error(`Mock chunk store: not found: ${ref}`);
    return chunk;
  };
}

describe("verifyChunkTree — multi-chunk unit tests (no network)", () => {
  // 2-leaf tree: leaf1 (4096 bytes) + leaf2 (100 bytes) = 4196 bytes total
  const leaf1Data = new Uint8Array(4096).fill(0xaa);
  const leaf2Data = new Uint8Array(100).fill(0xbb);
  const leaf1 = makeLeafCAC(leaf1Data);
  const leaf2 = makeLeafCAC(leaf2Data);
  const root = makeIntermediateCAC([leaf1, leaf2], 4096 + 100);

  const store = new Map([
    [root.reference, root.raw],
    [leaf1.reference, leaf1.raw],
    [leaf2.reference, leaf2.raw],
  ]);

  test("assembles 2-leaf tree into correct file content", async () => {
    const result = await verifyChunkTree(mockFetcher(store), root.reference);
    assert.equal(result.data.length, 4196);
    assert.equal(result.chunkCount, 3);
    assert.ok(result.data.slice(0, 4096).every((b) => b === 0xaa), "leaf1 data correct");
    assert.ok(result.data.slice(4096).every((b) => b === 0xbb), "leaf2 data correct");
  });

  test("all chunks verified on a valid tree", async () => {
    const result = await verifyChunkTree(mockFetcher(store), root.reference);
    assert.equal(result.allVerified, true);
  });

  test("leaf payload tamper → allVerified: false", async () => {
    const tamperedLeaf2 = new Uint8Array(leaf2.raw);
    tamperedLeaf2[9] ^= 0x01; // flip one payload byte
    const tamperedStore = new Map(store);
    tamperedStore.set(leaf2.reference, tamperedLeaf2);
    const result = await verifyChunkTree(mockFetcher(tamperedStore), root.reference);
    assert.equal(result.allVerified, false, "tampered leaf must fail verification");
  });

  test("root span tamper → allVerified: false (span is protected by BMT)", async () => {
    // Flip a span byte — BMT covers span too, so the hash won't match the reference.
    // We tamper the span (not the child refs) so child fetches still succeed.
    const tamperedRoot = new Uint8Array(root.raw);
    tamperedRoot[3] ^= 0x01; // flip one byte of the LE span field
    const tamperedStore = new Map(store);
    tamperedStore.set(root.reference, tamperedRoot);
    const result = await verifyChunkTree(mockFetcher(tamperedStore), root.reference);
    assert.equal(result.allVerified, false, "tampered root span must fail verification");
  });

  test("single-chunk file (span ≤ 4096) works as a leaf", async () => {
    const leaf = makeLeafCAC(new Uint8Array(42).fill(0xff));
    const singleStore = new Map([[leaf.reference, leaf.raw]]);
    const result = await verifyChunkTree(mockFetcher(singleStore), leaf.reference);
    assert.equal(result.data.length, 42);
    assert.equal(result.chunkCount, 1);
    assert.equal(result.allVerified, true);
    assert.ok(result.data.every((b) => b === 0xff));
  });
});

// ─── live integration tests ───────────────────────────────────────────────────

describe("verifiedFetch — live CAC tests", { skip: SKIP_LIVE }, () => {
  let dataReference = "";
  let feedReference = "";
  let ownerAddress = "";

  before(async () => {
    const kv = new SwarmKV({
      privateKey: DEV_PRIVATE_KEY,
      beeApiUrl: GATEWAY,
      stamp: NULL_STAMP,
      gatewayUrl: GATEWAY,
    });

    const result = await kv.put("verified-fetch:test-key", {
      hello: "swarm",
      ts: Date.now(),
    });

    dataReference = result.dataReference;
    feedReference = result.feedReference;
    ownerAddress = kv.ownerAddress;
  });

  test("verifiedFetch identifies a CAC chunk correctly", async () => {
    const result = await verifiedFetch(GATEWAY, dataReference);
    assert.equal(result.chunkType, "CAC");
  });

  test("CAC chunk is cryptographically verified (BMT hash matches reference)", async () => {
    const result = await verifiedFetch(GATEWAY, dataReference);
    assert.equal(result.verified, true, "BMT hash must match the reference");
  });

  test("CAC chunk returns the stored JSON content", async () => {
    const result = await verifiedFetch(GATEWAY, dataReference);
    assert.ok(result.json !== null, "parsed JSON must not be null");
    const json = result.json as Record<string, unknown>;
    assert.equal(json.hello, "swarm");
  });

  test("CAC chunk owner is null (immutable content has no signer)", async () => {
    const result = await verifiedFetch(GATEWAY, dataReference);
    assert.equal(result.owner, null);
    assert.equal(result.identifier, null);
  });

  test("verifiedFetch identifies a SOC (feed) chunk correctly", async () => {
    const result = await verifiedFetch(GATEWAY, feedReference);
    assert.equal(result.chunkType, "SOC");
  });

  test("SOC chunk signature is cryptographically verified (ECDSA recovery)", async () => {
    const result = await verifiedFetch(GATEWAY, feedReference);
    assert.equal(result.verified, true, "ECDSA signature recovery must match SOC address");
  });

  test("SOC chunk recovers the correct owner address", async () => {
    const result = await verifiedFetch(GATEWAY, feedReference);
    assert.ok(result.owner !== null, "owner must not be null for SOC");
    assert.equal(
      result.owner!.toLowerCase(),
      ownerAddress.toLowerCase(),
      "recovered owner must match the private key's Ethereum address",
    );
  });

  test("SOC chunk contains a payload reference pointing to the data chunk", async () => {
    const result = await verifiedFetch(GATEWAY, feedReference);
    assert.ok(result.socPayloadReference !== null, "payload reference must not be null");
    assert.equal(
      result.socPayloadReference,
      dataReference,
      "SOC payload reference must equal the data reference we uploaded",
    );
  });

  test("verifiedFetch throws for a nonexistent reference", async () => {
    await assert.rejects(
      () => verifiedFetch(GATEWAY, "a".repeat(64)),
      (err: Error) => {
        assert.ok(err.message.length > 0);
        return true;
      },
    );
  });

  test("verifiedFetchFile verifies the same single-chunk CAC as verifiedFetch", async () => {
    const result = await verifiedFetchFile(GATEWAY, dataReference);
    assert.equal(result.verified, true);
    assert.equal(result.chunkCount, 1);
    assert.ok(result.json !== null);
    const json = result.json as Record<string, unknown>;
    assert.equal(json.hello, "swarm");
  });
});

describe("verifiedFetchFeed — live feed verification tests", { skip: SKIP_LIVE }, () => {
  let dataReference = "";
  let ownerAddress = "";
  const testKey = "verified-fetch:feed-test-key";
  const topicHex = keyToTopicHex(testKey);

  before(async () => {
    const kv = new SwarmKV({
      privateKey: DEV_PRIVATE_KEY,
      beeApiUrl: GATEWAY,
      stamp: NULL_STAMP,
      gatewayUrl: GATEWAY,
    });

    const result = await kv.put(testKey, { hello: "feed-verify", ts: Date.now() });
    dataReference = result.dataReference;
    ownerAddress = kv.ownerAddress;
  });

  test("verifiedFetchFeed returns verified: true for a freshly uploaded feed", async () => {
    const result = await verifiedFetchFeed(GATEWAY, ownerAddress, topicHex);
    assert.equal(result.verified, true, "verified must be true for a valid feed");
  });

  test("signature is valid", async () => {
    const result = await verifiedFetchFeed(GATEWAY, ownerAddress, topicHex);
    assert.equal(result.signatureValid, true);
  });

  test("recovered owner matches declared owner", async () => {
    const result = await verifiedFetchFeed(GATEWAY, ownerAddress, topicHex);
    assert.equal(result.ownerMatches, true);
    assert.equal(
      result.owner.toLowerCase(),
      ownerAddress.toLowerCase(),
    );
  });

  test("identifier matches keccak256(topic ‖ feedIndex)", async () => {
    const result = await verifiedFetchFeed(GATEWAY, ownerAddress, topicHex);
    assert.equal(result.identifierMatches, true);
  });

  test("dataReference points to the uploaded content chunk", async () => {
    const result = await verifiedFetchFeed(GATEWAY, ownerAddress, topicHex);
    assert.equal(
      result.dataReference,
      dataReference,
      "feed must point to the data we just uploaded",
    );
  });

  test("topic field matches the input topic", async () => {
    const result = await verifiedFetchFeed(GATEWAY, ownerAddress, topicHex);
    assert.equal(result.topic, topicHex);
  });

  test("feedIndex is a non-negative integer", async () => {
    const result = await verifiedFetchFeed(GATEWAY, ownerAddress, topicHex);
    assert.ok(Number.isInteger(result.feedIndex), "feedIndex must be an integer");
    assert.ok(result.feedIndex >= 0, "feedIndex must be non-negative");
  });

  test("identifier field is a 64-char hex string", async () => {
    const result = await verifiedFetchFeed(GATEWAY, ownerAddress, topicHex);
    assert.match(result.identifier, /^[0-9a-f]{64}$/, "identifier must be 64-char lowercase hex");
  });

  test("verifiedFetchFeed throws for an unknown owner/topic combination", async () => {
    const unknownOwner = "0x" + "de".repeat(20);
    await assert.rejects(
      () => verifiedFetchFeed(GATEWAY, unknownOwner, topicHex),
      (err: Error) => {
        assert.ok(err.message.length > 0);
        return true;
      },
    );
  });
});
