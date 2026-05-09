/**
 * SwarmKV unit tests — run against the real bzz.limo Swarm gateway.
 *
 * These are integration-style tests: they actually write to and read from
 * the Swarm network. They require a live internet connection.
 *
 * Run: npm test
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { SwarmKV, createSwarmKVFromEnv, isSwarmKVConfigured } from "@/lib/swarm/swarm-kv-lib";

// Throwaway dev key — same one in .env. Never use a funded wallet here.
const DEV_PRIVATE_KEY = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const NULL_STAMP = "0000000000000000000000000000000000000000000000000000000000000000";

function makeKV(): SwarmKV {
  return new SwarmKV({
    privateKey: DEV_PRIVATE_KEY,
    beeApiUrl: "https://bzz.limo",
    stamp: NULL_STAMP,
    gatewayUrl: "https://bzz.limo",
  });
}

// Run sequentially — concurrent puts race on the shared Feed index
describe("SwarmKV", { concurrency: 1 }, () => {
  test("ownerAddress is a valid Ethereum address", () => {
    const kv = makeKV();
    assert.match(kv.ownerAddress, /^0x[0-9a-f]{40}$/i);
  });

  test("put() returns all required reference fields", async () => {
    const kv = makeKV();
    const result = await kv.put("test:put-fields", { hello: "swarm" });

    assert.equal(typeof result.dataReference, "string", "dataReference must be a string");
    assert.equal(result.dataReference.length, 64, "dataReference must be 64 hex chars");

    assert.equal(typeof result.feedReference, "string", "feedReference must be a string");
    assert.equal(result.feedReference.length, 64, "feedReference must be 64 hex chars");

    assert.equal(typeof result.manifestReference, "string", "manifestReference must be a string");
    assert.equal(result.manifestReference.length, 64, "manifestReference must be 64 hex chars");

    assert.ok(result.url.startsWith("https://bzz.limo/bytes/"), "url must use /bytes/ path");
    assert.ok(result.manifestUrl.startsWith("https://bzz.limo/bzz/"), "manifestUrl must use /bzz/ path");
  });

  test("get() retrieves the value written by put()", async () => {
    const kv = makeKV();
    const key = "test:roundtrip";
    const value = { verdict: "MATCH", score: 91, ts: Date.now() };

    await kv.put(key, value);
    const result = await kv.get(key);

    assert.ok(result !== null, "get() must return a result after put()");
    assert.equal(result.key, key);
    assert.deepEqual(result.value, value);
    assert.equal(result.dataReference.length, 64);
  });

  test("get() returns null for a key that was never written", async () => {
    const kv = makeKV();
    const result = await kv.get("test:nonexistent-key-xyz-12345");
    assert.equal(result, null);
  });

  test("put() updates a key — get() returns the latest value", async () => {
    const kv = makeKV();
    const key = "test:update";

    await kv.put(key, { version: 1 });
    await kv.put(key, { version: 2 });

    const result = await kv.get(key);
    assert.ok(result !== null);
    assert.deepEqual(result.value, { version: 2 });
  });

  test("has() returns true for an existing key and false for a missing key", async () => {
    const kv = makeKV();
    await kv.put("test:has-check", "present");

    assert.equal(await kv.has("test:has-check"), true);
    assert.equal(await kv.has("test:has-check-missing-xyz"), false);
  });

  test("list() includes keys that have been put()", async () => {
    const kv = makeKV();
    const key = `test:list-${Date.now()}`;
    await kv.put(key, "listed");

    // list() depends on the index Feed — a separate feed from the per-key feed.
    // The index is eventually consistent: the most recent index write wins, and
    // under concurrent puts the latest write may not yet be visible.
    // We verify with has() (per-key feed, always consistent) as primary proof,
    // and check list() with retries as best-effort.
    const exists = await kv.has(key);
    assert.equal(exists, true, "has() must return true immediately after put()");

    let keys: string[] = [];
    for (let attempt = 0; attempt < 5; attempt++) {
      keys = await kv.list();
      if (keys.includes(key)) break;
      await new Promise((r) => setTimeout(r, 3000));
    }
    assert.ok(keys.includes(key), `list() must include the key '${key}' (eventual consistency)`);
  });

  test("delete() causes get() to return null and has() to return false", async () => {
    const kv = makeKV();
    const key = `test:delete-${Date.now()}`;
    await kv.put(key, "to be deleted");

    assert.equal(await kv.has(key), true);
    await kv.delete(key);
    assert.equal(await kv.get(key), null);
    assert.equal(await kv.has(key), false);
  });

  test("put() stores a string value and get() returns it unchanged", async () => {
    const kv = makeKV();
    const key = "test:string-value";
    await kv.put(key, "hello world");

    const result = await kv.get(key);
    assert.ok(result !== null);
    assert.equal(result.value, "hello world");
  });

  test("manifest reference is accessible via /bytes/ on Swarm", async () => {
    const kv = makeKV();
    const result = await kv.put("test:manifest-bytes", { data: "manifest check" });

    // The feed manifest descriptor (384 bytes) is stored on Swarm as a content chunk.
    // It can be fetched via /bytes/{manifestRef} from any Bee node.
    const resp = await fetch(`https://bzz.limo/bytes/${result.manifestReference}`);
    assert.equal(resp.status, 200, "manifest must be fetchable via /bytes/ on Swarm");
    const buf = await resp.arrayBuffer();
    assert.ok(buf.byteLength > 0, "manifest must be non-empty");
  });

  test("isSwarmKVConfigured() reads SWARM_KV_PRIVATE_KEY from env", () => {
    const original = process.env.SWARM_KV_PRIVATE_KEY;

    process.env.SWARM_KV_PRIVATE_KEY = "";
    assert.equal(isSwarmKVConfigured(), false);

    process.env.SWARM_KV_PRIVATE_KEY = DEV_PRIVATE_KEY;
    assert.equal(isSwarmKVConfigured(), true);

    if (original !== undefined) {
      process.env.SWARM_KV_PRIVATE_KEY = original;
    } else {
      delete process.env.SWARM_KV_PRIVATE_KEY;
    }
  });

  test("createSwarmKVFromEnv() throws when SWARM_KV_PRIVATE_KEY is missing", () => {
    const original = process.env.SWARM_KV_PRIVATE_KEY;
    delete process.env.SWARM_KV_PRIVATE_KEY;

    assert.throws(() => createSwarmKVFromEnv(), /SWARM_KV_PRIVATE_KEY/);

    if (original !== undefined) {
      process.env.SWARM_KV_PRIVATE_KEY = original;
    }
  });
});
