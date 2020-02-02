const FilesDB = artifacts.require("./FilesDB.sol");

contract("testFilesDB", accounts => {
    const hash = "qweouewqQEWQERjkl09000";
    const hashNum = "092131022130321";
    const exceptionCannotBeEmpty = "Cannot be empty";
    const ipfsHash = "somethingIPFSHash";
    const timeStamp = Date.now().toString();


    let filesDB;
    
    beforeEach('setup contract for each test', async function () {
        filesDB = await FilesDB.new();
    })
    
    // Deployed the contract and checked if it is active or not.
    // As we ca toggle its state , our logic is that it should be active when deployed
    it("testContractIsActive", async() => {
        const isStopped = await filesDB.getIsStopped.call(); 
        assert.equal(isStopped, false, "Contract should be active")
    });

    // Check if its inactive state is set or nor
    it("testContractIsInactive", async () => {
        await filesDB.toggleStopped();
        const storedData = await filesDB.getIsStopped.call();
        assert.equal(storedData, true, "Contract should be inactive");
    }); 

    // If some other user other than owner wants to toggle the state of contract 
    // It shouldn't be allowed
    it("testChangeActiveStateBySimpleUser",  async() => {
        const contractAddr = "0xaca9990620f00001e7200003b3a00098f149834d";
        try {
            await filesDB.toggleStopped.call({from: contractAddr});
            assert.false('Should throw exception before this');
        } catch(error) {
            assert.include(error.message, "You are not owner of this contract.", " Should throw exception");
        }
    });

    // Contract should throw exception Not active right now when 
    // it is stopped and user tries to save the file
    it("testSaveFileHashIfContractIsStopped", async() => {
        const hash = "qweouewqQEWQERjkl09000";
        try {
            await filesDB.toggleStopped();
            await filesDB.addFileForUser(hash);
            assert.false('Should throw exception before this');
        } catch(error) {
            assert.include(error.message, "Not active right now", " Should throw exception");
        }
    });
    

    // It should save the file against user and emit event true if saved successfully
    it("testFileHashIsSaved", async() => {  
        try {
            const txResult = await filesDB.addFileForUser(hash);
            assert.equal(txResult.logs[0].args['0'], true, "Not saved");
        } catch(error) {
            assert(false, 'No exception should be thrown here');
        }        
    });


    // Correct file hash is saved. 
    // Saved and retrieved hash should be same 
    it("testFileHashIsSameForUser", async() => {
        await filesDB.addFileForUser(hash);
        const resp = await filesDB.getFileForUser();
        assert.equal(resp, hash, "File hash should be same");
    });

    // If some one tries to save the empty hash , it should throw error
    it("testFileHashIsEmpty", async() => {  
        try{
            await filesDB.addFileForUser("");
        } catch(error) {
            assert.include(error.message, exceptionCannotBeEmpty, " Exception should be thrown here");
        }        
    });

    // If someone tries to save the empty content hash is empty in all files
    it("testFileHashEmptyInAllFiles",  async() => {
        try{
            await filesDB.addFileInAllFiles("", ipfsHash, timeStamp, "");
        } catch(error) {
            assert.include(error.message, "cannot be empty", " Exception should be thrown here");
        }
    });


    // if ipfs hash of file is empty it should not save the file
    it("testIPFSHashEmptyInAllFiles",  async() => {
        try{
            await filesDB.addFileInAllFiles(hashNum, "", timeStamp, "");
        } catch(error) {
            assert.include(error.message, "cannot be empty", " Exception should be thrown here");
        }
    });


    // File should not be saved without timestamp
    it("testTimeStampEmptyInAllFiles",  async() => {
        try{
            await filesDB.addFileInAllFiles(hashNum, ipfsHash, "", "");
        } catch(error) {
            assert.include(error.message, "cannot be empty", " Exception should be thrown here");
        }
    });


    // File should be saved
    // Should emit event with one argument with value true
    it("testFileSavedInAllFiles",  async() => {
        try{
            const txResult = await filesDB.addFileInAllFiles(hashNum, ipfsHash, timeStamp, "");
            assert.equal(txResult.logs[0].args['0'], true, "File not saved");
        } catch(error) {
            assert(false, "Should not throw exception here");
        }
    });


    // IPFS saved should be same as ipfs hash received
    it("testGetFileFromAllFiles",  async() => {
        try{
            const txResult = await filesDB.addFileInAllFiles(hashNum, ipfsHash, timeStamp, "");
            assert.equal(txResult.logs[0].args['0'], true, "File not saved");
            const response = await filesDB.getFileFromHash(hashNum);
            assert.equal(response[3], ipfsHash, " IPFS Hash should be same");
        } catch(error) {
            assert(false, "Should not throw exception here");
        }
    });


    // Timestamp os saved correctly in all files
    it("testIsTimeStampFromAllFiles",  async() => {
        try{
            await filesDB.addFileInAllFiles(hashNum, ipfsHash, timeStamp, "");
            const response = await filesDB.getFileFromHash(hashNum);
            assert.equal(response[1], timeStamp, " IPFS Hash should be same");
        } catch(error) {
            assert(false, "Should not throw exception here");
        }
    });



    // Test files hash is saved as pending successfully
    it("testFileSavedAsPending", async() => {
        try {
            const txResult = await filesDB.addFileHashPending(hashNum, timeStamp);
            assert.equal(txResult.logs[0].args['0'], true, "Not added");
        } catch(error) {
            console.log('Error' , error);
            assert(false, 'No exception should be thrown here');
        }
    });

    // If contract is stopped it should not add file in all files
    it("testAddFileWhenContractIsStopped",  async() => {
        try {
            await filesDB.toggleStopped();
            await filesDB.addFileInAllFiles(hashNum, ipfsHash, timeStamp, "");
        } catch(error) {
            assert.include(error.message, "Not active right now", " Should throw exception");
        }
    });




});
