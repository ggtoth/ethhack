import assert from "node:assert/strict";
import test from "node:test";

import { SwarmVerificationError } from "../src/errors";
import { computeSwarmFileReference } from "../src/hash";
import { verifySwarmResource } from "../src/verify";

test("verifySwarmResource verifies matching immutable bytes", async () => {
  const payload = new TextEncoder().encode("package-local immutable fixture");
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
  assert.equal(result.verification.resolvedReference, reference);
  assert.equal(result.verification.details.chunkCount, 1);
});

test("verifySwarmResource rejects mismatched immutable bytes", async () => {
  const expected = new TextEncoder().encode("expected immutable payload");
  const actual = new TextEncoder().encode("different payload");
  const { reference } = computeSwarmFileReference(expected);

  await assert.rejects(
    () =>
      verifySwarmResource(`bzz://${reference}`, {
        fetchFn: async () => new Response(actual, { status: 200 }),
      }),
    (error: unknown) =>
      error instanceof SwarmVerificationError &&
      error.code === "HASH_MISMATCH",
  );
});

test("verifySwarmResource rejects unsupported manifest path inputs", async () => {
  const payload = new TextEncoder().encode("manifest candidate");
  const { reference } = computeSwarmFileReference(payload);

  await assert.rejects(
    () => verifySwarmResource(`bzz://${reference}/index.html`),
    (error: unknown) =>
      error instanceof SwarmVerificationError &&
      error.code === "UNSUPPORTED_RESOURCE_SHAPE",
  );
});

test("verifySwarmResource rejects feed-shaped inputs until feed verification is implemented", async () => {
  await assert.rejects(
    () =>
      verifySwarmResource(
        "swarm-feed://1234567890abcdef1234567890abcdef12345678/abcdef",
      ),
    (error: unknown) =>
      error instanceof SwarmVerificationError &&
      error.code === "UNSUPPORTED_RESOURCE_SHAPE",
  );
});
