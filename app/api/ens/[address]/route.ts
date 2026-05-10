import { resolveEnsAvatar, resolveEnsName } from "@/lib/ens/resolve";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/ens/[address]">,
) {
  const { address } = await ctx.params;

  if (!address || !address.startsWith("0x")) {
    return Response.json({ error: "Invalid address" }, { status: 400 });
  }

  const name = await resolveEnsName(address);
  const avatar = name ? await resolveEnsAvatar(name) : null;

  return Response.json({ address, name, avatar });
}
