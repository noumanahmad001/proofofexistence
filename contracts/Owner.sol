pragma solidity >=0.5.0 <0.7.0;

/// @title Set the Owner of contract
/// @author Nouman Ahmad
/// @notice Save the owners address of contract
contract Owner {
    address private owner;
    constructor(address _owner) public {
        owner = _owner;
    }

    /// @author Nouman Ahmad
    /// @notice check if the current user in owner/admin or not
    modifier isAdmin {
        require(owner == msg.sender, "You are not owner of this contract.");
        _;
    }
}