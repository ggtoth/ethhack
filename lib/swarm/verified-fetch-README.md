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

// Mutable feed (SOC — Single Owner Chunk, strict verification)
const feed = await verifiedFetchFeed("https://bzz.limo", ownerAddress, topicHex);

feed.verified            // true — ALL of: sig valid + owner matches + identifier matches
feed.signatureValid      // ECDSA recovery succeeded
feed.ownerMatches        // recovered owner == declared owner
feed.identifierMatches   // chunk identifier == keccak256(topic ‖ feedIndex)
feed.feedIndex           // integer index of the feed slot
feed.identifier          // computed identifier (32-byte hex)
feed.owner               // "0xf39fd6e5..." — recovered from signature
feed.dataReference       // "da04a66c..." — current content reference
feed.dataUrl             // https://bzz.limo/bytes/da04a66c...
```

## How it works

### CAC — Content Addressed Chunk (immutable data)

```
chunk bytes = [span: 8 bytes LE uint64] [payload: 1–4096 bytes]

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

For a sequence feed slot:
  identifier = keccak256(topic[32] ‖ feedIndex[8 BE])
  address    = keccak256(identifier[32] ‖ owner[20])

Sequence feed payload:
  [timestamp: 8 bytes BE] [content reference: 32 bytes]

Verification (strict):
  1. GET /feeds/{owner}/{topic}?type=sequence
     → read swarm-feed-index header (16-char hex = 8-byte BE uint64)
  2. Compute identifier = keccak256(topic ‖ feedIndexBytes)
  3. Compute expectedSocRef = keccak256(identifier ‖ ownerBytes)
  4. GET /chunks/{expectedSocRef}
  5. Recover signer: ecrecover(keccak256(identifier ‖ cacAddress), signature)
  6. Check ownerMatches: recovered == declared owner
  7. Check identifierMatches: chunk identifier == computed identifier
  8. Extract dataReference: payload[8:40]
```

A valid, fully verified SOC proves:
- The data was signed by the private key of `ownerAddress` (cannot be forged)
- The feed slot belongs to the correct (owner, topic, index) triple (cannot be substituted)

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
| `verified` | `boolean` | `true` iff sig valid + owner matches + identifier matches |
| `signatureValid` | `boolean` | Raw ECDSA recovery succeeded |
| `ownerMatches` | `boolean` | Recovered owner == declared owner |
| `identifierMatches` | `boolean` | Chunk identifier == keccak256(topic ‖ feedIndex) |
| `feedIndex` | `number` | Integer index of the feed slot |
| `identifier` | `string` | Computed identifier (32-byte hex) |
| `owner` | `string` | Recovered Ethereum address |
| `dataReference` | `string` | Current content reference (32-byte hex) |
| `dataUrl` | `string` | Gateway URL for the content |

### `verifyRawChunk(raw, reference)` — unit-testable

```typescript
import { verifyRawChunk, computeCACReference } from "@/lib/swarm/verified-fetch";

// Build a CAC chunk in memory and verify it (no network)
const payload = new TextEncoder().encode("hello");
const span = new Uint8Array(8);
span[0] = payload.length;
const raw = new Uint8Array([...span, ...payload]);
const reference = computeCACReference(raw);

verifyRawChunk(raw, reference).verified  // true
raw[9] ^= 0x01;
verifyRawChunk(raw, reference).verified  // false — tamper detected
```

### `feedIndexToBytes(index)` / `parseFeedIndexHex(hex)`

Encode/decode feed indices as 8-byte big-endian values, matching the `swarm-feed-index` header format used by the Bee API.

```typescript
import { feedIndexToBytes, parseFeedIndexHex } from "@/lib/swarm/verified-fetch";

feedIndexToBytes(1)          // Uint8Array [0,0,0,0,0,0,0,1]
parseFeedIndexHex("0000000000000001")  // 1
```

## Tests

```bash
# Unit tests only (no network required)
SKIP_LIVE_TESTS=1 npm test

# Full suite including live bzz.limo integration tests
npm test
```

Unit tests construct valid CAC chunks in memory and verify that single-byte tampering of either the payload or span causes `verified: false` — proving the BMT hash covers the entire chunk.

Live tests upload a fresh KV entry to bzz.limo, then verify:
- `verifiedFetch` correctly identifies CAC and SOC chunk types
- BMT hash matches for immutable data chunks
- ECDSA signature recovery returns the correct owner for feed SOC chunks
- `verifiedFetchFeed` returns `ownerMatches: true` and `identifierMatches: true` with a freshly uploaded feed

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
| Sequence feed updates (SOC) | ✅ Strict ECDSA + owner + identifier verification |
| Multi-chunk files (> 4 096 bytes) | ❌ Not supported — requires chunk tree traversal |
| Browser support | ✅ Uses only `fetch()` and `cafe-utility` |
| Node.js support | ✅ |

Multi-chunk support requires walking the intermediate chunk tree. The architecture is the same (each node chunk is itself a CAC), but the traversal adds significant complexity. Single-chunk verification is sufficient for KV-store values, feed payloads, and small JSON blobs.

## Trust model

```
Traditional:    App → Gateway → Data              (trust the gateway)
verified-fetch: App → Gateway → recompute hash → compare to reference
                                                   (trust the math)
```

**CAC tamper detection**: A tampered payload byte changes the BMT root hash, which changes the chunk address — verification fails.

**SOC tamper detection**: A forged SOC signature cannot be produced without the owner's private key — ECDSA recovery returns the wrong address. Additionally, computing the expected SOC address deterministically from (owner, topic, index) means a gateway cannot substitute a different feed slot.

## Real-world use in SmartJobs

When an AI review is stored on Swarm:

```typescript
// Store
const put = await kv.put("job:abc:review", reviewResult);
// → dataReference: "da04a66c..."   (CAC, content hash)
// → feedReference: "abbfb268..."   (SOC, signed feed update)

// Verify immutable data (client-side, no node required)
const check = await verifiedFetch("https://bzz.limo", put.dataReference);
check.verified  // true — review result is cryptographically authentic

// Verify the feed slot (strict: owner + identifier + signature)
const topicHex = createHash("sha256").update("job:abc:review").digest("hex");
const feedCheck = await verifiedFetchFeed("https://bzz.limo", ownerAddress, topicHex);
feedCheck.verified            // true
feedCheck.ownerMatches        // true — signed by the SmartJobs backend key
feedCheck.identifierMatches   // true — correct (owner, topic, index) triple
feedCheck.dataReference       // "da04a66c..." — matches put.dataReference
```

This gives clients and freelancers an independent, trustless way to verify that the AI review stored on-chain has not been altered and was signed by the correct backend.
