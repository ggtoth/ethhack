# Swarm Bounty 1 Integration Plan

This document defines how to implement Swarm Bounty 1, "Verified Fetch - Trust No Gateway", in this repository as two linked deliverables:

1. a reusable in-repo TypeScript package for verified Swarm reads
2. a focused SmartJobs demo integration that proves the package in a real product flow

The goal is not to broadly migrate SmartJobs onto Swarm. The goal is to produce a bounty-ready package with a credible application demo inside the existing escrow and proof-submission experience.

## Bounty Summary

Swarm Bounty 1 asks for a JavaScript or TypeScript library that can fetch content from any Swarm gateway and verify client-side that the returned data is correct, without requiring the reader to run a full Bee node.

The deliverable must cover:

- a JS/TS library suitable for external reuse
- fetching from public or custom Swarm gateways
- client-side verification instead of trusting the gateway response
- support for immutable content and mutable feeds
- a familiar `fetch()`-like API
- browser and Node.js compatibility
- clean documentation and deterministic tests

For immutable content, the package must validate Swarm's content-addressed structure using CAC and BMT-based chunk verification. For feeds, the package must validate the feed update path, including SOC and signature checks, and optionally continue into immutable reference verification when the feed points to immutable content.

## Why SmartJobs Fits

SmartJobs is a good host application for this bounty because it already has the right product seams for demonstrating verified reads without forcing a new storage model into the app.

Existing app strengths:

- proof and source URL submission already exist in the freelancer flow
- AI review surfaces already show submitted assets and related job context
- the debug ledger already exposes stored workflow and escrow metadata
- the escrow flow benefits from trustworthy proof URLs because funding and release decisions depend on user-submitted evidence

Relevant current surfaces in this repo:

- `components/submit-work-form.tsx`
  The freelancer currently enters preview and source URLs here.
- `app/ai-review/page.tsx`
  This page already displays submitted proof metadata and is a natural place to surface verification status.
- `app/debug/ledger/page.tsx`
  This page is the cleanest place to expose raw verification metadata for debugging and demo purposes.
- `lib/workflow/domain-schema.ts`
  This is the right place to extend stored file metadata in a backwards-compatible way.
- `lib/workflow/dummy-endpoints.ts`
  This is where verification metadata can be persisted in the existing in-memory workflow ledger.

The app therefore provides a practical narrative for the bounty:

- a freelancer submits Swarm-hosted proof
- the app verifies the proof locally instead of trusting the gateway
- the verification outcome is visible to reviewers and inspectors

## Recommended Approach

The implementation should lock these decisions:

- The primary deliverable is a reusable package, not app-specific helper code.
- The secondary deliverable is a SmartJobs demo integration that proves the package works in a real workflow.
- Scope is limited to Bounty 1 only.
- Do not perform a broad Swarm storage migration across the app.
- Do not rewrite the escrow flow around feeds.
- Feed verification is required for the package and the bounty, but should live in a dedicated demo page instead of being forced into the main submit-proof workflow.

This framing keeps the package valuable outside SmartJobs while still giving the judges a visible product story.

## Proposed Repo Structure

The repo should remain a Next.js application at the root, with the Swarm library added as a workspace package.

Target structure:

```text
smartjobs/
  app/
  components/
  lib/
  packages/
    swarm-verified-fetch/
      package.json
      tsconfig.json
      src/
      tests/
      README.md
  package.json
  SWARM_BOUNTY_1_PLAN.md
```

Implementation rules:

- Keep the Next app as the root application.
- Add `packages/swarm-verified-fetch` as a local workspace package.
- Consume the package from the app through a local dependency rather than copying the logic into `lib/`.
- Keep cryptographic verification logic and Swarm parsing in the package.
- Keep SmartJobs-specific UI, schema wiring, and ledger persistence inside the app.

Recommended package internals:

- `src/index.ts`
  Public exports.
- `src/url.ts`
  Swarm URL parsing and normalization.
- `src/gateway.ts`
  Gateway request helpers and transport abstraction.
- `src/hash/`
  BMT, CAC, and related hashing utilities.
- `src/immutable.ts`
  Immutable reference and manifest verification.
- `src/feeds.ts`
  Feed and SOC verification logic.
- `src/errors.ts`
  Typed verification failures.
- `src/types.ts`
  Public and internal types.

## Package API

The package should expose the following public API.

