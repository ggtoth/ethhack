/**
 * verified-fetch — Trustless data retrieval from Swarm
 *
 * Fetch data from any Swarm gateway and cryptographically verify it is correct
 * — without running a full node. Works in browsers and Node.js.
 *
 * How it works
 * ────────────
 * Every chunk on Swarm has an address that IS its cryptographic hash. There are
 * two chunk types:
 *
 *  CAC — Content Addressed Chunk (immutable data)
 *    address = keccak256(span ‖ BMT_root(zero_padded_payload_to_4096))
 *    Verification: recompute the BMT hash and compare to the reference.
 *
 *  SOC — Single Owner Chunk (mutable feed updates)
 *    address = keccak256(identifier ‖ ownerAddress)
 *    For feeds: identifier = keccak256(topic[32] ‖ feedIndex[8 BE])
 *    Verification: recover the Ethereum signer from the payload signature,
 *    confirm it matches the declared owner, and confirm the identifier matches
 *    the one computed from (topic, feedIndex).
 *
 * This is exactly what a Bee node does internally. By recomputing it client-side
 * we prove the data is authentic — regardless of which gateway served it.
 *
 * Usage
 * ─────
 *   import { verifiedFetch, verifiedFetchFeed } from "@/lib/swarm/verified-fetch";
 *
 *   // Immutable content
 *   const r = await verifiedFetch("https://bzz.limo", "da04a66c...");
 *   r.verified   // true — BMT hash matches
 *   r.data       // decoded text or raw bytes
 *
 *   // Mutable feed (strict SOC verification)
 *   const f = await verifiedFetchFeed("https://bzz.limo", ownerAddress, topicHex);
 *   f.verified           // true — signature valid + owner matches + identifier matches
 *   f.signatureValid     // ECDSA recovery succeeded
 *   f.ownerMatches       // recovered owner == declared owner
 *   f.identifierMatches  // chunk identifier == keccak256(topic ‖ feedIndex)
 *   f.feedIndex          // integer index of the feed slot
 *   f.dataReference      // content reference the feed currently points to
 *
 * Scope
 * ─────
 * Handles single-chunk content (≤ 4096 bytes payload). Multi-chunk files require
 * walking the chunk tree — out of scope for this release, documented below.
 */

import { Binary } from "cafe-utility";
import { Signature } from "@ethersphere/bee-js";

// ─── constants ───────────────────────────────────────────────────────────────

const SPAN_LENGTH = 8;          // little-endian uint64 byte count
const SEGMENT_SIZE = 32;        // one keccak256 output = one BMT segment
const MAX_PAYLOAD = 4096;       // maximum single-chunk payload (4 KiB)
const BRANCHES = 128;           // MAX_PAYLOAD / SEGMENT_SIZE

// SOC byte layout: [identifier 32] [signature 65] [span 8] [payload …]
const SOC_ID_OFFSET = 0;
const SOC_SIG_OFFSET = 32;
const SOC_SPAN_OFFSET = 32 + 65;
const SOC_PAYLOAD_OFFSET = 32 + 65 + 8;  // 105 bytes before the CAC data

// Sequence feed SOC payload: [timestamp 8 BE] [content reference 32]
const FEED_TIMESTAMP_LENGTH = 8;
const FEED_REF_LENGTH = 32;

// ─── public types ────────────────────────────────────────────────────────────

export type VerifiedFetchResult = {
  /** Swarm reference (64-char hex) that was fetched. */
  reference: string;
  /** True when the locally recomputed hash matches the reference exactly. */
  verified: boolean;
  /** "CAC" — immutable content chunk; "SOC" — mutable single-owner chunk. */
  chunkType: "CAC" | "SOC";
  /** For SOC chunks: the recovered Ethereum address of the signer. */
  owner: string | null;
  /** For SOC chunks: the identifier (feed topic + index, 32-byte hex). */
  identifier: string | null;
  /** For SOC chunks: the 32-byte reference the feed slot points to. */
  socPayloadReference: string | null;
  /** Raw chunk bytes from the gateway (span + payload for CAC; full SOC bytes for SOC). */
  rawBytes: Uint8Array;
  /** Decoded text content (UTF-8). Null if binary. */
  text: string | null;
  /** Parsed JSON value. Null if not JSON. */
  json: unknown | null;
  /** URL used to fetch the chunk. */
  fetchUrl: string;
  /** ISO timestamp of when verification ran. */
  verifiedAt: string;
};

