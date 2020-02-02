import React, { Component } from "react";
import getWeb3 from "./getWeb3";
import FilesDBContract from "./contracts/FilesDB.json";

import "./App.css";
import ipfs from "./ipfs.js";
import FilesLog from "./components/FilesLog.js";
import 'bootstrap/dist/css/bootstrap.min.css';
import {Container, Row, Col, InputGroup, FormControl, Button, Badge, Modal, Spinner} from "react-bootstrap";
import { sha256 } from 'js-sha256';
import moment from "moment";
import Snackbar from "node-snackbar";

class App extends Component {

  constructor() {
    super(); 
    this.state = { 
      ipfsHash: null,
      buffer: '',
      transactionHash: '',
      gasUsed: '',
      txReceipt: '',
      storageValue: 0, 
      web3: null, 
      accounts: null, 
      contract: null,
      tag: '',
      tags: [],
      show: false,
      bufferVerify: '',
      showConfirmRemovalDialog: false,
      userFiles: [],
      hashFile: '',
      showLoginDialog: true, 
      loadingMessage: 'Loading',
      showLoading: false,
      showFileVerified: false,
      fileVerified: {}
    };

  }
  // Constant for checking the uploading time 
  timeForUploading = 5 * 60 * 100;
  badgeSelectedIndex = -1;
  files = [];
  transactionCountForSavingFile = 0;

  //############################################################
  // Helper Methods
  //############################################################
  
  convertTagsToString = () => {
    const {tags} = this.state;
    let formattedTags = '';
    tags.forEach((tag, index) => {
      if(index === tags.length - 1) {
        formattedTags += tag;
      } else {
        formattedTags += tag + "-";
      }
    }) 
    return formattedTags;
  }
  

  getSha256FromBuffer = (buffer) => {
    return "0x" + sha256.hex(buffer);
  }

  convertHexToNumber = (hex) => {
    const { web3 } = this.state;
    return web3.utils.hexToNumberString(hex);
  }

  //############################################################
  // File uploading region
  //############################################################
  
  /**
   * Helper method convert the file to buffer 
   * This method works in case of uploading the file
   * Buffer:  state variable to save the data read from file
   * @memberof App
   */
  convertToBuffer = async(reader) => {
    const buffer = await Buffer.from(reader.result);
    this.setState({ buffer });
  }

  /**
   * Helper method to capture the uploaded file 
   * Convert this file to buffer
   * @memberof App
   */
  captureFile = (event) => {
    event.stopPropagation();
    event.preventDefault();
    const file = event.target.files[0];
    if(file) {
      let reader = new window.FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = async() =>  {
      await this.convertToBuffer(reader);
      }
    }
  }


  /**
  * Contract interaction method 
  * Save the json file hash(ipfs) against the user
  * @param - IPFS hash json file
  * @memberof App
  */
  saveFileNameForUser = (fileHash) => {
    const { contract, accounts } = this.state;
    return contract.methods.addFileForUser(fileHash).send({ from: accounts[0] });
  }

