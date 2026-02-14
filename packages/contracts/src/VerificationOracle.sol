// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VerificationOracle
 * @dev A simple registry for trusted verification results.
 * In a production system, this could be replaced by an EAS (Ethereum Attestation Service) interface.
 */
contract VerificationOracle is Ownable {
    
    // Mapping from conditionHash to verification status
    mapping(bytes32 => bool) public isVerified;
    
    // Mapping of authorized verifiers (oracles/pulsars)
    mapping(address => bool) public authorizedVerifiers;

    event VerificationAttested(bytes32 indexed conditionHash, address indexed verifier, bool status);
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);

    constructor() Ownable(msg.sender) {
        authorizedVerifiers[msg.sender] = true; // Admin is also a verifier for now
    }

    modifier onlyVerifier() {
        require(authorizedVerifiers[msg.sender], "Not an authorized verifier");
        _;
    }

    function addVerifier(address _verifier) external onlyOwner {
        authorizedVerifiers[_verifier] = true;
        emit VerifierAdded(_verifier);
    }

    function removeVerifier(address _verifier) external onlyOwner {
        authorizedVerifiers[_verifier] = false;
        emit VerifierRemoved(_verifier);
    }

    /**
     * @dev Attests to the truth of a specific condition.
     * @param _conditionHash The hash of the condition (e.g. keccak256(abi.encodePacked(escrowAddress, milestoneId, "GITHUB_PR_MERGED")))
     * @param _status True if passed, False otherwise.
     */
    function attest(bytes32 _conditionHash, bool _status) external onlyVerifier {
        isVerified[_conditionHash] = _status;
        emit VerificationAttested(_conditionHash, msg.sender, _status);
    }

    function checkVerification(bytes32 _conditionHash) external view returns (bool) {
        return isVerified[_conditionHash];
    }
}