export type VerifiedFileResult = {
  /** Root Swarm reference (64-char hex). */
  reference: string;
  /** True iff every chunk in the tree passed BMT hash verification. */
  verified: boolean;
  /** Assembled file content (all leaf payloads concatenated in order). */
  data: Uint8Array;
  /** Total chunks fetched and verified (1 for single-chunk files). */
  chunkCount: number;
  /** Decoded UTF-8 text. Null if binary. */
  text: string | null;
  /** Parsed JSON. Null if not JSON. */
  json: unknown | null;
  verifiedAt: string;
};

export type VerifiedFeedResult = {
  /** Swarm reference of the SOC chunk (the feed slot). */
  reference: string;
  /**
   * True when ALL of: signature valid + recovered owner matches declared owner
   * + chunk identifier matches keccak256(topic ‖ feedIndex).
   */
  verified: boolean;
  /** Raw ECDSA signature recovery succeeded. */
  signatureValid: boolean;
  /** Recovered owner address matches the declared ownerAddress. */
  ownerMatches: boolean;
  /** Chunk identifier matches keccak256(topic ‖ feedIndex bytes). */
  identifierMatches: boolean;
  /** Recovered Ethereum address of the feed owner. */
  owner: string;
  /** Topic of the feed (32-byte hex). */
  topic: string;
  /** Integer index of the feed slot (from swarm-feed-index header). */
  feedIndex: number;
  /** The computed feed identifier: keccak256(topic ‖ feedIndex[8 BE]). 32-byte hex. */
  identifier: string;
  /** The 32-byte immutable content reference this feed slot points to. */
  dataReference: string;
  /** Convenience URL: gateway + /bytes/ + dataReference. */
  dataUrl: string;
  verifiedAt: string;
};

// ─── core API ────────────────────────────────────────────────────────────────

/**
 * Fetch and cryptographically verify a complete Swarm file, including multi-chunk files.
 *
 * For files ≤ 4096 bytes: fetches one chunk and verifies its BMT hash.
 * For larger files: traverses the Swarm chunk tree, verifying every node and leaf
 * with its BMT hash before assembling the full file content.
 *
 * @param gatewayUrl Any Swarm gateway, e.g. "https://bzz.limo"
 * @param reference  64-char hex root chunk address
 */
