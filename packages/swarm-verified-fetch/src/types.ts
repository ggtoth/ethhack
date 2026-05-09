export type SwarmVerificationKind =
  | "immutable"
  | "feed_payload"
  | "feed_reference";

export type VerificationResult = {
  status: "verified" | "failed";
  kind: SwarmVerificationKind;
  requestedUrl: string;
  gatewayUrl: string;
  resolvedReference: string | null;
  verifiedAt: string;
  feed: {
    owner: string;
    topic: string;
    index: string | null;
  } | null;
  details: {
    rootChunkReference?: string;
    manifestPath?: string | null;
    chunkCount?: number | null;
    notes?: string[];
  };
  error: {
    code: string;
    message: string;
  } | null;
};

export type VerifiedFetchInit = RequestInit & {
  gatewayBaseUrl?: string;
  fetchFn?: typeof fetch;
};

export type VerifiedFetchOptions = {
  gatewayBaseUrl?: string;
  fetchFn?: typeof fetch;
};

export type VerifySwarmResourceOptions = {
  gatewayBaseUrl?: string;
  fetchFn?: typeof fetch;
  requestInit?: RequestInit;
};

export type FeedInput =
  | string
  | URL
  | {
      owner: string;
      topic: string;
      gatewayBaseUrl?: string;
    };

export type ResolveSwarmFeedOptions = {
  gatewayBaseUrl?: string;
  fetchFn?: typeof fetch;
  requestInit?: RequestInit;
};

export type FeedResolutionResult = {
  response: Response;
  verification: VerificationResult;
};