  /**
   * Contract interaction method
   * Save the file in all files list
   * @param fileHash - Hash of the file
   * @param ipfsHash - ipfs Hash of file
   * @param timeStamp - time stamp saved
   * @param tags - tags of the file
   * @memberof App
   */
  saveFileForAllFiles = (fileHash,ipfsHash, timestamp, tags) => {
    const { contract, accounts } = this.state;
    return contract.methods.addFileInAllFiles(fileHash, ipfsHash, timestamp, tags).send({ from: accounts[0] });
  }

/**
 * This method interacts with the contract
 * Saves the file in contract with pending status
 * @param fileKey
 * @param timeStamp
 * @memberof App
 */
addFileInPendingStatus = (fileKey, timeStamp) => {
  this.updateLoaderMessage('Please allow transaction from metamask. Adding file in Pending status.');
  const { contract, accounts } = this.state;
  contract.methods.addFileHashPending(fileKey, timeStamp).send({ from: accounts[0] });
}

/**
 * This will check if someone else is uploading the same file
 * If above condition is true error will popup
 * else pending state for file is set in contract
 * the process will continue after receiving the event FileSavedAsPending
 * @memberof App
 */
isSameFileIsAlreadyPending = () => {
  const { contract, accounts, buffer } = this.state;
  const currentTime = Date.now();
  const hash256Sha = this.getSha256FromBuffer(buffer);
  console.log('256',  hash256Sha);
  const number = this.convertHexToNumber(hash256Sha);
  this.updateLoaderMessage('Checking File is already in Pending Status');
  contract.methods.checkIfFileIsPending(number).call({ from: accounts[0]}).then ( (result) => {
    if(result.length > 0) {
      const timeStamp = parseInt(result);
      console.log('Saved' , timeStamp);
      console.log('current', currentTime);
      console.log('time diff ', currentTime - timeStamp);
      if(currentTime - timeStamp > this.timeForUploading) {
        this.addFileInPendingStatus(number, currentTime.toString());
      } else {
        this.showLoader(false);
        alert('Someone else is uploading the same file.');
      }
    } else {
      this.addFileInPendingStatus(number, currentTime.toString());
    }
  }).catch((error) => {
    this.showLoader(false);
    console.log("Error", error);
    alert('Something went wrong. Try again.')
  });
}



/**
 * Saves the files in the list of user files 
 * List of user files is stored as JSON Array at IPFS
 * File is added is files array and uploaded again at IPFS
 * The key (IPFS Hash) is then saved in contract
 * @param ipfsFileKey - fileKey (IPFS HASH)
 * @param fileContentHash - hash of the file content 
 * @memberof App
 */
addToJsonFile = (ipfsFileKey, fileContentHash) => {
  this.updateLoaderMessage('Uploading User List Files');
  const { userFiles, tags } = this.state; 
  const dateTime = Date.now();
  const file = {
    key: ipfsFileKey,
    timestamp: dateTime,
    tags: this.convertTagsToString(tags)
  }

  userFiles.push(file);
  ipfs.add(Buffer.from(JSON.stringify(userFiles)), async (error, result) => {
    if(error) {
      console.log('Error' , error);
      this.showLoader(false);
    } else {
      console.log('Hash' , result[0].hash);
      this.transactionCountForSavingFile = 0;
      this.updateLoaderMessage('Please allow transaction from metamask. Saving Files in the contract.');
      this.saveFileNameForUser(result[0].hash);
      this.saveFileForAllFiles(fileContentHash, ipfsFileKey, dateTime.toString(), this.convertTagsToString(tags));
    }
  });
}

/**
 * Upload the file to IPFS
 * Add the file in JSON , where all files of user exists
 * @memberof App
 */
uploadFileToIPFS = async (event) => {
  if(!event.returnValues['isSaved']) return;
  this.updateLoaderMessage('Uploading file to IPFS');
  const { buffer } = this.state;
  const hash = this.getSha256FromBuffer(buffer);
  const numberHash = this.convertHexToNumber(hash);
  await ipfs.add( buffer, 
    (error, result) => {
    if(error) {
      console.log('error', error);
      this.showLoader(false);
    } else {
      console.log('result' , result[0].hash);
      this.addToJsonFile(result[0].hash, numberHash);
      this.uploadFile.value = "";
    }
  });
}

/**
 * Case Upload File
 * Helper method for file submission 
 * @memberof App
 */
onSubmit = async(event) => {
    event.preventDefault();
    this.showLoader(true);
    const { buffer } = this.state;
    if(buffer.length === 0) {
      alert(' Please select file to upload');
      this.showLoader(false);
    } else {
      const hash = this.convertHexToNumber(this.getSha256FromBuffer(buffer));
      this.checkIfSameFileAlreadyExistForAnyUser(hash); 
    }
  }

    /**
   * Contract interaction method 
   * Check if the file already exists
   * @param fileHash - Hash of the file
   * @memberof App
   */
  checkIfSameFileAlreadyExistForAnyUser = (fileHash) => {
    const { contract, accounts } = this.state;
    contract.methods.getFileFromHash(fileHash).call( {from: accounts[0]}).then( (result) => {
      if(result[0] == 0) {
        //alert('File not available in our database');
        this.isSameFileIsAlreadyPending();
      } else {
        this.showLoader(false);
        alert('This file is already uploaded by user with address ' + result[0]);
      }
      
    }).catch((error) => {
      this.showLoader(false);
      alert(error);
    });
  }