export async function verifiedFetchFile(
  gatewayUrl: string,
  reference: string,
): Promise<VerifiedFileResult> {
  const gw = gatewayUrl.replace(/\/$/, "");

  const networkFetcher = async (ref: string): Promise<Uint8Array> => {
    const url = `${gw}/chunks/${ref}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Chunk fetch failed: ${resp.status} ${resp.statusText} (ref: ${ref})`);
    }
    return new Uint8Array(await resp.arrayBuffer());
  };

  const { data, chunkCount, allVerified } = await verifyChunkTree(networkFetcher, reference);
  const text = tryDecodeText(data);

  return {
    reference,
    verified: allVerified,
    data,
    chunkCount,
    text,
    json: tryParseJson(text),
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Traverse and verify a Swarm chunk tree using a custom chunk fetcher.
 *
 * Exported for unit testing — pass an in-memory mock fetcher to avoid network calls.
 * Production code should use `verifiedFetchFile` instead.
 *
 * Swarm chunk tree rules:
 *   span ≤ 4096 → leaf: payload[0:span] is the raw file data
 *   span > 4096 → intermediate: payload is packed 32-byte child chunk references
 *
 * @param fetcher       Async function that returns raw chunk bytes for a given reference
 * @param rootReference 64-char hex root chunk address
 */
export async function verifyChunkTree(
  fetcher: (ref: string) => Promise<Uint8Array>,
  rootReference: string,
): Promise<{ data: Uint8Array; chunkCount: number; allVerified: boolean }> {
  return treeNode(fetcher, rootReference, 0);
}

async function treeNode(
  fetcher: (ref: string) => Promise<Uint8Array>,
  reference: string,
  depth: number,
): Promise<{ data: Uint8Array; chunkCount: number; allVerified: boolean }> {
  if (depth > 8) {
    throw new Error(`Chunk tree depth limit exceeded at reference ${reference}`);
  }

  const raw = await fetcher(reference);
  const nodeVerified = tryVerifyCAC(raw, reference) === true;
  const span = readUint64LE(raw);
  const payload = raw.slice(SPAN_LENGTH);

  // Leaf: span ≤ MAX_PAYLOAD — payload is raw file data
  if (span <= MAX_PAYLOAD) {
    return { data: payload.slice(0, span), chunkCount: 1, allVerified: nodeVerified };
  }

  // Intermediate: payload is a sequence of 32-byte child chunk references
  const numSlots = Math.floor(payload.length / SEGMENT_SIZE);
  const childRefs: string[] = [];
  for (let i = 0; i < numSlots; i++) {
    const refHex = toHex(payload.slice(i * SEGMENT_SIZE, (i + 1) * SEGMENT_SIZE));
    if (refHex === "0".repeat(64)) break; // null ref = no more children
    childRefs.push(refHex);
  }

  const children = await Promise.all(childRefs.map((ref) => treeNode(fetcher, ref, depth + 1)));

  const totalLen = children.reduce((s, c) => s + c.data.length, 0);
  const assembled = new Uint8Array(totalLen);
  let offset = 0;
  for (const child of children) {
    assembled.set(child.data, offset);
    offset += child.data.length;
  }

  return {
    data: assembled.slice(0, span),
    chunkCount: 1 + children.reduce((s, c) => s + c.chunkCount, 0),
    allVerified: nodeVerified && children.every((c) => c.allVerified),
  };
}

/**
 * Fetch a Swarm chunk and cryptographically verify it.
 *
 * Tries CAC verification first (BMT hash). If the chunk is a SOC (feed update),
 * falls back to SOC signature verification and extracts the feed payload.
 *
 * @param gatewayUrl  Any Swarm gateway, e.g. "https://bzz.limo"
 * @param reference   64-char hex chunk address
 */
export async function verifiedFetch(
  gatewayUrl: string,
  reference: string,
): Promise<VerifiedFetchResult> {
  const url = `${gatewayUrl.replace(/\/$/, "")}/chunks/${reference}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch chunk ${reference}: ${response.status} ${response.statusText}`,
    );
  }

  const buffer = await response.arrayBuffer();
  const raw = new Uint8Array(buffer);

  // Detect chunk type using the span heuristic:
  //   CAC: bytes 0–7 are a little-endian uint64 equal to (raw.length - 8)
  //   SOC: bytes 0–7 are the first 8 bytes of the 32-byte identifier (arbitrary)
  const spanValue = readUint64LE(raw);
  const expectedCACPayload = raw.length - SPAN_LENGTH;
  const looksLikeCAC = spanValue === expectedCACPayload;

  if (looksLikeCAC) {
    const cacResult = tryVerifyCAC(raw, reference);
    const payload = raw.slice(SPAN_LENGTH);
    const text = tryDecodeText(payload);
    return {
      reference,
      verified: cacResult === true,
      chunkType: "CAC",
      owner: null,
      identifier: null,
      socPayloadReference: null,
      rawBytes: raw,
      text,
      json: tryParseJson(text),
      fetchUrl: url,
      verifiedAt: new Date().toISOString(),
    };
  }

  // Try SOC (Single Owner Chunk — feed updates)
  const socResult = tryVerifySOC(raw, reference);
  if (socResult !== null) {
    return {
      reference,
      verified: socResult.verified,
      chunkType: "SOC",
      owner: socResult.owner,
      identifier: socResult.identifier,
      socPayloadReference: socResult.payloadReference,
      rawBytes: raw,
      text: null,
      json: null,
      fetchUrl: url,
      verifiedAt: new Date().toISOString(),
    };
  }

  // Span didn't match CAC and not an SOC — try CAC anyway (covers edge cases)
  const cacFallback = tryVerifyCAC(raw, reference);
  const payload = raw.slice(SPAN_LENGTH);
  const text = tryDecodeText(payload);
  return {
    reference,
    verified: cacFallback === true,
    chunkType: "CAC",
    owner: null,
    identifier: null,
    socPayloadReference: null,
    rawBytes: raw,
    text,
    json: tryParseJson(text),
    fetchUrl: url,
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Fetch and strictly verify a Swarm sequence feed slot (SOC).
 *
 * Algorithm (mirrors bee-js feed resolution):
 *  1. GET /feeds/{owner}/{topic}?type=sequence — read swarm-feed-index header
 *  2. identifier = keccak256(topic[32] ‖ feedIndex[8 BE])
 *  3. expectedSocRef = keccak256(identifier[32] ‖ ownerAddress[20])
 *  4. GET /chunks/{expectedSocRef} — fetch the SOC chunk
 *  5. Verify signature via ECDSA recovery
 *  6. Check ownerMatches: recovered owner == declared owner
 *  7. Check identifierMatches: chunk identifier == computed identifier
 *
 * @param gatewayUrl   Any Swarm gateway, e.g. "https://bzz.limo"
 * @param ownerAddress 20-byte hex Ethereum address (with or without 0x)
 * @param topic        32-byte hex feed topic
 */
export async function verifiedFetchFeed(
  gatewayUrl: string,
  ownerAddress: string,
  topic: string,
): Promise<VerifiedFeedResult> {
  const gw = gatewayUrl.replace(/\/$/, "");
  const owner = ownerAddress.replace(/^0x/, "").toLowerCase();
  const topicHex = topic.replace(/^0x/, "").toLowerCase().padStart(64, "0");

  // Step 1: Resolve latest feed index via Bee feed API.
  // The Bee API returns binary body + headers:
  //   swarm-feed-index:      current index as 16-char hex (8-byte big-endian uint64)
  //   swarm-feed-index-next: next expected index
  const feedUrl = `${gw}/feeds/${owner}/${topicHex}?type=sequence`;
  const feedResp = await fetch(feedUrl);

  if (!feedResp.ok) {
    throw new Error(`Feed lookup failed: ${feedResp.status} ${feedResp.statusText}`);
  }

  const feedIndexHeader = feedResp.headers.get("swarm-feed-index");
  if (!feedIndexHeader) {
    throw new Error("Bee API did not return swarm-feed-index header — is this a sequence feed?");
  }

  // Consume body to avoid resource leak (we use only the header)
  await feedResp.arrayBuffer();

  const feedIndex = parseFeedIndexHex(feedIndexHeader);

  // Step 2: Compute the feed identifier = keccak256(topic[32] ‖ feedIndex[8 BE])
  const topicBytes = hexToBytes(topicHex);
  const indexBytes = feedIndexToBytes(feedIndex);
  const identifier = Binary.keccak256(Binary.concatBytes(topicBytes, indexBytes));
  const identifierHex = toHex(identifier);

  // Step 3: Compute expected SOC address = keccak256(identifier[32] ‖ owner[20])
  const ownerBytes = hexToBytes(owner);
  const expectedSocRef = toHex(Binary.keccak256(Binary.concatBytes(identifier, ownerBytes)));

  // Step 4: Fetch the SOC chunk at the deterministically computed address
  const chunkUrl = `${gw}/chunks/${expectedSocRef}`;
  const chunkResp = await fetch(chunkUrl);

  if (!chunkResp.ok) {
    throw new Error(
      `SOC chunk fetch failed: ${chunkResp.status} ${chunkResp.statusText} (ref: ${expectedSocRef})`,
    );
  }

  const raw = new Uint8Array(await chunkResp.arrayBuffer());
  const socResult = tryVerifySOC(raw, expectedSocRef);

  if (!socResult) {
    throw new Error(`Chunk at ${expectedSocRef} does not parse as a valid SOC`);
  }

  // Step 5–7: Strict checks
  const signatureValid = socResult.verified;
  const recoveredOwner = socResult.owner?.replace(/^0x/, "").toLowerCase() ?? "";
  const ownerMatches = recoveredOwner === owner;
  const chunkIdentifierHex = socResult.identifier?.toLowerCase() ?? "";
  const identifierMatches = chunkIdentifierHex === identifierHex.toLowerCase();

  // Extract data reference: sequence feed payload = [8-byte timestamp][32-byte reference]
  const socPayload = raw.slice(SOC_PAYLOAD_OFFSET);
  const dataReference =
    socPayload.length >= FEED_TIMESTAMP_LENGTH + FEED_REF_LENGTH
      ? toHex(socPayload.slice(FEED_TIMESTAMP_LENGTH, FEED_TIMESTAMP_LENGTH + FEED_REF_LENGTH))
      : socResult.payloadReference ?? "";

  return {
    reference: expectedSocRef,
    verified: signatureValid && ownerMatches && identifierMatches,
    signatureValid,
    ownerMatches,
    identifierMatches,
    owner: "0x" + recoveredOwner,
    topic: topicHex,
    feedIndex,
    identifier: identifierHex,
    dataReference,
    dataUrl: `${gw}/bytes/${dataReference}`,
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Verify raw chunk bytes against a reference without making any network requests.
 * Useful for unit testing tamper detection.
 *
 * @param raw       Raw chunk bytes (as returned by GET /chunks/{reference})
 * @param reference Expected 64-char hex address
 */
export function verifyRawChunk(
  raw: Uint8Array,
  reference: string,
): { verified: boolean; chunkType: "CAC" | "SOC" } {
  const spanValue = readUint64LE(raw);
  const expectedCACPayload = raw.length - SPAN_LENGTH;

  if (spanValue === expectedCACPayload) {
    return { verified: tryVerifyCAC(raw, reference) === true, chunkType: "CAC" };
  }

  const socResult = tryVerifySOC(raw, reference);
  if (socResult !== null) {
    return { verified: socResult.verified, chunkType: "SOC" };
  }

  // Fallback: try as CAC anyway
  return { verified: tryVerifyCAC(raw, reference) === true, chunkType: "CAC" };
}

// ─── verification internals ──────────────────────────────────────────────────

/**
 * Attempt CAC (Content Addressed Chunk) verification.
 *
 * A CAC chunk has the layout:
 *   [span: 8 bytes little-endian uint64] [payload: 1–4096 bytes]
 *
 * The address is: keccak256(span ‖ BMT_root(zero_padded_payload_to_4096))
 *
 * Returns true/false on success, null if the data is not a valid CAC shape.
 */
function tryVerifyCAC(raw: Uint8Array, reference: string): boolean | null {
  if (raw.length <= SPAN_LENGTH) return null;

  const payloadLength = raw.length - SPAN_LENGTH;
  if (payloadLength > MAX_PAYLOAD) return null;

  try {
    const computedRef = computeCACAddress(raw);
    return computedRef === reference;
  } catch {
    return null;
  }
}

type SOCVerifyResult = {
  verified: boolean;
  owner: string | null;
  identifier: string | null;
  payloadReference: string | null;
};

/**
 * Attempt SOC (Single Owner Chunk) verification.
 *
 * A SOC chunk has the layout:
 *   [identifier: 32 bytes] [signature: 65 bytes] [span: 8 bytes] [payload: …]
 *
 * The address is: keccak256(identifier ‖ ownerAddress)
 * Verification: recover ownerAddress from signature over keccak256(identifier ‖ cacAddress)
 *               then check that the SOC address matches.
 *
 * Returns null if the raw bytes are too short to be a SOC.
 */
function tryVerifySOC(raw: Uint8Array, reference: string): SOCVerifyResult | null {
  if (raw.length < SOC_PAYLOAD_OFFSET + 1) return null;

  try {
    const identifier = raw.slice(SOC_ID_OFFSET, SOC_SIG_OFFSET);
    const sigBytes = raw.slice(SOC_SIG_OFFSET, SOC_SPAN_OFFSET);
    const cacData = raw.slice(SOC_SPAN_OFFSET);   // span + payload

    // Recover the signer from the SOC signature.
    // The signed digest is the raw concatenation: identifier ‖ CAC_address (64 bytes).
    // recoverPublicKey() applies keccak256 internally before the secp256k1 recovery.
    const cacAddress = computeCACAddress(cacData);
    const digest = Binary.concatBytes(identifier, hexToBytes(cacAddress));

    const sig = new Signature(sigBytes);
    const recoveredKey = sig.recoverPublicKey(digest);
    const recoveredOwner = recoveredKey.address();

    // SOC address = keccak256(identifier ‖ ownerAddress)
    const expectedAddress = toHex(
      Binary.keccak256(Binary.concatBytes(identifier, recoveredOwner.toUint8Array())),
    );

    const verified = expectedAddress === reference;

    // SOC payload for a sequence feed: [8-byte timestamp BE] [32-byte content reference]
    const payload = raw.slice(SOC_PAYLOAD_OFFSET);
    const payloadReference =
      payload.length >= SEGMENT_SIZE
        ? toHex(payload.slice(payload.length - SEGMENT_SIZE))
        : null;

    return {
      verified,
      owner: "0x" + recoveredOwner.toString(),
      identifier: toHex(identifier),
      payloadReference,
    };
  } catch {
    return null;
  }
}

// ─── BMT implementation ───────────────────────────────────────────────────────

/**
 * Compute the Swarm CAC address for raw chunk bytes (span + payload).
 * Also exported as `computeCACReference` for use in unit tests.
 *
 * Algorithm (mirrors bee-js bmt.js / calculateChunkAddress):
 *  1. Pad payload to MAX_PAYLOAD (4096) with zeros
 *  2. Split into BRANCHES (128) segments of SEGMENT_SIZE (32) bytes
 *  3. Build a binary Merkle tree: pair-wise keccak256 until one root
 *  4. Return keccak256(span ‖ BMT_root) as hex
 */
function computeCACAddress(raw: Uint8Array): string {
  const span = raw.slice(0, SPAN_LENGTH);
  const payload = raw.slice(SPAN_LENGTH);

  if (payload.length > MAX_PAYLOAD) {
    throw new Error(`Payload ${payload.length} bytes exceeds 4096-byte single-chunk limit`);
  }

  // Zero-pad payload to exactly MAX_PAYLOAD bytes
  const padded = new Uint8Array(MAX_PAYLOAD);
  padded.set(payload);

  // Partition into SEGMENT_SIZE segments and reduce with keccak256
  const segments = Binary.partition(padded, SEGMENT_SIZE);
  const bmtRoot = Binary.log2Reduce(segments, (a: Uint8Array, b: Uint8Array) =>
    Binary.keccak256(Binary.concatBytes(a, b)),
  );

  const chunkHash = Binary.keccak256(Binary.concatBytes(span, bmtRoot));
  return toHex(chunkHash);
}

/** Exported alias for `computeCACAddress` — useful in unit tests. */
export const computeCACReference = computeCACAddress;

// ─── feed helpers ─────────────────────────────────────────────────────────────

/**
 * Encode a feed index as an 8-byte big-endian Uint8Array.
 * Matches bee-js `FeedIndex.fromBigInt(n)` / `Binary.numberToUint64(n, 'BE')`.
 */
export function feedIndexToBytes(index: number): Uint8Array {
  const buf = new Uint8Array(8);
  let n = index;
  for (let i = 7; i >= 0; i--) {
    buf[i] = n & 0xff;
    n = Math.floor(n / 256);
  }
  return buf;
}

/**
 * Parse a 16-char hex string (8-byte big-endian uint64) from the
 * `swarm-feed-index` response header into a JavaScript number.
 */
export function parseFeedIndexHex(hex: string): number {
  const clean = hex.replace(/^0x/, "").padStart(16, "0");
  let value = 0;
  for (let i = 0; i < 8; i++) {
    value = value * 256 + parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return value;
}

// ─── shared helpers ───────────────────────────────────────────────────────────

// Read a little-endian uint64 as a regular number (safe up to 2^53)
function readUint64LE(bytes: Uint8Array): number {
  let value = 0;
  for (let i = 0; i < 8; i++) {
    value += bytes[i] * Math.pow(256, i);
  }
  return value;
}

// Pure JS hex encoding — works in browsers and Node.js (no Buffer needed)
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, "");
  const result = new Uint8Array(clean.length / 2);
  for (let i = 0; i < result.length; i++) {
    result[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return result;
}

function tryDecodeText(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function tryParseJson(text: string | null): unknown | null {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
