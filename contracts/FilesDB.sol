pragma solidity >=0.4.21 <0.7.0;
import  './Owner.sol';

/**
@title Save the Files Record
@author Nouman Ahmad
@notice You can use this contract for saving the files. Also it inherits owner contract
 */
contract FilesDB is Owner {

    // This struct is used for saving the file detail against their content hash
    struct File {
        address user;
        string timestamp;
        string tags;
        string ipfsHash;
    }

    // Used when file hash is saved as pending
    event PendingFileHashSaved(bool isSaved);
    // Used when files record is saved against User
    event FileSavedAgainstUser(bool isSaved);
    // Used when file hash is saved in all files
    event FileSavedInAllFiles(bool isSaved);
    // Used when fallback function is invoked
    event LogFallback(address sender);
    // For Stopping the contract : Helps us implementing circuit breaker design pattern.
    bool private isStopped;
    // Saves the data for all files
    mapping (uint256 => File) private allFiles;
    // Save the user record of files against address
    mapping(address => string) private userFiles;
    // Save the file in pending
    mapping (uint256 => string) private isPendingUpdates;



    /**
    @author Nouman Ahmad
    @notice Constructor for this contract . Also initializes owner contract
    */
    constructor() Owner(msg.sender) public { }

    /**
    @author Nouman Ahmad
    @notice Check if contract is active
     */
    modifier isActive {
        require(isStopped != true, "Not active right now");
        _;
    }

    /**
    @author Nouman Ahmad
    @notice This modifier is used when contract is stopped and you have to run anything
    @dev circuit breaker design pattern implementation
     */
    modifier onlyWhenStopped {
        require(isStopped, "Not stopped right now");
        _;
    }

    /**
    @author Nouman Ahmad
    @notice Toggle the state of contract to stopped or Active
    @dev This function is using modifier isAdmin which checks if user calling this is owner or not
     */
    function toggleStopped() public isAdmin {
        isStopped = !isStopped;
    }

    /**
    @author Nouman Ahmad
    @notice Check if file trying to upload is in pending list, if it is in pending list returns the timestamp
    @param _hash Hash of the file
    @return timestamp in string
     */
    function checkIfFileIsPending(uint256 _hash) public isActive view returns(string memory ){
        return isPendingUpdates[_hash];
    }

    /**
    @author Nouman Ahmad
    @notice Saves the file in pending: emit the event file saved in pending state
    @param _hash Hash of the file content
    @param timestamp Timestamp of the file
     */
    function addFileHashPending(uint256 _hash, string memory timestamp) public isActive payable{
        require(_hash > 0, " hash cannot be empty ");
        require(bytes(timestamp).length != 0, " Timestamp cannot be empty");
        isPendingUpdates[_hash] = timestamp;
        emit PendingFileHashSaved(true);
    }

    /**
    @author Nouman Ahmad
    @notice Return the file details saved in contract.
    @dev Return the details, saved as struct
    @param _hash Hash of the file
    @return address of the uploader of file
    @return timestamp of uploaded file
    @return tags of the file
    @return IPFS hash of file
     */
    function getFileFromHash(uint256 _hash) public isActive view returns(address , string memory, string memory, string memory) {
        return( allFiles[_hash].user, allFiles[_hash].timestamp, allFiles[_hash].tags, allFiles[_hash].ipfsHash);
    }

    /**
    @author Nouman Ahmad
    @notice Add the file in all files: emit the event file saved in all files
    @param fileHash Hash of content of file
    @param _hash ipfs hash of file
    @param _timestamp timestamp of file
    @param _tags tags of the file
    */
    function addFileInAllFiles(uint256 fileHash, string memory _hash, string memory _timestamp, string memory _tags)
        public isActive payable{
        require(fileHash != 0, "File hash cannot be empty");
        require(bytes(_hash).length != 0, "Ipfs hash cannot be empty");
        require(bytes(_timestamp).length != 0, "Timestamp cannot be empty");
            allFiles[fileHash] = File({
                user: msg.sender,
                timestamp: _timestamp,
                tags: _tags,
                ipfsHash: _hash
            });

        emit FileSavedInAllFiles(true);
    }

    /**
    @author Nouman Ahmad
    @notice Get the is stopped variable
    @return boolean variable is stopped
     */
    function getIsStopped() public view returns(bool) {
        return isStopped;
    }

    /**
    @author Nouman Ahmad
    @notice Add ipfs hash against user: emit file saved success
    @dev Files for user are saved in Json file,  which is uploaded at IPFS.
    @param ipfsHash hash of file in json
     */
    function addFileForUser(string memory ipfsHash) public isActive payable{
        require(bytes(ipfsHash).length != 0, "Cannot be empty");
        userFiles[msg.sender] = ipfsHash;
        emit FileSavedAgainstUser(true);
    }

    /**
    @author Nouman Ahmad
    @notice Get the file hash of user
    @dev Files saved in json file and uploaded at IPFS. Helps retreiving the ipfs
    @return ipfs hash of file
     */
    function getFileForUser() public view returns(string memory) {
        return userFiles[msg.sender];
    }


    /**
    @author Nouman Ahmad
    @notice Fallback function
     */
    function() external {
        require(msg.data.length == 0, "Message Length is not zero");
        emit LogFallback(msg.sender);
    }

}