### `verifiedFetch(input, init?)`

Primary fetch-like entry point for callers who want a familiar API.

Expected behavior:

- accepts Swarm URLs and Swarm gateway HTTP URLs
- resolves and verifies the requested content
- returns a standard `Response` object when verification succeeds
- throws `SwarmVerificationError` when verification fails
- supports both browser and Node runtimes

Indicative shape:

```ts
async function verifiedFetch(
  input: string | URL | Request,
  init?: RequestInit & VerifiedFetchInit,
): Promise<Response>
```

### `createVerifiedFetch(options?)`

Factory for creating a preconfigured fetcher.

Use cases:

- set a default gateway base URL
- inject a custom transport
- enable or disable follow-through verification behavior
- set default timeouts and diagnostics flags

Indicative shape:

```ts
function createVerifiedFetch(
  options?: VerifiedFetchOptions,
): (input: string | URL | Request, init?: RequestInit & VerifiedFetchInit) => Promise<Response>
```

### `verifySwarmResource(input, options?)`

Lower-level API for app and demo integration.

Expected behavior:

- performs the same retrieval and verification work as `verifiedFetch`
- returns both the final `Response` and structured verification metadata
- does not hide the verification path from callers

Indicative shape:

```ts
async function verifySwarmResource(
  input: string | URL | Request,
  options?: VerifySwarmResourceOptions,
): Promise<{
  response: Response
  verification: VerificationResult
}>
```

### `resolveSwarmFeed(input, options?)`

Dedicated feed-oriented helper for callers that explicitly want feed resolution details.

Expected behavior:

- accepts feed-form inputs such as owner/topic pairs, feed URLs, or normalized feed descriptors
- resolves the latest update or an explicitly requested index
- verifies the SOC and signature path
- optionally continues into immutable verification when the feed update points to a Swarm reference

Indicative shape:

```ts
async function resolveSwarmFeed(
  input: FeedInput,
  options?: ResolveSwarmFeedOptions,
): Promise<FeedResolutionResult>
```

### `SwarmVerificationError`

Error type for verification failures.

It should contain:

- machine-readable code
- user-displayable message
- optional cause
- optional verification context

Suggested error codes:

- `UNSUPPORTED_URL`
- `INVALID_REFERENCE`
- `GATEWAY_FETCH_FAILED`
- `HASH_MISMATCH`
- `MANIFEST_RESOLUTION_FAILED`
- `SOC_VERIFICATION_FAILED`
- `FEED_SIGNATURE_INVALID`
- `OWNER_MISMATCH`
- `MALFORMED_CHUNK`
- `MALFORMED_FEED_PAYLOAD`

### `type VerificationResult`

Public metadata object returned by the lower-level APIs and stored by the app.

It should capture:

- verification status
- resource kind
- requested input
- gateway used
- resolved immutable reference
- feed metadata when relevant
- timestamps
- chunk or traversal summary
- failure details when verification fails

Suggested shape:

```ts
type VerificationResult = {
  status: "verified" | "failed"
  kind: "immutable" | "feed_payload" | "feed_reference"
  requestedUrl: string
  gatewayUrl: string
  resolvedReference: string | null
  verifiedAt: string
  feed?: {
    owner: string
    topic: string
    index: string | null
  } | null
  details: {
    rootChunkReference?: string
    manifestPath?: string | null
    chunkCount?: number | null
    notes?: string[]
  }
  error?: {
    code: string
    message: string
  } | null
}
```

## Verification Scope

### Immutable Content

The immutable verification path is the main SmartJobs integration path and must be treated as first-class.

The package must support:

- CAC plus BMT verification for immutable content
- single-chunk blob verification
- multi-chunk file verification
- manifest resolution for path-based access
- manifest-backed file verification when the caller supplies a path under a Swarm reference
- hard failure on any hash mismatch, malformed chunk, or traversal inconsistency

Implementation expectations:

- do not trust the gateway's already-assembled file response by default
- reconstruct and verify the Swarm structure using chunk retrieval and deterministic hashing
- report the final resolved immutable reference in the verification metadata
- make the verification path inspectable enough for a demo UI and debug output

Intentional scope limits that are acceptable if documented:

- initial implementation may prioritize common immutable file and manifest retrieval paths over less common specialized reference forms
- if some advanced manifest edge cases are deferred, they must be clearly documented in package docs and tests

### Feeds

