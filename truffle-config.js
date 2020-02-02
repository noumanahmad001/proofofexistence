const path = require("path");
const HDWalletProvider = require('@truffle/hdwallet-provider');

const fs = require('fs');
const mnemonic = fs.readFileSync('secret.txt').toString().trim();  // outside the repo

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    ganache: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    test: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777"
    },
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/v3/5b4e9a6390944d03a8aca2a24c254de8`),
      network_id: 4,       // rinkeby's id
      gas: 0x98705c,        // rinkeby has a lower block limit than mainnet
      gasPrice: 10000000000
  }
  }
};


