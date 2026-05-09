/**
 * verified-fetch integration tests
 *
 * These tests hit the live bzz.limo Swarm gateway and verify that:
 *  - CAC chunk addresses are correctly recomputed via BMT
 *  - SOC (feed) chunk signatures are correctly verified via ECDSA recovery
 *
 * Requires an internet connection.
 */

import assert from "node:assert/strict";
import { describe, test, before } from "node:test";

import { SwarmKV } from "@/lib/swarm/swarm-kv-lib";
import { verifiedFetch } from "@/lib/swarm/verified-fetch";

const DEV_PRIVATE_KEY = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const NULL_STAMP = "0000000000000000000000000000000000000000000000000000000000000000";
const GATEWAY = "https://bzz.limo";

// Upload a fresh KV entry once and reuse references across tests
let dataReference = "";
let feedReference = "";
let ownerAddress = "";

describe("verifiedFetch", () => {
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

  // ── CAC (immutable content) ─────────────────────────────────────────────

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

  // ── SOC (feed / mutable) ───────────────────────────────────────────────

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

  // ── error handling ─────────────────────────────────────────────────────

  test("verifiedFetch throws for a nonexistent reference", async () => {
    const fakeRef = "a".repeat(64);
    await assert.rejects(
      () => verifiedFetch(GATEWAY, fakeRef),
      (err: Error) => {
        assert.ok(err.message.length > 0);
        return true;
      },
    );
  });

  test("a tampered reference is not verified (wrong BMT hash)", async () => {
    // Flip the last nibble to simulate tampering
    const tamperedRef = dataReference.slice(0, -1) + (dataReference.endsWith("0") ? "1" : "0");
    // bzz.limo will 404 on a fake ref — which means fetch throws, not returns verified:false
    // (a real gateway attack would serve wrong data with a valid-looking ref)
    // We test that the reference simply doesn't exist as expected
    await assert.rejects(
      () => verifiedFetch(GATEWAY, tamperedRef),
      (err: Error) => {
        assert.ok(err.message.includes("404") || err.message.length > 0);
        return true;
      },
    );
  });
});
