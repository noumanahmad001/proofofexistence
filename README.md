#SETUP

1. Clone the Repo
2. Navigate to folder client 
3. Install all dependencies with command **npm install**
4. Navigate back to previous folder **cd..** 
5. You should have truffle installed or install truffle using **npm install -g truffle**
6. You should have Ganache and metamask installed.
7. Run the Ganache check which port Ganache is using and configure this in **truffle-config.js**
8. To install Ganache use **npm install -g ganache-cli**
9. Install metamask extension in chrome.
10. Compile the contracts **truffle compile**
11. Run migrations **truffle migrate --reset**
12. Navigate to client and run this command **npm run start**



#Project Details
##Proof of existence app
I have used IPFS in this app.

The app has four sections
1. Login 
2. Upload File (center of the screen)
3. User Files (displayed on left of screen)
4. Verify File (right of screen)


###Upload File
* Click on the choose file button below the upload file heading
* Add tags if you want to add.
* To remove added tags click on the tag and click yes in remove tag dialog.
* Click on the send it button.
* The file is checked that it previously exists in db or not. If not it is saved against the user with tags if any.
* User files which are on left will be updated if everything goes well

####How this is achieved technically
* When the user selects the file it is saved as buffer in state variable.
* When tags are added they are also saved in state variable.
* When send it button is pressed, following steps are done in order to complete the process
    1. Check if the same file exists in the contract. 
        * In order to save file data in the contract, data is convert to sha256 and from that to number. 
        * File data is saved as unit in the contract.
    2. Check if file is in pending status.
        * If file is not in pending status we save the hex of file against the timestamp in a map
        * If file exists in pending, retrieve the file and checks if time difference is more than 5 mins then proceed to next step else throw error
    3. Upload the file to IPFS.
    4. Add file to the list of user files.
    5. Convert list of files to json and upload that json to IPFS.
    6. Save that uploaded json hash against user in contract.
    7. Save the file data hash also contract, we save data hash against struct File which has all params related to file.
    8. The process is completed successfully after both of them are done.

###Login
* When the app is started it checks if metamask is logged in.
* App shows the dialog to login with metamask
* Login with metamask and press ok in dialog to refresh.


###User Files
* Shows the files against user on the left of screen. Also display the uploaded time and tags.
* To the file click on the row.

#####How this is achieved technically
* The app fetch ipfs hash saved in the contract against user.
* Once we get the ipfs hash. we get data from ipfs that is json containing all files list.
* Data is displayed


###Verify File
* Upload the file
* If file exist in the system it will display a dialog with all information
* Else display error file doesnt exist

#####How this is achieved technically
* Converts the uploaded file into buffer
* Convert the buffer into SHA256 and then to number.
* As we have saved this information previous in the contract. 
* We check if the file exists in the contract.
* If exists display error else show the information of file.


