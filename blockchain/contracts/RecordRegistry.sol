// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RecordRegistry
 * @dev Smart contract for registering and verifying immutable SHA-256 fingerprints of off-chain medical records.
 */
contract RecordRegistry {
    struct RecordFingerprint {
        string sha256Hash;
        uint256 timestamp;
        address registeredBy;
        bool exists;
    }

    // Mapping from medical record ID (or record code) to its cryptographic fingerprint
    mapping(string => RecordFingerprint) private _records;

    event RecordRegistered(
        string indexed recordId,
        string sha256Hash,
        uint256 timestamp,
        address indexed registeredBy
    );

    /**
     * @dev Registers a new medical record fingerprint on the blockchain.
     * @param recordId Unique identifier for the medical record
     * @param sha256Hash SHA-256 hex string of the canonical medical record
     */
    function registerRecord(string memory recordId, string memory sha256Hash) external {
        require(bytes(recordId).length > 0, "Record ID cannot be empty");
        require(bytes(sha256Hash).length == 64, "Invalid SHA-256 hash length");
        require(!_records[recordId].exists, "Record already registered");

        _records[recordId] = RecordFingerprint({
            sha256Hash: sha256Hash,
            timestamp: block.timestamp,
            registeredBy: msg.sender,
            exists: true
        });

        emit RecordRegistered(recordId, sha256Hash, block.timestamp, msg.sender);
    }

    /**
     * @dev Retrieves the registered SHA-256 fingerprint for a given record ID.
     * @param recordId Unique identifier for the medical record
     */
    function getRecord(string memory recordId)
        external
        view
        returns (
            string memory sha256Hash,
            uint256 timestamp,
            address registeredBy,
            bool exists
        )
    {
        RecordFingerprint memory rec = _records[recordId];
        return (rec.sha256Hash, rec.timestamp, rec.registeredBy, rec.exists);
    }
}
