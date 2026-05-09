# verified-fetch — Trustless Data from Swarm

A JavaScript/TypeScript library that fetches data from any Swarm gateway and **cryptographically proves it is correct** — without running a full Bee node.

Works in **browsers and Node.js**.

## The problem

Downloading from Swarm without your own node means trusting a public gateway. For a network built on trustlessness, that's a gap.

## The solution

Every chunk on Swarm has an address that **is** its cryptographic hash. By recomputing the hash client-side and comparing it to the reference, we prove the data is authentic — regardless of which gateway served it. This is exactly what a Bee node does internally.

## Quick start

```typescript
import { verifiedFetch, verifiedFetchFeed } from "@/lib/swarm/verified-fetch";

// Immutable content (CAC — Content Addressed Chunk)
const result = await verifiedFetch("https://bzz.limo", "da04a66c...");

result.verified    // true — BMT hash recomputed and matches reference
result.chunkType   // "CAC"
result.json        // { verdict: "MATCH", score: 92 }
result.text        // raw UTF-8 if not JSON

// Mutable feed (SOC — Single Owner Chunk)
const feed = await verifiedFetchFeed("https://bzz.limo", ownerAddress, topicHex);

feed.verified        // true — Ethereum signature verified
feed.owner           // "0xf39fd6e5..." — recovered from signature
feed.dataReference   // "da04a66c..." — current content reference
feed.dataUrl         // https://bzz.limo/bytes/da04a66c...
```

## How it works

### CAC — Content Addressed Chunk (immutable data)

```
chunk bytes = [span: 8 bytes] [payload: 1–4096 bytes]

address = keccak256(
  span ‖ BMT_root(zero_pad(payload, 4096))
)

BMT (Binary Merkle Tree):
  1. Pad payload to 4096 bytes with zeros
  2. Split into 128 segments of 32 bytes each
  3. Pair-wise keccak256 until one 32-byte root remains
  4. address = keccak256(span ‖ root)
```

Verification: recompute the address and compare to the reference. A mismatch proves the gateway tampered with the data.

### SOC — Single Owner Chunk (mutable feed updates)

```
chunk bytes = [identifier: 32] [signature: 65] [span: 8] [payload: …]

address = keccak256(identifier ‖ ownerAddress)

Verification:
  1. Compute CAC address of the wrapped content (span ‖ payload)
  2. Recover signer: ecrecover(identifier ‖ cacAddress, signature)
  3. Compute expected address: keccak256(identifier ‖ recoveredOwner)
  4. Compare to reference — if match, feed update is authentic
```

A valid SOC proves the data was signed by the private key corresponding to `ownerAddress` — impossible to forge without the key.

## API

### `verifiedFetch(gatewayUrl, reference)`

```typescript
const result: VerifiedFetchResult = await verifiedFetch(
  "https://bzz.limo",
  "64-char-hex-reference"
);
```

| Field | Type | Description |
|-------|------|-------------|
| `verified` | `boolean` | `true` if hash/signature matches |
| `chunkType` | `"CAC" \| "SOC"` | Chunk type detected |
| `text` | `string \| null` | UTF-8 decoded content |
| `json` | `unknown \| null` | Parsed JSON |
| `owner` | `string \| null` | SOC only: recovered Ethereum address |
| `identifier` | `string \| null` | SOC only: 32-byte hex identifier |
| `socPayloadReference` | `string \| null` | SOC only: content reference it points to |
| `rawBytes` | `Uint8Array` | Raw chunk bytes from gateway |
| `fetchUrl` | `string` | URL used for the request |

### `verifiedFetchFeed(gatewayUrl, ownerAddress, topic)`

```typescript
const result: VerifiedFeedResult = await verifiedFetchFeed(
  "https://bzz.limo",
  "0xf39fd6e5...",   // Ethereum address
  "5c9f39d3..."      // 32-byte hex topic
);
```

| Field | Type | Description |
|-------|------|-------------|
| `verified` | `boolean` | `true` if SOC signature is valid |
| `owner` | `string` | Recovered Ethereum address |
| `dataReference` | `string` | Current content reference |
| `dataUrl` | `string` | Gateway URL for the content |

## REST API

Exposed as a Next.js route in the SmartJobs app:

```
GET /api/swarm/verify/{64-char-reference}
```

```json
{
  "reference": "da04a66c...",
  "verified": true,
  "chunkType": "CAC",
  "data": { "verdict": "MATCH", "score": 92 },
  "trustModel": "BMT hash recomputed client-side and compared to the reference..."
}
```

## Scope and limitations

| Scenario | Support |
|----------|---------|
| Single-chunk files (≤ 4 096 bytes payload) | ✅ Full BMT verification |
| Feed updates (SOC, any size payload) | ✅ ECDSA signature verification |
| Multi-chunk files (> 4 096 bytes) | ⚠️ Out of scope — requires chunk tree traversal |
| Browser support | ✅ Uses only `fetch()` and `cafe-utility` |
| Node.js support | ✅ |

Multi-chunk support requires walking the intermediate chunk tree. The architecture is the same (each node chunk is itself a CAC), but the traversal adds complexity. Single-chunk verification is sufficient for most KV-store values, feed payloads, and small JSON blobs.

## Trust model

```
Traditional:  App → Gateway → Data        (trust the gateway)
verified-fetch: App → Gateway → recompute hash → compare to reference
                                           (trust the math)
```

A tampered byte in the chunk payload changes the BMT root hash, which changes the chunk address — the verification will fail. A forged SOC signature cannot be produced without the owner's private key — the ECDSA recovery will return a wrong address.

## Real-world use in SmartJobs

When an AI review is stored on Swarm:

```typescript
// Store
const put = await kv.put("job:abc:review", reviewResult);
// → dataReference: "da04a66c..."   (CAC, content hash)
// → feedReference: "abbfb268..."   (SOC, signed feed update)

// Verify (client-side, no node required)
const check = await verifiedFetch("https://bzz.limo", put.dataReference);
check.verified  // true — the review result is cryptographically authentic

const feedCheck = await verifiedFetch("https://bzz.limo", put.feedReference);
feedCheck.verified  // true — the feed update is signed by the store owner
feedCheck.owner     // "0xf39fd6e5..." — the SmartJobs backend key
```

This gives clients and freelancers an independent, trustless way to verify that the AI review stored on-chain has not been altered.
