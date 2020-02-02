var FilesDB = artifacts.require("../contracts/FilesDB.sol");
module.exports = function(deployer) {
    deployer.deploy(FilesDB);
}