  //############################################################################################################
  // File uploading region ends here
  //#############################################################################################################



  //#############################################################################################################
  // Verify File Region
  //##############################################################################################################

  /**
   * Read the file uploaded for verify
   * @memberof App
   */
  captureFileToVerify = (event) => {
    event.stopPropagation();
    event.preventDefault();
    const file = event.target.files[0];
    let reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () =>  this.saveVerifyFileInBuffer(reader)
  }

  /**
   * Convert the file to buffer 
   * save the buffer is state
   * @memberof App
   */
  saveVerifyFileInBuffer = async(reader) => {
    const buffer = await Buffer.from(reader.result);
    this.setState({ bufferVerify: buffer });
  }

  /**
   *  Verify upload file submission
   *  Interact with the contract to get the file
   */
  onSubmitVerifyUpload = async(event) => {
    event.preventDefault();
    const hash = this.convertHexToNumber(this.getSha256FromBuffer(this.state.bufferVerify));
    this.getFileDetailsFromHash(hash);
  }

  /**
   * Contract interaction method 
   * Check if the file is already uploaded by some user
   * @param fileHash - Hash of the file
   * @memberof App
   */
  getFileDetailsFromHash = (fileHash) => {
    const { contract, accounts } = this.state;
    contract.methods.getFileFromHash(fileHash).call( {from: accounts[0]}).then( (result) => {
      this.verifyFile.value = '';
      if(result[0] == 0) {
        alert('File not available in our database');
      } else {
        this.setState({fileVerified: result, showFileVerified: true});
      }
    }).catch((error) => {
      alert(error);
    });
  }

  //###########################################################################################################
  // Verify File Region Ends Here
  //############################################################################################################




//###############################################################################################################
// List user files region
//###############################################################################################################

/**
 * Contract interaction method
 * Get the json file hash of the user 
 * Json file containing the list of files
 * @memberof App
 */
getFilesOfUser = async () => {
    const { contract, accounts } = this.state;
    contract.methods.getFileForUser().call( {from: accounts[0]}).then((result) => {
      if(result.length > 0 ) {
        this.fetchFilesFromIPFS(result);
      }
    }).catch((error) => {
      alert('Something went wrong');
    })
}

/**
 * Get the Jsom file from ipfs
 * Get the list of files
 * Set the list in state to display in the left region
 * @memberof App
 */
fetchFilesFromIPFS = (filesHash) => {
    const  userFiles  = [];
    ipfs.cat( filesHash, (error, result) => {
      if(error) {
        console.log('Error' , error);
      } else {
            const array = JSON.parse(result.toString());
            array.forEach(element => {
              userFiles.push(element);  
            });
            console.log('result', array);
            this.setState( {userFiles} );
          }
      });
}

//################################################################################################################
// List user files region ends here
//################################################################################################################

  handleEvents = (error, event) => {

    console.log('Event', event);
    if(event.event === "PendingFileHashSaved") {
      this.uploadFileToIPFS(event);
    } else if(event.event === "FileSavedAgainstUser") {
      this.transactionCountForSavingFile += 1;
    } else if(event.event === "FileSavedInAllFiles") {
      this.transactionCountForSavingFile += 1;
    } 
    if(this.transactionCountForSavingFile === 2) {
      this.transactionCountForSavingFile = 0;
      this.setState({showLoading: false, tags: []});
      this.getFilesOfUser();

    }
  }

  initEvents = () => {
    const { contract } = this.state;    
    let self = this;
    contract.events.allEvents({}, function(error, event) {
      self.handleEvents(error, event);
    });
  }
  
