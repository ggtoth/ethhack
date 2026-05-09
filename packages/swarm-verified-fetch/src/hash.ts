import { hexToBytes, keccak256 } from "viem";

const CHUNK_PAYLOAD_SIZE = 4096;
const SEGMENT_SIZE = 32;
const SEGMENT_COUNT = CHUNK_PAYLOAD_SIZE / SEGMENT_SIZE;

type SwarmChunkNode = {
  payloadLength: number;
  reference: string;
};

export function computeSwarmFileReference(payload: Uint8Array) {
  const leaves = chunkPayload(payload).map((chunk) => ({
    payloadLength: chunk.length,
    reference: computeContentAddressedChunkReference(chunk, chunk.length),
  }));

  const normalizedLeaves = leaves.length > 0 ? leaves : [{ payloadLength: 0, reference: computeContentAddressedChunkReference(new Uint8Array(0), 0) }];
  let currentLevel = normalizedLeaves;

  while (currentLevel.length > 1) {
    const nextLevel: SwarmChunkNode[] = [];

    for (let index = 0; index < currentLevel.length; index += SEGMENT_COUNT) {
      const group = currentLevel.slice(index, index + SEGMENT_COUNT);
      const payloadBytes = concatBytes(group.map((entry) => hexToBytes(`0x${entry.reference}`)));
      const payloadLength = group.reduce((sum, entry) => sum + entry.payloadLength, 0);

      nextLevel.push({
        payloadLength,
        reference: computeContentAddressedChunkReference(payloadBytes, payloadLength),
      });
    }

    currentLevel = nextLevel;
  }

  return {
    chunkCount: normalizedLeaves.length,
    reference: currentLevel[0].reference,
  };
}

export function computeContentAddressedChunkReference(
  payload: Uint8Array,
  spanLength: number,
) {
  if (payload.length > CHUNK_PAYLOAD_SIZE) {
    throw new Error("Swarm chunk payloads cannot exceed 4096 bytes.");
  }

  const root = computeBmtRoot(payload);
  const span = spanBytes(spanLength);

  return stripHexPrefix(keccak256(concatBytes([span, root])));
}

export function computeBmtRoot(payload: Uint8Array) {
  const paddedPayload = new Uint8Array(CHUNK_PAYLOAD_SIZE);
  paddedPayload.set(payload);

  let level: Uint8Array[] = Array.from({ length: SEGMENT_COUNT }, (_, index) =>
    paddedPayload.slice(index * SEGMENT_SIZE, (index + 1) * SEGMENT_SIZE),
  );

  while (level.length > 1) {
    const nextLevel: Uint8Array[] = [];

    for (let index = 0; index < level.length; index += 2) {
      nextLevel.push(hashBytes(concatBytes([level[index], level[index + 1]])));
    }

    level = nextLevel;
  }

  return level[0];
}

function chunkPayload(payload: Uint8Array) {
  if (payload.length === 0) {
    return [new Uint8Array(0)];
  }

  const chunks: Uint8Array[] = [];

  for (let index = 0; index < payload.length; index += CHUNK_PAYLOAD_SIZE) {
    chunks.push(payload.slice(index, index + CHUNK_PAYLOAD_SIZE));
  }

  return chunks;
}

function spanBytes(length: number) {
  const view = new DataView(new ArrayBuffer(8));
  view.setBigUint64(0, BigInt(length), true);

  return new Uint8Array(view.buffer);
}

function hashBytes(value: Uint8Array) {
  return hexToBytes(toHexString(keccak256(value)));
}

function concatBytes(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

function toHexString(value: `0x${string}`) {
  return value;
}

function stripHexPrefix(value: `0x${string}`) {
  return value.slice(2);
}

export const __internal = {
  chunkPayload,
  concatBytes,
  spanBytes,
};
