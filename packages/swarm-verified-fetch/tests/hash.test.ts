import assert from "node:assert/strict";
import test from "node:test";

import {
  __internal,
  computeContentAddressedChunkReference,
  computeSwarmFileReference,
} from "../src/hash";

test("chunkPayload splits large files into 4096-byte chunks", () => {
  const payload = new Uint8Array(4096 * 2 + 17);
  const chunks = __internal.chunkPayload(payload);

  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].length, 4096);
  assert.equal(chunks[1].length, 4096);
  assert.equal(chunks[2].length, 17);
});

test("computeContentAddressedChunkReference is deterministic", () => {
  const payload = new TextEncoder().encode("immutable swarm chunk");

  const first = computeContentAddressedChunkReference(payload, payload.length);
  const second = computeContentAddressedChunkReference(payload, payload.length);

  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test("computeSwarmFileReference returns one chunk for small payloads", () => {
  const payload = new TextEncoder().encode("small immutable payload");
  const result = computeSwarmFileReference(payload);

  assert.equal(result.chunkCount, 1);
  assert.match(result.reference, /^[a-f0-9]{64}$/);
});

test("computeSwarmFileReference returns multiple chunks for large payloads", () => {
  const payload = new Uint8Array(5000);
  const result = computeSwarmFileReference(payload);

  assert.equal(result.chunkCount, 2);
  assert.match(result.reference, /^[a-f0-9]{64}$/);
});
