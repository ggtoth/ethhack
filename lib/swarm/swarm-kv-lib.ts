/**
 * SwarmKV — A simple key-value store built on Swarm decentralized storage.
 *
 * Every key maps to a Swarm Feed (identified by owner address + topic).
 * Feed updates are mutable on-chain pointers — updating a key overwrites
 * the feed without creating orphaned data references visible to the user.
 * The key index is itself a feed, so the entire store lives on Swarm.
 *
 * Usage:
 *   const kv = new SwarmKV({ privateKey: '0xabc...' })
 *   await kv.put('user:123', { name: 'Alice' })
 *   const val = await kv.get('user:123')   // { name: 'Alice' }
 *   const keys = await kv.list()           // ['user:123']
 *   await kv.delete('user:123')
 */

import { Bee, PrivateKey, NULL_STAMP, BatchId, type Topic, type Reference } from "@ethersphere/bee-js";
import { createHash } from "crypto";

const INDEX_KEY = "__swarm_kv_index_v1__";
const DELETED_SENTINEL = "__swarm_kv_deleted__";

export type SwarmKVConfig = {
  /** Bee node or gateway URL. Defaults to https://bzz.limo */
  beeApiUrl?: string;
  /** 64-char hex private key (no 0x prefix) used to sign feed updates. */
  privateKey: string;
  /** Postage batch ID. Leave empty to use NULL_STAMP (bzz.limo rewrites it). */
  stamp?: string;
  /** Public gateway URL for building shareable links. */
  gatewayUrl?: string;
};

export type SwarmKVPutResult = {
  key: string;
  /** Immutable content reference — the exact bytes stored. */
  dataReference: string;
  /** Feed update reference — points to the feed slot containing the data reference. */
  feedReference: string;
  /** Feed manifest reference — a permanent /bzz/ URL that always resolves to the latest value. */
  manifestReference: string;
  /** Direct bytes URL (immutable, content-addressed). */
  url: string;
  /** Manifest URL (mutable — always points to the latest value via Feed). */
  manifestUrl: string;
};

export type SwarmKVGetResult = {
  key: string;
  value: string | object | Uint8Array | null;
  dataReference: string;
  url: string;
};

export class SwarmKV {
  private bee: Bee;
  private pk: PrivateKey;
  private stamp: BatchId;
  private gatewayUrl: string;

  constructor(config: SwarmKVConfig) {
    const beeUrl = config.beeApiUrl ?? "https://bzz.limo";
    this.pk = new PrivateKey(config.privateKey.replace("0x", ""));
    this.bee = new Bee(beeUrl, { signer: this.pk });
    this.stamp = config.stamp ? new BatchId(config.stamp) : NULL_STAMP;
    this.gatewayUrl = config.gatewayUrl ?? "https://bzz.limo";
  }

  /** Ethereum address derived from the private key. Identifies this store's feeds. */
  get ownerAddress(): string {
    return "0x" + this.pk.publicKey().address().toString();
  }

  /**
   * Store a value under a key. Overwrites any existing value.
   * Supports strings, JSON objects, and binary (Uint8Array).
   */
  async put(key: string, value: string | object | Uint8Array): Promise<SwarmKVPutResult> {
    const serialized = serialize(value);

    // 1. Upload the value to Swarm (content-addressed, immutable)
    const dataUpload = await this.bee.uploadData(this.stamp, serialized);
    const dataRef = dataUpload.reference;

    // 2. Update the key's feed to point to the new data reference
    const topic = keyToTopic(key);
    const writer = this.bee.makeFeedWriter(topic);
    const feedUpload = await writer.uploadReference(this.stamp, dataRef);

    // 3. Create (or re-use) the feed manifest — a permanent /bzz/ URL that always
    //    resolves to the latest feed value without needing to know the current reference.
    const owner = this.pk.publicKey().address();
    const manifestRef = await this.bee.createFeedManifest(this.stamp, topic, owner);

    // 4. Update the global key index (also a feed)
    await this.addToIndex(key);

    return {
      key,
      dataReference: dataRef.toString(),
      feedReference: feedUpload.reference.toString(),
      manifestReference: manifestRef.toString(),
      url: `${this.gatewayUrl}/bytes/${dataRef.toString()}`,
      manifestUrl: `${this.gatewayUrl}/bzz/${manifestRef.toString()}`,
    };
  }

