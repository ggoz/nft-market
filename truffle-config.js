const HDWalletProvider = require("@truffle/hdwallet-provider");
const keys = require("./keys.json");

module.exports = {
  networks: {
    sepolia: {
      provider: () => new HDWalletProvider(keys.DEPLOY_KEY, keys.ANKR_SEPOLIA_URL),
      network_id: "11155111",
      gas: 5000000,
      gasPrice: 20000000000, // 14 Gwei
      timeoutBlocks: 50000,
      networkCheckTimeout: 5000000
    }
  },
  compilers: {
    solc: {
      version: "0.8.13",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  contracts_build_directory: "./public/contracts"
};