Feed support is required for the bounty, but it is a separate capability from the core SmartJobs proof flow.

The package must support:

- feed update retrieval from gateway-compatible endpoints
- SOC verification
- signature verification
- owner verification
- payload feeds
- reference feeds
- optional follow-through verification of referenced immutable content

Implementation expectations:

- allow callers to request latest update or an explicit index
- expose owner, topic, and resolved index in the returned metadata
- distinguish feed payloads from feed references in both API results and app-visible metadata
- fail hard on signature mismatch, owner mismatch, malformed SOC payload, or impossible feed shape

App-level rule:

- do not force feed mechanics into the escrow workflow just to satisfy the bounty
- demonstrate feeds through a dedicated demo page and package tests

## SmartJobs Integration

The SmartJobs integration should remain narrow and product-coherent.

### Required app behavior

For the freelancer submit-proof flow:

- detect whether the preview URL or source URL is a Swarm URL or recognized Swarm gateway URL
- if the URL is not Swarm-backed, leave behavior unchanged
- if the URL is Swarm-backed, verify it before the submission completes
- store verification metadata with the submitted file record in the in-memory ledger
- continue to support existing generic URLs

For review and inspection surfaces:

- show verification state on the AI review page
- show verification state on the debug ledger page
- keep the escrow flow itself unchanged

### Integration points

#### `components/submit-work-form.tsx`

Add pre-submit verification for Swarm-hosted preview and source URLs.

Expected flow:

1. user enters preview and source URLs
2. app classifies each URL as generic or Swarm-backed
3. app verifies Swarm-backed URLs with the package before persisting the submission
4. app stores the returned verification metadata alongside the file metadata
5. app blocks submission on verification failure for Swarm-backed URLs and shows a clear error

#### `lib/workflow/domain-schema.ts`

Extend stored file metadata in a backwards-compatible way.

Recommended conceptual additions:

```ts
type StoredFile = {
  id: string
  url: string
  filename: string
  storageKind?: "generic_url" | "swarm_immutable" | "swarm_feed"
  verification?: VerificationResult | null
}
```

Rules:

- existing stored files without new fields must remain valid
- non-Swarm files should either omit verification or store `null`
- schema additions must not break current dummy data

#### `lib/workflow/dummy-endpoints.ts`

Persist the verification metadata inside the in-memory ledger when proof submission succeeds.

Expected behavior:

- retain all existing workflow transitions
- add verification data to preview and submitted source records
- make the data visible via the existing ledger inspection utilities

#### `app/ai-review/page.tsx`

Show human-readable verification status for submitted assets.

Suggested UI:

- verified badge for Swarm-backed proof
- label for resource type such as immutable or feed reference
- resolved Swarm reference
- gateway used
- timestamp of verification
- error state when a previously stored verification failed or is missing

#### `app/debug/ledger/page.tsx`

Expose raw verification metadata for demo and debugging.

Suggested additions:

- verification status metric for stored files
- visible storage kind
- raw verification object in JSON output

### Backwards compatibility rules

- non-Swarm URLs must keep working exactly as they do now
- the existing in-memory demo workflow must remain functional without any Swarm input
- no escrow contract changes are needed for this bounty

## Dedicated Demo Page

The app needs a separate demo page because feeds are required by the bounty but do not fit naturally into the main job-proof workflow.

Recommended route:

- `app/demo/swarm-verified-fetch/page.tsx`

Purpose:

- demonstrate immutable verification in a focused way
- demonstrate feed verification in a focused way
- demonstrate failure behavior without breaking the main app workflow

The page should include:

- one immutable verification success example
- one feed verification success example
- one failure example
- visible input URL or feed descriptor
- gateway used
- resolved reference
- verification status
- verification method summary
- failure reason when applicable

Recommended page sections:

- immutable demo card
- feed demo card
- failure simulation or intentionally mismatched example
- raw JSON details panel

The page is a demo surface, not a production product page.

## Implementation Milestones

Implement in this exact sequence:

1. Set up workspace and package skeleton
2. Implement immutable verification
3. Implement feed verification
4. Add package docs/examples
5. Integrate immutable verification into SmartJobs submit-proof flow
6. Add dedicated demo page for feed and failure cases
7. Add deterministic tests and polish demo UX

Milestone details:

### 1. Set up workspace and package skeleton

