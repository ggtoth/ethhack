import { computeSwarmFileReference } from "./hash";
import { SwarmVerificationError } from "./errors";
import { resolveSwarmFeed } from "./feed";
import { parseSwarmResource } from "./url";
import type {
  VerificationResult,
  VerifySwarmResourceOptions,
} from "./types";

export async function verifySwarmResource(
  input: string | URL | Request,
  options: VerifySwarmResourceOptions = {},
) {
  const parsed = parseSwarmResource(input, options.gatewayBaseUrl);

  if (parsed.kind === "feed") {
    return resolveSwarmFeed(parsed.requestedUrl, options);
  }

  if (parsed.path) {
    throw new SwarmVerificationError(
      "UNSUPPORTED_RESOURCE_SHAPE",
      "Manifest path verification is not implemented yet. Submit the immutable file reference directly for now.",
      {
        requestedUrl: parsed.requestedUrl,
        reference: parsed.reference,
        path: parsed.path,
      },
    );
  }

  const fetchFn = options.fetchFn ?? globalThis.fetch;

  if (typeof fetchFn !== "function") {
    throw new SwarmVerificationError(
      "GATEWAY_FETCH_FAILED",
      "No fetch implementation is available for Swarm verification.",
    );
  }

  const response = await fetchFn(parsed.resolvedUrl, {
    cache: "no-store",
    ...options.requestInit,
  });

  if (!response.ok) {
    throw new SwarmVerificationError(
      "GATEWAY_FETCH_FAILED",
      `The Swarm gateway returned ${response.status} for ${parsed.resolvedUrl}.`,
      {
        requestedUrl: parsed.requestedUrl,
        resolvedUrl: parsed.resolvedUrl,
        status: response.status,
      },
    );
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const computed = computeSwarmFileReference(bytes);

  if (computed.reference !== parsed.reference) {
    throw new SwarmVerificationError(
      "HASH_MISMATCH",
      "The bytes returned by the Swarm gateway do not match the requested immutable reference.",
      {
        requestedUrl: parsed.requestedUrl,
        resolvedUrl: parsed.resolvedUrl,
        expectedReference: parsed.reference,
        actualReference: computed.reference,
      },
    );
  }

  const verification: VerificationResult = {
    status: "verified",
    kind: "immutable",
    requestedUrl: parsed.requestedUrl,
    gatewayUrl: parsed.gatewayUrl,
    resolvedReference: parsed.reference,
    verifiedAt: new Date().toISOString(),
    feed: null,
    details: {
      rootChunkReference: computed.reference,
      manifestPath: null,
      chunkCount: computed.chunkCount,
      notes: ["Immutable bytes were re-hashed locally using a Swarm-style chunk tree."],
    },
    error: null,
  };

  return {
    response: new Response(bytes, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    }),
    verification,
  };
}
