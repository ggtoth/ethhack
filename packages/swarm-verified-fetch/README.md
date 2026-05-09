# swarm-verified-fetch

Local SmartJobs workspace package for verified Swarm reads.

Current implementation status:

- immutable Swarm resource parsing and verification
- `fetch()`-style API
- SmartJobs-facing verification metadata
- feed API scaffold with explicit unsupported errors

The first implementation focuses on immutable verification for the SmartJobs demo flow and keeps feed support honest by surfacing unsupported cases instead of returning false positives.

## How It Works

The package currently verifies immutable Swarm content in three stages:

1. `src/url.ts`
   Parses `bzz://...`, `swarm://...`, `swarm-feed://...`, and supported gateway URLs into a normalized Swarm resource description.
2. `src/verify.ts`
   Fetches immutable content from a Swarm gateway and routes feed-shaped inputs into the feed resolver scaffold.
3. `src/hash.ts`
   Recomputes the Swarm-style content reference locally by:
   - splitting the payload into 4096-byte chunks
   - computing a BMT-style root for each content-addressed chunk
   - hashing the span plus BMT root to produce each chunk reference
   - building the higher-level file tree until a single root reference remains

If the locally computed immutable reference matches the requested one, verification succeeds. If not, the package throws `SwarmVerificationError`.

## Current Scope

Implemented:

- immutable reference parsing
- immutable byte verification
- gateway URL normalization
- `verifiedFetch`
- `createVerifiedFetch`
- `verifySwarmResource`

Explicitly not implemented yet:

- manifest path verification
- feed payload verification
- feed signature verification
- feed reference follow-through

Those unsupported shapes fail explicitly with `SwarmVerificationError` instead of returning misleading success results.

## Running Tests

From the repo root:

```powershell
npm.cmd run test
```

To run the package through its workspace script:

```powershell
npm.cmd run test --workspace swarm-verified-fetch
```

The package-local tests live in:

- `packages/swarm-verified-fetch/tests/hash.test.ts`
- `packages/swarm-verified-fetch/tests/url.test.ts`
- `packages/swarm-verified-fetch/tests/verify.test.ts`

These are executed by the repo test harness in `tests/run-tests.ps1`.
