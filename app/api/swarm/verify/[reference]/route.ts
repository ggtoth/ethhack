import { verifiedFetch } from "@/lib/swarm/verified-fetch";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/swarm/verify/[reference]">,
) {
  try {
    const { reference } = await ctx.params;

    if (!reference || reference.length !== 64) {
      return Response.json(
        { error: "A valid 64-character Swarm reference is required." },
        { status: 400 },
      );
    }

    const gatewayUrl = process.env.BEE_API_URL ?? "https://bzz.limo";
    const result = await verifiedFetch(gatewayUrl, reference);

    return Response.json({
      reference: result.reference,
      verified: result.verified,
      chunkType: result.chunkType,
      // CAC fields
      data: result.json ?? result.text,
      // SOC fields
      owner: result.owner,
      identifier: result.identifier,
      socPayloadReference: result.socPayloadReference,
      fetchUrl: result.fetchUrl,
      verifiedAt: result.verifiedAt,
      // Explain the trust model
      trustModel:
        result.chunkType === "CAC"
          ? "BMT hash recomputed client-side and compared to the reference — " +
            "content is cryptographically proven correct regardless of which gateway served it."
          : "SOC Ethereum signature verified — the feed update is signed by the owner's private key, " +
            "proven without trusting the gateway.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Swarm verify failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
