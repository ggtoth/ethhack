import assert from "node:assert/strict";
import test from "node:test";

import { SwarmVerificationError } from "../src/errors";
import { normalizeGatewayBaseUrl, parseSwarmResource } from "../src/url";

test("normalizeGatewayBaseUrl trims trailing slashes and defaults correctly", () => {
  assert.equal(
    normalizeGatewayBaseUrl("https://gateway.ethswarm.org///"),
    "https://gateway.ethswarm.org",
  );
  assert.equal(
    normalizeGatewayBaseUrl(),
    "https://gateway.ethswarm.org",
  );
});

test("parseSwarmResource parses immutable protocol URLs", () => {
  const parsed = parseSwarmResource(
    "bzz://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  );

  assert.equal(parsed.kind, "immutable");
  assert.equal(parsed.reference, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  assert.equal(parsed.path, null);
  assert.equal(
    parsed.resolvedUrl,
    "https://gateway.ethswarm.org/bytes/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  );
});

test("parseSwarmResource parses feed protocol URLs", () => {
  const parsed = parseSwarmResource(
    "swarm-feed://1234567890abcdef1234567890abcdef12345678/abcdef",
  );

  assert.equal(parsed.kind, "feed");
  if (parsed.kind === "feed") {
    assert.equal(parsed.owner, "1234567890abcdef1234567890abcdef12345678");
    assert.equal(parsed.topic, "abcdef");
  }
});

test("parseSwarmResource parses immutable gateway URLs", () => {
  const parsed = parseSwarmResource(
    "https://gateway.ethswarm.org/bytes/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  );

  assert.equal(parsed.kind, "immutable");
  assert.equal(parsed.gatewayUrl, "https://gateway.ethswarm.org");
});

test("parseSwarmResource rejects non-swarm URLs", () => {
  assert.throws(
    () => parseSwarmResource("https://example.com/file.zip"),
    (error: unknown) =>
      error instanceof SwarmVerificationError &&
      error.code === "UNSUPPORTED_URL",
  );
});
