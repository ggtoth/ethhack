import type { SwarmUploadResult } from "./types";

function getBeeApiUrl(): string {
  return process.env.BEE_API_URL ?? "http://localhost:1633";
}

function getPostageBatchId(): string {
  const id = process.env.BEE_POSTAGE_BATCH_ID;

  if (!id || id.trim() === "") {
    throw new Error(
      "BEE_POSTAGE_BATCH_ID is not configured. Buy a postage batch on your Bee node first.",
    );
  }

  return id.trim();
}

function getGatewayUrl(): string {
  return process.env.NEXT_PUBLIC_SWARM_GATEWAY ?? "https://gateway.ethswarm.org";
}

function buildPublicJsonUrl(reference: string): string {
  return `${getGatewayUrl()}/bytes/${reference}`;
}

function buildPublicFileUrl(reference: string): string {
  return `${getGatewayUrl()}/bzz/${reference}`;
}

export async function uploadJson(data: unknown): Promise<SwarmUploadResult> {
  const batchId = getPostageBatchId();
  const beeUrl = getBeeApiUrl();
  const body = JSON.stringify(data);

  const response = await fetch(`${beeUrl}/bytes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Swarm-Postage-Batch-Id": batchId,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);

    throw new Error(`Bee node upload failed (${response.status}): ${text}`);
  }

  const result = (await response.json()) as { reference: string };

  return {
    reference: result.reference,
    url: buildPublicJsonUrl(result.reference),
  };
}

export async function uploadFile(
  buffer: ArrayBuffer,
  filename: string,
  contentType: string,
): Promise<SwarmUploadResult> {
  const batchId = getPostageBatchId();
  const beeUrl = getBeeApiUrl();

  const response = await fetch(`${beeUrl}/bzz`, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      "Swarm-Postage-Batch-Id": batchId,
      "Content-Disposition": `inline; filename="${filename}"`,
    },
    body: buffer,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);

    throw new Error(`Bee node file upload failed (${response.status}): ${text}`);
  }

  const result = (await response.json()) as { reference: string };

  return {
    reference: result.reference,
    url: buildPublicFileUrl(result.reference),
  };
}

export async function downloadBytes(reference: string): Promise<ArrayBuffer> {
  const beeUrl = getBeeApiUrl();
  const response = await fetch(`${beeUrl}/bytes/${reference}`);

  if (!response.ok) {
    throw new Error(
      `Bee node download failed (${response.status}): ${response.statusText}`,
    );
  }

  return response.arrayBuffer();
}

export async function downloadJson(reference: string): Promise<unknown> {
  const buffer = await downloadBytes(reference);
  const text = new TextDecoder().decode(buffer);

  return JSON.parse(text);
}

export function isBeeNodeConfigured(): boolean {
  return !!(
    process.env.BEE_API_URL &&
    process.env.BEE_POSTAGE_BATCH_ID &&
    process.env.BEE_POSTAGE_BATCH_ID.trim() !== ""
  );
}