- add workspace support at the repo root
- create `packages/swarm-verified-fetch`
- define package build and test setup
- expose empty or stubbed public exports

### 2. Implement immutable verification

- build URL parsing and normalization
- build gateway transport layer
- build BMT and CAC verification helpers
- support single-chunk, multi-chunk, and manifest path flows

### 3. Implement feed verification

- add feed input parsing
- add SOC derivation and signature checks
- support payload and reference feeds
- optionally chain into immutable verification

### 4. Add package docs/examples

- README for the package
- browser example
- Node example
- explanation of supported URL forms
- documented limits, if any

### 5. Integrate immutable verification into SmartJobs submit-proof flow

- classify proof URLs
- run verification before submission finishes
- store metadata in the in-memory ledger
- surface clear errors for failed verification

### 6. Add dedicated demo page for feed and failure cases

- build a simple page that exercises package APIs directly
- show success and failure metadata clearly

### 7. Add deterministic tests and polish demo UX

- add fixtures
- finalize package tests
- finalize app integration tests
- improve display copy for verified and failed states

## Test Plan

Automated tests must use deterministic fixtures and must not depend on live public gateways. A manual smoke step may be added separately, but live gateway calls must not be the primary CI signal.

### Package tests

The package test suite must cover:

- URL parsing
- immutable success and failure cases
- multi-chunk verification
- manifest verification
- feed verification
- bad signature failures
- bad owner failures
- malformed data failures

Concrete package scenarios:

- parse `bzz://...` style immutable inputs correctly
- parse recognized Swarm gateway URLs correctly
- verify a known-good single-chunk payload
- reject a single-chunk payload with mismatched content
- verify a known-good multi-chunk file
- resolve a manifest path to a specific file and verify it
- verify a feed payload update with a valid owner and signature
- verify a feed reference update and then verify the referenced immutable content
- reject a feed update whose signature does not match the declared owner
- reject malformed chunk trees and malformed SOC payloads

### App integration tests

The app integration test suite must cover:

- non-Swarm URLs unchanged
- Swarm URLs persist verification metadata
- AI review page displays verification state
- debug ledger exposes raw verification state
- demo page shows success and failure cases

Concrete app scenarios:

- submitting a generic HTTP preview/source URL behaves exactly as before
- submitting a Swarm preview URL stores `storageKind` and `verification`
- submitting a Swarm source URL stores `storageKind` and `verification`
- AI review page renders a verified label and resolved reference when present
- debug ledger raw JSON includes stored verification metadata
- demo page renders at least one verified immutable result, one verified feed result, and one failure result

### Fixture strategy

Recommended fixture approach:

- check in deterministic Swarm response fixtures
- include immutable chunk fixtures
- include manifest fixtures
- include feed plus SOC fixtures
- include corrupted fixtures for negative tests

The fixtures should be sufficient to verify the cryptographic and structural logic without requiring network availability.

## Risks and Non-Goals

This plan explicitly excludes the following:

- no upload or write flow to Swarm
- no persistence or backend rewrite
- no escrow contract changes
- no requirement to move all project assets to Swarm
- no full product-level Swarm migration

Important boundary:

- public gateways are acceptable for retrieval transport only because verification is local
- the package must not treat a gateway response as trusted simply because the request returned `200 OK`

Primary risks:

- Swarm chunk and manifest semantics are more complex than a naive fetch wrapper suggests
- feed support can sprawl if not cleanly separated from the main job workflow
- browser-safe crypto and binary handling must remain consistent with Node behavior

Mitigations:

- isolate verification logic in the package
- keep app wiring thin
- rely on deterministic fixtures
- document intentional scope limits instead of overreaching

## Assumptions

This plan assumes:

- the effort is optimized for Bounty 1 only
- package plus demo is the chosen delivery model
- feed support is required, but not in the main job flow
- in-memory ledger metadata is acceptable for the demo
- the root-level plan file is intentional for visibility and handoff
- SmartJobs remains the showcase app rather than the entire product being re-architected around Swarm

## Acceptance Criteria

The implementation plan is considered complete when:

- it lives at `SWARM_BOUNTY_1_PLAN.md` in the repo root
- it reads like an engineering handoff rather than rough notes
- it defines the package API explicitly
- it covers both immutable and feed verification
- it names the SmartJobs integration points clearly
- it includes milestones, tests, assumptions, risks, and non-goals
- it leaves no major delivery-shaping decisions open
