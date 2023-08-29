import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import { NetworkUserConfig } from "hardhat/types";
import "dotenv/config";

const bscTestnet: NetworkUserConfig = {
  url: "https://data-seed-prebsc-1-s2.binance.org:8545",
  chainId: 97,
  accounts: [process.env.KEY_97!],
};
const bsc: NetworkUserConfig = {
  url: "https://bsc-dataseed.binance.org/",
  chainId: 56,
  accounts: [process.env.KEY_56!],
};
const config: HardhatUserConfig = {
  solidity: "0.8.19",
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: [":PlxyerStore$", ":Airdrop$"],
  },
  etherscan: {
    apiKey: {
      bsc:process.env?.BSCSCAN_API_KEY || "",
      bscTestnet:process.env?.BSCSCAN_API_KEY || "",
    }
  }, 
  networks: {
    testnet: bscTestnet,
    bsc: bsc,
  },
  gasReporter: {
    enabled: true,
  },
};

export default config;
