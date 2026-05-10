import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  transport: http("https://ethereum.publicnode.com"),
});

export async function resolveEnsName(address: string): Promise<string | null> {
  try {
    return await client.getEnsName({ address: address as `0x${string}` });
  } catch {
    return null;
  }
}

export async function resolveEnsAvatar(name: string): Promise<string | null> {
  try {
    return await client.getEnsAvatar({ name });
  } catch {
    return null;
  }
}
