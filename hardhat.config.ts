import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { defineConfig } from "hardhat/config";

for (const envFile of [".env", ".env.local"]) {
  try {
    process.loadEnvFile(envFile);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code !== "ENOENT") {
      throw error;
    }
  }
}

const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;
const sepoliaPrivateKey = process.env.SEPOLIA_PRIVATE_KEY;

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    ...(sepoliaRpcUrl !== undefined && sepoliaPrivateKey !== undefined
      ? {
          sepolia: {
            type: "http" as const,
            chainType: "l1" as const,
            url: sepoliaRpcUrl,
            accounts: [sepoliaPrivateKey],
          },
        }
      : {}),
  },
  verify: {
    etherscan: etherscanApiKey
      ? {
          enabled: true,
          apiKey: etherscanApiKey,
        }
      : {
          enabled: false,
        },
  },
});
