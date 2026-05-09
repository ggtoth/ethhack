import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import * as swarmVerifyRoute from "../app/api/swarm/verify/route";
import { SwarmVerificationError, verifySwarmResource } from "../packages/swarm-verified-fetch/src/index";
import { computeSwarmFileReference } from "../packages/swarm-verified-fetch/src/hash";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("verifySwarmResource accepts immutable Swarm URLs when the bytes match the reference", async () => {
  const payload = new TextEncoder().encode("smartjobs swarm immutable fixture");
  const { reference } = computeSwarmFileReference(payload);

  const result = await verifySwarmResource(`bzz://${reference}`, {
    fetchFn: async () =>
      new Response(payload, {
        status: 200,
        headers: {
          "content-type": "application/octet-stream",
        },
      }),
  });

  assert.equal(result.verification.status, "verified");
  assert.equal(result.verification.kind, "immutable");
  assert.equal(result.verification.resolvedReference, reference);
  assert.equal(await result.response.text(), "smartjobs swarm immutable fixture");
});

test("verifySwarmResource rejects manifest paths for now", async () => {
  const payload = new TextEncoder().encode("manifest path fixture");
  const { reference } = computeSwarmFileReference(payload);

  await assert.rejects(
    () => verifySwarmResource(`bzz://${reference}/index.html`),
    (error: unknown) =>
      error instanceof SwarmVerificationError &&
      error.code === "UNSUPPORTED_RESOURCE_SHAPE",
  );
});

test("verify route treats non-swarm URLs as generic URLs", async () => {
  const response = await swarmVerifyRoute.POST(
    new Request("http://test.local/api/swarm/verify", {
      method: "POST",
      body: JSON.stringify({
        url: "https://example.com/archive.zip",
      }),
    }),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.storageKind, "generic_url");
  assert.equal(payload.verification, null);
});

test("verify route returns verified immutable metadata for matching bytes", async () => {
  const payload = new TextEncoder().encode("verified via route");
  const { reference } = computeSwarmFileReference(payload);

  globalThis.fetch = async () =>
    new Response(payload, {
      status: 200,
      headers: {
        "content-type": "application/octet-stream",
      },
    });

  const response = await swarmVerifyRoute.POST(
    new Request("http://test.local/api/swarm/verify", {
      method: "POST",
      body: JSON.stringify({
        url: `bzz://${reference}`,
      }),
    }),
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.storageKind, "swarm_immutable");
  assert.equal(result.verification.status, "verified");
  assert.equal(result.verification.resolvedReference, reference);
});

test("verify route blocks mismatched immutable payloads", async () => {
  const expected = new TextEncoder().encode("expected reference");
  const actual = new TextEncoder().encode("different payload");
  const { reference } = computeSwarmFileReference(expected);

  globalThis.fetch = async () => new Response(actual, { status: 200 });

  const response = await swarmVerifyRoute.POST(
    new Request("http://test.local/api/swarm/verify", {
      method: "POST",
      body: JSON.stringify({
        url: `bzz://${reference}`,
      }),
    }),
  );
  const result = await response.json();

  assert.equal(response.status, 502);
  assert.equal(result.code, "HASH_MISMATCH");
});
