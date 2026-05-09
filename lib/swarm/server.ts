import { createHash } from "node:crypto";

import { Bee, NULL_STAMP } from "@ethersphere/bee-js";
import { computeSwarmFileReference, verifySwarmResource } from "swarm-verified-fetch";

type PostageBatchId = string | { toString(): string };

type SwarmUploadConfig = {
  beeApiUrl: string;
  gatewayUrl: string;
  postageBatchId: PostageBatchId;
  pin: boolean;
  deferred: boolean;
  act: boolean;
  actHistoryAddress: string | null;
};

type BeeUploadResult = {
  reference: {
    toHex(): string;
  };
};

type BeeClientLike = {
  uploadData(
    postageBatchId: PostageBatchId,
    data: Uint8Array,
    options?: {
      pin?: boolean;
      deferred?: boolean;
      act?: boolean;
      actHistoryAddress?: string;
    },
  ): Promise<BeeUploadResult>;
};

export type SwarmUploadDescriptor = {
  clientId?: string;
  role?: "source" | "preview" | "other";
  expectedReference?: string | null;
  sha256?: string | null;
  filePath?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type SwarmUploadedFile = {
  clientId: string;
  role: "source" | "preview" | "other";
  fileName: string;
  contentType: string;
  size: number;
  sha256: string;
  localReference: string;
  gatewayReference: string;
  referenceMatchesGateway: boolean;
  referenceMatchesClient: boolean | null;
  downloadUrl: string;
  gatewayUrl: string;
  expectedReference: string | null;
  filePath: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SwarmReviewAssetInput = {
  clientId: string;
  reference: string;
  fileName: string;
  contentType?: string | null;
  filePath?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export async function uploadFilesToSwarm(
  files: File[],
  descriptors: SwarmUploadDescriptor[] = [],
) {
  const config = getSwarmUploadConfig();
  const bee = createBeeClient(config.beeApiUrl);

  return Promise.all(
    files.map((file, index) =>
      uploadFileToSwarm(file, descriptors[index] ?? {}, config, bee, index),
    ),
  );
}

export async function downloadSwarmAssetForReview(
  asset: SwarmReviewAssetInput,
  role: "source" | "preview" | "other",
) {
  const config = getSwarmUploadConfig();
  const resource = await verifySwarmResource(`bzz://${asset.reference}`, {
    gatewayBaseUrl: config.gatewayUrl,
    requestInit: {
      cache: "no-store",
    },
  });

  const contentType =
    asset.contentType?.trim() ||
    resource.response.headers.get("content-type") ||
    "application/octet-stream";
  const bytes = new Uint8Array(await resource.response.arrayBuffer());
  const file = new File([bytes], asset.fileName, {
    type: contentType,
  });

  return {
    file,
    role,
    clientId: asset.clientId,
    filePath: asset.filePath ?? null,
    createdAt: asset.createdAt ?? null,
    updatedAt: asset.updatedAt ?? null,
    swarm: {
      requestedReference: asset.reference,
      resolvedReference: resource.verification.resolvedReference,
      gatewayUrl: resource.verification.gatewayUrl,
      verifiedAt: resource.verification.verifiedAt,
      referenceMatchesRequest:
        resource.verification.resolvedReference === asset.reference,
    },
  };
}

export function getSwarmUploadConfig(): SwarmUploadConfig {
  const beeApiUrl = trimTrailingSlash(process.env.SWARM_BEE_API_URL);
  const gatewayUrl = trimTrailingSlash(
    process.env.SWARM_GATEWAY_URL ??
      process.env.NEXT_PUBLIC_SWARM_GATEWAY_URL ??
      process.env.SWARM_BEE_API_URL,
  );
  const postageBatchId = resolvePostageBatchId(
    beeApiUrl,
    process.env.SWARM_POSTAGE_BATCH_ID,
  );

  if (!beeApiUrl) {
    throw new Error("SWARM_BEE_API_URL is not set.");
  }

  if (!gatewayUrl) {
    throw new Error(
      "SWARM_GATEWAY_URL or NEXT_PUBLIC_SWARM_GATEWAY_URL is not set.",
    );
  }

  if (!postageBatchId) {
    throw new Error(
      "SWARM_POSTAGE_BATCH_ID is not set. Use a real postage batch ID, or set it to NULL_STAMP when uploading through bzz.limo.",
    );
  }

  return {
    beeApiUrl,
    gatewayUrl,
    postageBatchId,
    pin: parseBoolean(process.env.SWARM_UPLOAD_PIN, true),
    deferred: parseBoolean(process.env.SWARM_UPLOAD_DEFERRED, false),
    act: parseBoolean(process.env.SWARM_ACT, false),
    actHistoryAddress: process.env.SWARM_ACT_HISTORY_ADDRESS?.trim() || null,
  };
}

async function uploadFileToSwarm(
  file: File,
  descriptor: SwarmUploadDescriptor,
  config: SwarmUploadConfig,
  bee: BeeClientLike,
  index: number,
): Promise<SwarmUploadedFile> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const localReference = computeSwarmFileReference(bytes).reference;
  const sha256 = createHash("sha256").update(Buffer.from(bytes)).digest("hex");

  if (descriptor.sha256 && descriptor.sha256 !== sha256) {
    throw new Error(
      `Client SHA-256 mismatch for ${file.name}: expected ${descriptor.sha256}, got ${sha256}.`,
    );
  }

  const uploadOptions =
    config.act && config.actHistoryAddress
      ? {
          pin: config.pin,
          deferred: config.deferred,
          act: true,
          actHistoryAddress: config.actHistoryAddress,
        }
      : {
          pin: config.pin,
          deferred: config.deferred,
        };

  let uploadResult: BeeUploadResult;

  try {
    uploadResult = await bee.uploadData(
      config.postageBatchId,
      bytes,
      uploadOptions,
    );
  } catch (error) {
    throw new Error(
      `Swarm upload failed for ${file.name}: ${
        error instanceof Error ? error.message : "Unknown bee-js error."
      }`,
    );
  }

  const gatewayReference = uploadResult.reference?.toHex?.().trim().toLowerCase();

  if (!gatewayReference || !/^[a-f0-9]{64}$/i.test(gatewayReference)) {
    throw new Error(`Swarm upload returned an invalid reference for ${file.name}.`);
  }

  if (gatewayReference !== localReference) {
    throw new Error(
      `Swarm gateway reference mismatch for ${file.name}: local ${localReference}, gateway ${gatewayReference}.`,
    );
  }

  const expectedReference = descriptor.expectedReference?.trim().toLowerCase() ?? null;

  if (expectedReference && expectedReference !== localReference) {
    throw new Error(
      `Client Swarm reference mismatch for ${file.name}: expected ${expectedReference}, local ${localReference}.`,
    );
  }

  return {
    clientId: descriptor.clientId?.trim() || `file_${index + 1}`,
    role: descriptor.role ?? "other",
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
    size: file.size,
    sha256,
    localReference,
    gatewayReference,
    referenceMatchesGateway: gatewayReference === localReference,
    referenceMatchesClient: expectedReference
      ? expectedReference === localReference
      : null,
    downloadUrl: `${config.gatewayUrl}/bytes/${gatewayReference}`,
    gatewayUrl: config.gatewayUrl,
    expectedReference,
    filePath: descriptor.filePath ?? null,
    createdAt: descriptor.createdAt ?? null,
    updatedAt: descriptor.updatedAt ?? null,
  };
}

function trimTrailingSlash(value?: string | null) {
  const trimmed = value?.trim();

  return trimmed ? trimmed.replace(/\/+$/, "") : "";
}

function resolvePostageBatchId(
  beeApiUrl: string,
  rawValue?: string | null,
): PostageBatchId | null {
  const trimmed = rawValue?.trim();

  if (trimmed) {
    return trimmed.toUpperCase() === "NULL_STAMP" ? NULL_STAMP : trimmed;
  }

  return isBzzLimoUrl(beeApiUrl) ? NULL_STAMP : null;
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function createBeeClient(url: string): BeeClientLike {
  const mockFactory = (
    globalThis as typeof globalThis & {
      __smartjobsCreateBeeClient?: (url: string) => BeeClientLike;
    }
  ).__smartjobsCreateBeeClient;

  if (mockFactory) {
    return mockFactory(url);
  }

  return new Bee(url);
}

function isBzzLimoUrl(url: string) {
  try {
    return new URL(url).hostname.toLowerCase() === "bzz.limo";
  } catch {
    return false;
  }
}
