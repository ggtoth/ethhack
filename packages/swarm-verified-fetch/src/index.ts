export { SwarmVerificationError } from "./errors";
export { resolveSwarmFeed } from "./feed";
export { computeSwarmFileReference } from "./hash";
export { verifySwarmResource } from "./verify";
export type {
  FeedInput,
  FeedResolutionResult,
  ResolveSwarmFeedOptions,
  VerificationResult,
  VerifiedFetchInit,
  VerifiedFetchOptions,
  VerifySwarmResourceOptions,
} from "./types";

import type { VerifiedFetchInit, VerifiedFetchOptions } from "./types";
import { verifySwarmResource } from "./verify";

export async function verifiedFetch(
  input: string | URL | Request,
  init: VerifiedFetchInit = {},
) {
  const { response } = await verifySwarmResource(input, {
    gatewayBaseUrl: init.gatewayBaseUrl,
    fetchFn: init.fetchFn,
    requestInit: init,
  });

  return response;
}

export function createVerifiedFetch(options: VerifiedFetchOptions = {}) {
  return async (input: string | URL | Request, init: VerifiedFetchInit = {}) =>
    verifiedFetch(input, {
      ...init,
      gatewayBaseUrl: init.gatewayBaseUrl ?? options.gatewayBaseUrl,
      fetchFn: init.fetchFn ?? options.fetchFn,
    });
}
