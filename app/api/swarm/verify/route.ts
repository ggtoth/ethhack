import { SwarmVerificationError, verifySwarmResource } from "swarm-verified-fetch";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readJson(request);
  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!url) {
    return Response.json({ error: "A URL is required for Swarm verification." }, { status: 400 });
  }

  try {
    const result = await verifySwarmResource(url, {
      gatewayBaseUrl: getSwarmGatewayBaseUrl(),
      requestInit: {
        cache: "no-store",
      },
    });

    return Response.json({
      storageKind:
        result.verification.kind === "immutable"
          ? "swarm_immutable"
          : "swarm_feed",
      verification: result.verification,
    });
  } catch (error) {
    if (
      error instanceof SwarmVerificationError &&
      error.code === "UNSUPPORTED_URL"
    ) {
      return Response.json({
        storageKind: "generic_url",
        verification: null,
      });
    }

    if (error instanceof SwarmVerificationError) {
      return Response.json(
        {
          error: error.message,
          code: error.code,
          context: error.context ?? null,
        },
        { status: error.code === "UNSUPPORTED_RESOURCE_SHAPE" ? 422 : 502 },
      );
    }

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Swarm verification failed.",
      },
      { status: 500 },
    );
  }
}

function getSwarmGatewayBaseUrl() {
  return process.env.SWARM_GATEWAY_URL ?? process.env.NEXT_PUBLIC_SWARM_GATEWAY_URL;
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