  componentDidMount = async () => {
    try {
      //Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      if(accounts.length > 0) {
        this.setState({ showLoginDialog: false});
      } else {
        this.setState({ showLoginDialog: true });
      }

      const networkId = await web3.eth.net.getId();
      const deployedNetwork = FilesDBContract.networks[networkId];
      const instance = await new web3.eth.Contract(
        FilesDBContract.abi,
        deployedNetwork && deployedNetwork.address,
      );
      this.setState({ web3, accounts, contract: instance });
      this.initEvents();
      this.getFilesOfUser();
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

//#######################################################################################################################
// UI Helper Methods Region
//#######################################################################################################################
  addTag = (event) => {
    const value = event.target.value;
    this.setState({ tag: value});
  }

  saveTag = () => {
    const {tags, tag} = this.state;
    if(tag.length > 0 ) {
      tags.push(tag);
      this.setState({tags, tag: ''})
      this.refs.tag.value = '';
    }
  }

  enterPressed(event) {
    const enterKeyCode = 13;
    const code = event.keyCode || event.which;
    if(code === enterKeyCode) {
      this.saveTag();
    }
  }

  onClickBadge(event) {
    const {tags} =  this.state
    const index = tags.indexOf(event.target.innerText);
    this.badgeSelectedIndex = index;
    this.setState({showConfirmRemovalDialog: true});
  }

  convertToBuffer = async(reader) => {
    const buffer = await Buffer.from(reader.result);
    this.setState({ buffer });
  }

  onClickYesRemoveTag = () => {
    const {tags} = this.state;
    if(this.badgeSelectedIndex !== -1) {
      tags.splice(this.badgeSelectedIndex, 1);
        this.setState({tags, showConfirmRemovalDialog: false});
    } else {
      this.setState ({showConfirmRemovalDialog: false});
    }
  }

  showLoader = (flag) => {
    this.setState( {showLoading: flag})
  }

  updateLoaderMessage = (message) => {
    this.setState( { loadingMessage: message});
  }

  getLoginDialog = () => {
    return (<Modal show = {this.state.showLoginDialog}
      centered>
        <Modal.Header>
          Login Required
        </Modal.Header>

        <Modal.Body>
          Please login to meta mask and press OK to continue.
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick = { () => { window.location.reload() } }>OK</Button>
        </Modal.Footer>
      </Modal> );
  }

  getLoader = () => {
    return (<Modal show = {this.state.showLoading} centered>
        <Modal.Body>
          <center style = {{ marginTop: 50}}>
          <div style = {{ fontSize: 20, color: 'black', fontStyle: 'initial'}}>{this.state.loadingMessage}</div> </center>
          <center style = {{ marginTop: 30, marginBottom: 60}}><Spinner animation="border" /> </center>
        </Modal.Body>
            </Modal> );
  }

formatTags = (tags) => {
    if(tags.trim().length === 0) {
        return '';
    }
    const fileList = tags.split('-').map((tag) => {
        return (
            <Badge pill variant = "primary" style = {{ marginLeft: 0, marginTop: 5, marginBottom: 5, marginRight: 5, fontSize: 18 }} > {tag}</Badge>
        );
    });

    return fileList;
}

  getFileVerifiedDialog = () => {
    const { fileVerified } = this.state;
    return (<Modal show = {this.state.showFileVerified}
      centered>
        <Modal.Header style = { styles.headingDialog }>
          <center>Verified</center>
        </Modal.Header>

        <Modal.Body style = {{ marginRight: 180}}>
          <Row> 
            <Col md ={2} style = { styles.verifyFileDialogKey }> User:
            </Col>
            <Col md ={10}> {fileVerified[0]}
            </Col>
          </Row>
          <Row>
            <Col md ={2} style = { styles.verifyFileDialogKey }> Time:
            </Col>
            <Col md ={10}>
              {moment(fileVerified[1], "x").format("DD MMM YYYY hh:mm a")}
            </Col>
          </Row>
          <Row>
            <Col md ={2} style = { styles.verifyFileDialogKey } > Tags:
            </Col>
            <Col md ={10}> {this.formatTags(fileVerified[2]+'')}
            </Col>
          </Row>
            <Row>
            <Col md ={2} style = { styles.verifyFileDialogKey }> Link:
            </Col>
            <Col md ={10}  onClick={()=> window.open("https://gateway.ipfs.io/ipfs/"+ fileVerified[3] , "_blank")}> click here to open file
            </Col>

          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick = { () => { this.setState({showFileVerified: false}) } }>OK</Button>
        </Modal.Footer>
      </Modal> );
  }

  getRemoveTagDialog = () => {
    return  (<Modal show = {this.state.showConfirmRemovalDialog}
      centered>
        <Modal.Header>
          Remove Tag
        </Modal.Header>

        <Modal.Body>
          Are you sure you want to remove this tag?
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick = { this.onClickYesRemoveTag }>Yes</Button>
          <Button variant="secondary" onClick = { () => {this.setState ({showConfirmRemovalDialog: false})} }>Cancel</Button>
        </Modal.Footer>
      </Modal> );
  }

  getOpenFileDialog = () => {
    return (<Modal 
      show = {false}
      centered>
        <Modal.Header>
          Remove Tag
        </Modal.Header>

        <Modal.Body>
          Are you sure you want to remove this tag?
          <Spinner animation="border" role="status">
            <span className="sr-only">Loading...</span>
          </Spinner>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick = { this.onClickYesRemoveTag }>Yes</Button>
          <Button variant="secondary" onClick = { () => {this.setState ({showConfirmRemovalDialog: false})} }>Cancel</Button>
        </Modal.Footer>
      </Modal> );
  }

  //####################################################################################################################
  // UI Helper Methods region ends here
  //####################################################################################################################




  render() {
    const { userFiles, showLoginDialog, tags } = this.state;
    const tagsList = this.state.tags.map((tag, index) => {
      return <Badge pill variant = "primary" style = {{ marginLeft: 0, marginTop: 5, marginBottom: 5, marginRight: 5, fontSize: 18 }} onClick= {this.onClickBadge.bind(this)}> {tag}</Badge> });

    const removeTagDialog = this.getRemoveTagDialog();
    const openFileDialog = this.getOpenFileDialog();
    const loginDialog = this.getLoginDialog();
    const loader = this.getLoader();
    const fileVerified = this.getFileVerifiedDialog();
        
    return (
      
      showLoginDialog? loginDialog : 
      <Container fluid>
        {openFileDialog}
        {removeTagDialog}
        {loader}
        {fileVerified}
        <Row>
          <Col md ={3}>
            <FilesLog userFiles = { userFiles }/>
          </Col>
          <Col md ={5}>    
            <h2> Upload a file </h2>
            <hr/>
            <h3> Choose file to upload</h3>
            <Row>
              <Col md= {10}>  
                <form onSubmit = {this.onSubmit}>
                <input type = "file" onChange = {this.captureFile} ref = { (node) => {this.uploadFile = node}}/>
                <button type = "submit"> Send it</button>
                </form>
              </Col>
            </Row>

            <Row style = {{ marginTop: 10}}> 
              <Col md = {10}>
                { tagsList }
              </Col>
            </Row>
            { tags.length ? 
            <Row>
            <Col md = {10}>
              To remove the tag please click on the tag.
            </Col>
            </Row> : ''
            }

            <Row style = {{ marginTop: 15}}>
              <Col md = {10}>
                <InputGroup className="mb-3">
                  <FormControl
                  placeholder="Add tag"
                  ref = "tag"
                  onKeyPress = {this.enterPressed.bind(this)}
                  onChange = {this.addTag.bind(this)}
                  />
                  <InputGroup.Append>
                  <Button variant="outline-secondary" onClick = {this.saveTag}>Add</Button>
                  </InputGroup.Append>
                </InputGroup>
              </Col>
            </Row>
          </Col>

          <Col md = {3}> 
              <h2> Verify File </h2>
              <hr />
              <h5> Choose file to verify</h5>
              <Row>
                <form onSubmit = {this.onSubmitVerifyUpload}>
                  <input type = "file" onChange = {this.captureFileToVerify} ref = { (node) => {this.verifyFile = node}}/>
                  <center style = {{ marginTop: 20}}><button type = "submit"> Verify</button></center>
                </form>
              </Row>
          </Col>
        </Row>
      </Container>
      
    );
  }
}
const styles = { 
  verifyFileDialogKey: {
    fontSize: 14, 
    color: 'black', 
    fontWeight: 'bold'
  },
  headingDialog: {
    fontSize: 20, 
    color: 'black', 
    fontWeight: 'bold'
  }

}
export default App;
