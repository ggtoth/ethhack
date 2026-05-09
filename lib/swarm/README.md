# SwarmKV — A Simple Key-Value Store on Swarm

A developer-friendly key-value database backed by [Swarm](https://ethswarm.org) decentralized storage.  
Familiar `get` / `put` / `list` / `delete` interface — no knowledge of feeds, topics, or chunks required.

## How it works

Every key maps to a **Swarm Feed** — a mutable, owner-signed pointer on the Swarm network.

```
put("user:alice", { name: "Alice" })
  → serializes value
  → uploads bytes to Swarm            → content reference (immutable hash)
  → updates key's Feed                → feed reference (mutable pointer)
  → updates index Feed with new key   → global key listing on Swarm
```

The key index is itself a Feed, so the **entire store lives on Swarm** — no centralized database.

## Quick start

```typescript
import { SwarmKV } from "@/lib/swarm/swarm-kv-lib";

const kv = new SwarmKV({
  privateKey: "your-64-char-hex-private-key",
  beeApiUrl: "https://bzz.limo",   // or your own Bee node
});

// Store a value
const put = await kv.put("user:alice", { name: "Alice", role: "freelancer" });
console.log(put.dataReference);    // Swarm content hash (immutable bytes)
console.log(put.feedReference);    // Feed slot reference (mutable pointer)
console.log(put.manifestReference);// Feed manifest hash — permanent /bzz/ URL
console.log(put.url);              // https://bzz.limo/bytes/<dataHash>
console.log(put.manifestUrl);      // https://bzz.limo/bzz/<manifestHash>
                                   //   ↑ always resolves to the latest value

// Retrieve it
const result = await kv.get("user:alice");
console.log(result?.value);          // { name: "Alice", role: "freelancer" }
console.log(result?.dataReference);  // Swarm content hash (immutable)
console.log(result?.url);            // https://bzz.limo/bytes/<hash>

// List all keys
const keys = await kv.list();        // ["user:alice"]

// Check existence
const exists = await kv.has("user:alice");  // true

// Delete
await kv.delete("user:alice");
const gone = await kv.get("user:alice");    // null
```

## From environment variables

```typescript
import { createSwarmKVFromEnv } from "@/lib/swarm/swarm-kv-lib";

const kv = createSwarmKVFromEnv();
// Reads: SWARM_KV_PRIVATE_KEY, BEE_API_URL, BEE_POSTAGE_BATCH_ID, NEXT_PUBLIC_SWARM_GATEWAY
```

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `privateKey` | required | 64-char hex key for signing Feed updates |
| `beeApiUrl` | `https://bzz.limo` | Bee node HTTP API URL |
| `stamp` | `NULL_STAMP` (all zeros) | Postage batch ID — bzz.limo rewrites NULL_STAMP |
| `gatewayUrl` | `https://bzz.limo` | Public gateway for shareable URLs |

## Environment variables

```env
SWARM_KV_PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
BEE_API_URL=https://bzz.limo
BEE_POSTAGE_BATCH_ID=0000000000000000000000000000000000000000000000000000000000000000
NEXT_PUBLIC_SWARM_GATEWAY=https://bzz.limo
```

Generate a fresh private key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## REST API

The library is exposed as REST endpoints in this app:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/swarm/kv/set` | Store a key-value pair |
| `GET` | `/api/swarm/kv/:key` | Retrieve by key |
| `GET` | `/api/swarm/kv` | List all keys |
| `POST` | `/api/swarm/kv/delete` | Delete a key |
| `GET` | `/api/swarm/verify/:reference` | Verify content integrity |

### POST /api/swarm/kv/set

```json
// Request
{ "key": "job:abc123:review", "value": { "verdict": "pass", "score": 0.87 } }

// Response 201
{
  "key": "job:abc123:review",
  "dataReference": "b01e4563...",
  "feedReference": "39ed2ec7...",
  "manifestReference": "e4ea5520...",
  "url": "https://bzz.limo/bytes/b01e4563...",
  "manifestUrl": "https://bzz.limo/bzz/e4ea5520..."
}
```

The `manifestUrl` is a **permanent mutable URL** backed by a Swarm Feed Manifest.
It always resolves to the latest value — no need to update any links when the value changes.

### GET /api/swarm/kv/job:abc123:review

```json
// Response 200
{
  "key": "job:abc123:review",
  "reference": "b01e4563...",
  "url": "https://bzz.limo/bytes/b01e4563...",
  "data": { "verdict": "pass", "score": 0.87 },
  "backend": "swarm-feeds"
}
```

## Supported value types

| Type | Stored as |
|------|-----------|
| `string` | raw UTF-8 bytes |
| `object` | `JSON.stringify()` |
| `Uint8Array` | raw binary |

## Feed manifests — mutable permanent URLs

Each `put()` also creates (or re-uses) a **Feed Manifest** for the key.

A Feed Manifest is a Swarm manifest (`/bzz/` namespace) that wraps a Feed.
When you fetch `/bzz/{manifestReference}`, Swarm resolves the latest Feed epoch
and returns the current value — without the caller needing to know the Feed topic
or owner address.

```
manifestRef = createFeedManifest(stamp, topic, ownerAddress)
            → a permanent 64-char hex reference

Access:  GET https://bzz.limo/bzz/{manifestRef}
         → returns the current value (updates automatically on put())
```

**Why this matters for verification ("Trust No Gateway"):**
- The `dataReference` is the immutable content hash (changes every `put()`)
- The `manifestReference` is the permanent entry point (never changes)
- Fetching `/bzz/{manifestRef}` directly from a Bee node proves the content
  came from the decentralized network — not a third-party cache or CDN

## How feeds work under the hood

Each key is hashed with SHA-256 to produce a 32-byte **feed topic**:

```
topic = sha256("job:abc123:review")
      = 62af8704764faf8ea82fc61ce9c4c3908b6cb97d463a634e9e587d7c885db0ef
```

A Swarm Feed is identified by `(owner_address, topic)`. Only the owner (holder of the private key) can write updates. Reads are public.

The key index is stored at topic `sha256("__swarm_kv_index_v1__")` — updated on every `put` and `delete`.

## Real-world use in SmartJobs

This library is integrated into the SmartJobs freelance marketplace:

- **AI review proof** → `put("job:{id}:review", reviewResult)` after each OpenAI review
- **Job metadata** → `put("job:{id}:metadata", { title, budget, requirements })`
- **Deliverables** → `put("job:{id}:deliverable", { files, notes })`

The Swarm reference appears in the UI so clients and freelancers can independently verify the stored proof.