  /**
   * Retrieve the value stored under a key.
   * Returns null if the key does not exist or was deleted.
   */
  async get(key: string): Promise<SwarmKVGetResult | null> {
    try {
      const topic = keyToTopic(key);
      const reader = this.bee.makeFeedReader(topic, this.pk.publicKey().address());
      const latest = await reader.downloadReference();
      const dataRef = latest.reference;

      const raw = await this.bee.downloadData(dataRef);
      const text = raw.toUtf8();

      if (text === DELETED_SENTINEL) {
        return null;
      }

      return {
        key,
        value: deserialize(text),
        dataReference: dataRef.toString(),
        url: `${this.gatewayUrl}/bytes/${dataRef.toString()}`,
      };
    } catch {
      return null;
    }
  }

  /**
   * Delete a key by writing a deletion sentinel to its feed.
   * The feed slot remains but the key is removed from the index.
   */
  async delete(key: string): Promise<void> {
    const dataUpload = await this.bee.uploadData(this.stamp, DELETED_SENTINEL);
    const topic = keyToTopic(key);
    const writer = this.bee.makeFeedWriter(topic);
    await writer.uploadReference(this.stamp, dataUpload.reference);
    await this.removeFromIndex(key);
  }

  /**
   * List all keys currently in the store (excludes deleted keys).
   */
  async list(): Promise<string[]> {
    return this.readIndex();
  }

  /**
   * Returns true if the key exists and is not deleted.
   */
  async has(key: string): Promise<boolean> {
    const result = await this.get(key);
    return result !== null;
  }

  // --- Index management (the index is itself a Swarm Feed) ---

  private async readIndex(): Promise<string[]> {
    try {
      const topic = keyToTopic(INDEX_KEY);
      const reader = this.bee.makeFeedReader(topic, this.pk.publicKey().address());
      const latest = await reader.downloadReference();
      const raw = await this.bee.downloadData(latest.reference);
      return JSON.parse(raw.toUtf8()) as string[];
    } catch {
      return [];
    }
  }

  private async writeIndex(keys: string[]): Promise<void> {
    const upload = await this.bee.uploadData(this.stamp, JSON.stringify(keys));
    const topic = keyToTopic(INDEX_KEY);
    const writer = this.bee.makeFeedWriter(topic);
    await writer.uploadReference(this.stamp, upload.reference);
  }

  private async addToIndex(key: string): Promise<void> {
    const current = await this.readIndex();
    if (!current.includes(key)) {
      await this.writeIndex([...current, key]);
    }
  }

  private async removeFromIndex(key: string): Promise<void> {
    const current = await this.readIndex();
    await this.writeIndex(current.filter((k) => k !== key));
  }
}

// --- Helpers ---

function keyToTopic(key: string): Topic {
  const { Topic } = require("@ethersphere/bee-js");
  const hash = createHash("sha256").update(key).digest("hex");
  return new Topic(hash);
}

function serialize(value: string | object | Uint8Array): string | Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function deserialize(text: string): string | object {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Create a SwarmKV instance from environment variables.
 * BEE_API_URL, SWARM_KV_PRIVATE_KEY, BEE_POSTAGE_BATCH_ID, NEXT_PUBLIC_SWARM_GATEWAY
 */
export function createSwarmKVFromEnv(): SwarmKV {
  const privateKey = process.env.SWARM_KV_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("SWARM_KV_PRIVATE_KEY is not set in environment variables.");
  }

  return new SwarmKV({
    beeApiUrl: process.env.BEE_API_URL ?? "https://bzz.limo",
    privateKey,
    stamp: process.env.BEE_POSTAGE_BATCH_ID ?? NULL_STAMP.toString(),
    gatewayUrl: process.env.NEXT_PUBLIC_SWARM_GATEWAY ?? "https://bzz.limo",
  });
}

export function isSwarmKVConfigured(): boolean {
  return !!process.env.SWARM_KV_PRIVATE_KEY;
}
