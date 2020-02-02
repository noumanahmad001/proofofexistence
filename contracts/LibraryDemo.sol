pragma solidity >=0.4.21 <0.7.0;


/**
@title Library for Demo
@author Nouman Ahmad
@notice Not using in my contract, only for demo purpose
 */

library DataStorage {
    // hold its data in the calling contract.
    // saving user files and pending updates for demo purpose only
    struct Data { mapping(address => string) userFiles;
        mapping (uint256 => string) isPendingUpdates; }

    // Note that the first parameter is of type "storage
    // reference" and thus only its storage address
    function insertFileForUser(Data storage self, string memory _hash)
        public {
        self.userFiles[msg.sender] = _hash;
    }

    // Get the file against user
    function getFileForUser(Data storage self)
    public view returns (string memory)
    {
        return self.userFiles[msg.sender];
    }

    // Add file as pending
    function insertFileAsPending(Data storage self, uint fileContentHash, string memory timestamp)
        public {
        self.isPendingUpdates[fileContentHash] = timestamp;
    }

    // Get file from pending
    function getTimeForPendingFile(Data storage self, uint fileContentHash )
    public view returns (string memory)
    {
        return self.isPendingUpdates[fileContentHash];
    }

}

/**
@notice Contract written to interact with library for demo purpose only
not using this on front end.
 */
contract FilesDBWithLibrary {
    DataStorage.Data dataStore ;

    // Add file for user interacts with library
    function addFileForUser(string memory _hash) public {
        DataStorage.insertFileForUser(dataStore, _hash);
    }

    // Get file for user interacts with library
    function getFile() public view returns(string memory) {
        return DataStorage.getFileForUser(dataStore);
    }

    // Add file as pending with timestamp
    function addFileAsPending(uint fileContentHash, string memory timestamp) public {
        DataStorage.insertFileAsPending(dataStore, fileContentHash, timestamp);
    }

    // Get Pending file timestamp
    function getPendingFileTime(uint fileContentHash) public view returns(string memory) {
        return DataStorage.getTimeForPendingFile(dataStore, fileContentHash);
    }
}
