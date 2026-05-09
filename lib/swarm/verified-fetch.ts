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
 *    address = keccak256(span ‖ BMT_root(payload))
 *    Verification: recompute the BMT hash and compare to the reference.
 *
 *  SOC — Single Owner Chunk (mutable feed updates)
 *    address = keccak256(identifier ‖ ownerAddress)
 *    Verification: recover the Ethereum signer from the payload signature and
 *    check that keccak256(identifier ‖ recoveredOwner) matches the reference.
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
 *   // Mutable feed
 *   const f = await verifiedFetchFeed("https://bzz.limo", ownerAddress, topic);
 *   f.verified        // true — SOC signature is valid
 *   f.owner           // recovered Ethereum address
 *   f.dataReference   // content reference the feed currently points to
 *
 * Scope
 * ─────
 * Handles single-chunk content (≤ 4096 bytes payload). Multi-chunk files require
 * walking the chunk tree — out of scope for this release, documented below.
 */

import { Binary } from "cafe-utility";
import { Signature, EthAddress, Topic, Identifier } from "@ethersphere/bee-js";

// ─── constants ───────────────────────────────────────────────────────────────

const SPAN_LENGTH = 8;          // little-endian uint64 byte count
const SEGMENT_SIZE = 32;        // one keccak256 output = one BMT segment
const MAX_PAYLOAD = 4096;       // maximum single-chunk payload (4 KiB)
const BRANCHES = 128;           // MAX_PAYLOAD / SEGMENT_SIZE

// SOC byte layout: [identifier 32] [signature 65] [span 8] [payload …]
const SOC_ID_OFFSET = 0;
const SOC_SIG_OFFSET = 32;
const SOC_SPAN_OFFSET = 32 + 65;
const SOC_PAYLOAD_OFFSET = 32 + 65 + 8;
const SOC_OVERHEAD = SOC_PAYLOAD_OFFSET;   // 105 bytes before the CAC data

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

export type VerifiedFeedResult = {
  /** Swarm reference of the SOC chunk (the feed slot). */
  reference: string;
  /** True when the SOC signature is cryptographically valid. */
  verified: boolean;
  /** Recovered Ethereum address of the feed owner. */
  owner: string;
  /** Topic of the feed (32-byte hex). */
  topic: string;
  /** The 32-byte immutable content reference this feed slot points to. */
  dataReference: string;
  /** Convenience URL: gateway + /bytes/ + dataReference. */
  dataUrl: string;
  verifiedAt: string;
};

// ─── core API ────────────────────────────────────────────────────────────────

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
 * Fetch and verify a Swarm Feed slot (SOC).
 *
 * Given an owner address and topic, resolves the latest feed index via the
 * Swarm feed API, downloads the SOC chunk, and verifies the signature.
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
  const owner = ownerAddress.replace(/^0x/, "");
  const topicHex = topic.replace(/^0x/, "");

  // Resolve latest feed update — Swarm returns the SOC reference in Swarm-Feed-Index header
  const feedUrl = `${gw}/feeds/${owner}/${topicHex}?type=sequence`;
  const feedResp = await fetch(feedUrl);

  if (!feedResp.ok) {
    throw new Error(`Feed lookup failed: ${feedResp.status} ${feedResp.statusText}`);
  }

  const feedJson = (await feedResp.json()) as { reference: string };
  const socRef = feedJson.reference;

  // Download and verify the SOC chunk
  const chunkUrl = `${gw}/chunks/${socRef}`;
  const chunkResp = await fetch(chunkUrl);

  if (!chunkResp.ok) {
    throw new Error(`SOC chunk fetch failed: ${chunkResp.status}`);
  }

  const raw = new Uint8Array(await chunkResp.arrayBuffer());
  const socResult = tryVerifySOC(raw, socRef);

  if (!socResult) {
    throw new Error(`Chunk at ${socRef} is not a valid SOC`);
  }

  return {
    reference: socRef,
    verified: socResult.verified,
    owner: socResult.owner ?? owner,
    topic: topicHex,
    dataReference: socResult.payloadReference ?? "",
    dataUrl: `${gw}/bytes/${socResult.payloadReference}`,
    verifiedAt: new Date().toISOString(),
  };
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
  if (raw.length < SOC_OVERHEAD + 1) return null;

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

    // The SOC payload for a feed is:
    //   [8-byte index (little-endian feed epoch)] [32-byte wrapped CAC reference]
    // Extract the 32-byte content reference (last 32 bytes of payload)
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

// ─── helpers ─────────────────────────────────────────────────────────────────

// Read a little-endian uint64 as a regular number (safe up to 2^53)
function readUint64LE(bytes: Uint8Array): number {
  let value = 0;
  for (let i = 0; i < 8; i++) {
    value += bytes[i] * Math.pow(256, i);
  }
  return value;
}

function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
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
