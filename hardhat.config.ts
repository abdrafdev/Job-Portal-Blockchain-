import hardhatEthersPlugin from "@nomicfoundation/hardhat-ethers";
import { defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatEthersPlugin],
  solidity: {
    // Hardhat 3 supports different "profiles". Keep the same compiler version for both.
    profiles: {
      default: {
        version: "0.8.24",
      },
      production: {
        version: "0.8.24",
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
    // Used by the Next.js app + MetaMask (JSON-RPC).
    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545",
      accounts: "remote",
    },

    // Useful for running scripts/tests without an external node.
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
  },
});
