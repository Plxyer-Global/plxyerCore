import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
const config: HardhatUserConfig = {
  solidity: "0.8.19",
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: [":PlxyerStore$", ":Airdrop$"],
  },
  gasReporter: {
    enabled: true,
  },
};

export default config;
