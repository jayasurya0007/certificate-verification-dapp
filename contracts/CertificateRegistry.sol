// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@erc725/smart-contracts/contracts/interfaces/IERC725Y.sol";

contract CertificateRegistry {
    enum Role { None, Student, Provider }

    mapping(address => Role) public roles;
    mapping(bytes32 => address) private _studentIds; // StudentID (hash) → UP address

    // ERC725Y Data Keys
    bytes32 public constant STUDENT_DATA_KEY = keccak256("StudentData");
    bytes32 public constant PROVIDER_DATA_KEY = keccak256("ProviderData");

    event Registered(address indexed account, Role role);

    modifier onlyUnregistered() {
        require(roles[msg.sender] == Role.None, "Already registered");
        _;
    }

    // Register student by checking their UP for StudentData
    function registerAsStudent(bytes32 studentIdHash) external onlyUnregistered {
        address upAddress = msg.sender;
        
        // Verify StudentData exists in UP
        bytes memory studentData = IERC725Y(upAddress).getData(STUDENT_DATA_KEY);
        require(studentData.length > 0, "Student data missing");
        
        // Ensure StudentID is unique
        require(_studentIds[studentIdHash] == address(0), "Student ID taken");
        _studentIds[studentIdHash] = upAddress;

        roles[upAddress] = Role.Student;
        emit Registered(upAddress, Role.Student);
    }

    // Register provider by checking their UP for ProviderData
    function registerAsProvider() external onlyUnregistered {
        address upAddress = msg.sender;
        
        // Verify ProviderData exists in UP
        bytes memory providerData = IERC725Y(upAddress).getData(PROVIDER_DATA_KEY);
        require(providerData.length > 0, "Provider data missing");

        roles[upAddress] = Role.Provider;
        emit Registered(upAddress, Role.Provider);
    }
}