// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CertificateNFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    // Mapping from token ID to certificate data
    struct Certificate {
        string name;
        string institute;
        uint256 issueDate;
        string certificateType;
        address student;
    }
    
    mapping(uint256 => Certificate) public certificates;
    
    // Mapping to track certificates owned by each student
    mapping(address => uint256[]) public studentCertificates;
    
    // Only authorized institutes can issue certificates
    mapping(address => bool) public authorizedInstitutes;
    
    event CertificateIssued(
        uint256 indexed tokenId, 
        address indexed student, 
        string name, 
        string institute,
        uint256 issueDate,
        string certificateType
    );
    
    constructor() ERC721("Academic Certificate", "CERT") Ownable() {}
    
    // Owner can authorize institutes
    function authorizeInstitute(address institute) external onlyOwner {
        authorizedInstitutes[institute] = true;
    }
    
    // Owner can revoke institute authorization
    function revokeInstitute(address institute) external onlyOwner {
        authorizedInstitutes[institute] = false;
    }
    
    // Issue a new certificate
    function issueCertificate(
        address student,
        string memory name,
        string memory institute,
        string memory certificateType,
        string memory tokenURI
    ) external returns (uint256) {
        require(authorizedInstitutes[msg.sender], "Not authorized to issue certificates");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(student, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        certificates[newTokenId] = Certificate({
            name: name,
            institute: institute,
            issueDate: block.timestamp,
            certificateType: certificateType,
            student: student
        });
        
        studentCertificates[student].push(newTokenId);
        
        emit CertificateIssued(
            newTokenId, 
            student, 
            name, 
            institute, 
            block.timestamp, 
            certificateType
        );
        
        return newTokenId;
    }
    
    // Get all certificates for a student
    function getStudentCertificates(address student) external view returns (uint256[] memory) {
        return studentCertificates[student];
    }
    
    // Get certificate details by ID
    function getCertificateDetails(uint256 tokenId) external view returns (
        string memory name,
        string memory institute,
        uint256 issueDate,
        string memory certificateType,
        address student
    ) {
        Certificate memory cert = certificates[tokenId];
        return (
            cert.name,
            cert.institute,
            cert.issueDate,
            cert.certificateType,
            cert.student
        );
    }
    
    // Request certificate (can be implemented for institute approval workflow)
    function requestCertificate(
        address institute,
        string memory name,
        string memory message
    ) external {
        // This is just an event emission, to be caught off-chain by the institute
        emit CertificateRequested(msg.sender, institute, name, message);
    }
    
    event CertificateRequested(
        address indexed student,
        address indexed institute,
        string name,
        string message
    );
}