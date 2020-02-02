#Design Pattern Decisions

##Circuit Breaker 
Implemented circuit breaker design pattern in FilesDB.sol. Bool isStopped is helping us for this.
Modifier isActive is used to stop the methods which we want to stop in emergency. It helps us stop adding more 
files when the contract is stopped. The functions
1. addFileHashPending
2. addFileInAllFiles
3. addFileForUser
will not work when the contract is stopped.

##Restricting Access
Contract Owner.sol is implemented for restricting the access. It is saving the address of the owner. You can stop the contract if you are owner. In FilesDB.sol the function 'toggleStopped' will only work if the sender is admin.

##Fail Early and Fail Loud
Contract FilesDB.sol. Used required in functions where I have to validate the input. Before adding anything in the contract the inputs are validated.In FilesDB.sol the functions 
    * addFileHashPending
    * addFileInAllFiles
    * addFileForUser
are using require to validate the input fields. The will avoid saving the invalid data in the contract.
The modifiers 
    * isActive
    * onlyWhenStopped
    * isAdmin
are also using require.

##Upgradable Pattern 
I should have used upgradable design pattern to update the contract when required

##Mortal 
I don't want to destroy the contract. Thats why I have not used this.

##Pull over Push Payments
Not dealing with any kind of payments and neither interacting with other contracts.


