import { SwarmVerificationError } from "./errors";

const DEFAULT_GATEWAY_URL = "https://gateway.ethswarm.org";

export type ParsedSwarmResource =
  | {
      kind: "immutable";
      reference: string;
      path: string | null;
      requestedUrl: string;
      gatewayUrl: string;
      resolvedUrl: string;
    }
  | {
      kind: "feed";
      owner: string;
      topic: string;
      requestedUrl: string;
      gatewayUrl: string;
      resolvedUrl: string;
    };

export function parseSwarmResource(
  input: string | URL | Request,
  gatewayBaseUrl?: string,
) {
  const requestedUrl = toInputString(input);
  const normalizedGatewayUrl = normalizeGatewayBaseUrl(gatewayBaseUrl);

  if (requestedUrl.startsWith("bzz://") || requestedUrl.startsWith("swarm://")) {
    return parseImmutableProtocolUrl(requestedUrl, normalizedGatewayUrl);
  }

  if (requestedUrl.startsWith("swarm-feed://")) {
    return parseFeedProtocolUrl(requestedUrl, normalizedGatewayUrl);
  }

  try {
    const parsed = new URL(requestedUrl);

    return parseGatewayUrl(parsed);
  } catch {
    throw new SwarmVerificationError("UNSUPPORTED_URL", "The URL is not a recognized Swarm resource.", {
      requestedUrl,
    });
  }
}

export function normalizeGatewayBaseUrl(value?: string) {
  const gateway = value?.trim() ? value.trim() : DEFAULT_GATEWAY_URL;

  return gateway.replace(/\/+$/, "");
}

function parseImmutableProtocolUrl(requestedUrl: string, gatewayUrl: string): ParsedSwarmResource {
  const withoutProtocol = requestedUrl.replace(/^[a-z-]+:\/\//i, "");
  const [reference, ...pathParts] = withoutProtocol.split("/").filter(Boolean);

  if (!isHexReference(reference)) {
    throw new SwarmVerificationError("INVALID_REFERENCE", "The Swarm immutable reference must be 64 hex characters.", {
      requestedUrl,
      reference,
    });
  }

  const path = pathParts.length > 0 ? pathParts.join("/") : null;
  const resolvedUrl = path
    ? `${gatewayUrl}/bzz/${reference}/${path}`
    : `${gatewayUrl}/bytes/${reference}`;

  return {
    kind: "immutable",
    reference,
    path,
    requestedUrl,
    gatewayUrl,
    resolvedUrl,
  };
}

function parseFeedProtocolUrl(requestedUrl: string, gatewayUrl: string): ParsedSwarmResource {
  const withoutProtocol = requestedUrl.replace(/^swarm-feed:\/\//i, "");
  const [owner, topic] = withoutProtocol.split("/").filter(Boolean);

  if (!isEthAddress(owner) || !isTopic(topic)) {
    throw new SwarmVerificationError("INVALID_REFERENCE", "The Swarm feed URL must contain an owner address and topic.", {
      requestedUrl,
      owner,
      topic,
    });
  }

  return {
    kind: "feed",
    owner: owner.toLowerCase(),
    topic: topic.toLowerCase(),
    requestedUrl,
    gatewayUrl,
    resolvedUrl: `${gatewayUrl}/feeds/${owner}/${topic}`,
  };
}

function parseGatewayUrl(parsed: URL): ParsedSwarmResource {
  const segments = parsed.pathname.split("/").filter(Boolean);
  const markerIndex = segments.findIndex((segment) =>
    ["bzz", "bytes", "chunks", "feeds"].includes(segment.toLowerCase()),
  );

  if (markerIndex === -1) {
    throw new SwarmVerificationError("UNSUPPORTED_URL", "The URL is not a recognized Swarm gateway path.", {
      requestedUrl: parsed.toString(),
    });
  }

  const marker = segments[markerIndex]?.toLowerCase();
  const gatewayUrl = `${parsed.protocol}//${parsed.host}`;

  if (marker === "feeds") {
    const owner = segments[markerIndex + 1];
    const topic = segments[markerIndex + 2];

    if (!isEthAddress(owner) || !isTopic(topic)) {
      throw new SwarmVerificationError("INVALID_REFERENCE", "The Swarm feed gateway URL is missing a valid owner or topic.", {
        requestedUrl: parsed.toString(),
        owner,
        topic,
      });
    }

    return {
      kind: "feed",
      owner: owner.toLowerCase(),
      topic: topic.toLowerCase(),
      requestedUrl: parsed.toString(),
      gatewayUrl,
      resolvedUrl: `${gatewayUrl}/feeds/${owner}/${topic}`,
    };
  }

  const reference = segments[markerIndex + 1];

  if (!isHexReference(reference)) {
    throw new SwarmVerificationError("INVALID_REFERENCE", "The Swarm immutable gateway URL is missing a valid 64-byte reference.", {
      requestedUrl: parsed.toString(),
      reference,
    });
  }

  const pathSegments = marker === "bzz" ? segments.slice(markerIndex + 2) : [];
  const path = pathSegments.length > 0 ? pathSegments.join("/") : null;

  return {
    kind: "immutable",
    reference: reference.toLowerCase(),
    path,
    requestedUrl: parsed.toString(),
    gatewayUrl,
    resolvedUrl: parsed.toString(),
  };
}

function toInputString(input: string | URL | Request) {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function isHexReference(value?: string) {
  return typeof value === "string" && /^[a-fA-F0-9]{64}$/.test(value);
}

function isEthAddress(value?: string) {
  return typeof value === "string" && /^[a-fA-F0-9]{40}$/.test(value);
}

function isTopic(value?: string) {
  return typeof value === "string" && /^[a-fA-F0-9]{1,64}$/.test(value);
}
