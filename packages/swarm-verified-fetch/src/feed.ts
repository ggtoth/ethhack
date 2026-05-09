import { SwarmVerificationError } from "./errors";
import { parseSwarmResource } from "./url";
import type {
  FeedInput,
  FeedResolutionResult,
  ResolveSwarmFeedOptions,
} from "./types";

export async function resolveSwarmFeed(
  input: FeedInput,
  options: ResolveSwarmFeedOptions = {},
): Promise<FeedResolutionResult> {
  const normalizedInput =
    typeof input === "object" &&
    input !== null &&
    "owner" in input &&
    "topic" in input
      ? `swarm-feed://${input.owner}/${input.topic}`
      : input;

  const parsed = parseSwarmResource(
    normalizedInput as string | URL,
    options.gatewayBaseUrl,
  );

  if (parsed.kind !== "feed") {
    throw new SwarmVerificationError("UNSUPPORTED_URL", "The requested resource is not a Swarm feed.", {
      requestedUrl: typeof normalizedInput === "string" ? normalizedInput : normalizedInput.toString(),
    });
  }

  throw new SwarmVerificationError(
    "UNSUPPORTED_RESOURCE_SHAPE",
    "Feed verification is scaffolded, but full feed decoding and signature verification are not implemented yet.",
    {
      requestedUrl: parsed.requestedUrl,
      gatewayUrl: parsed.gatewayUrl,
      owner: parsed.owner,
      topic: parsed.topic,
    },
  );
}
