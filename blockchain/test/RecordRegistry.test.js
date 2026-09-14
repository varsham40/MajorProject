const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RecordRegistry Contract", function () {
  let recordRegistry;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const RecordRegistry = await ethers.getContractFactory("RecordRegistry");
    recordRegistry = await RecordRegistry.deploy();
    await recordRegistry.waitForDeployment();
  });

  it("Should register a new medical record fingerprint successfully", async function () {
    const recordId = "REC-1001";
    const sha256Hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    await expect(recordRegistry.registerRecord(recordId, sha256Hash))
      .to.emit(recordRegistry, "RecordRegistered");

    const record = await recordRegistry.getRecord(recordId);
    expect(record.exists).to.be.true;
    expect(record.sha256Hash).to.equal(sha256Hash);
  });

  it("Should prevent duplicate record registration", async function () {
    const recordId = "REC-1002";
    const sha256Hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    await recordRegistry.registerRecord(recordId, sha256Hash);

    await expect(
      recordRegistry.registerRecord(recordId, sha256Hash)
    ).to.be.revertedWith("Record already registered");
  });

  it("Should reject invalid hash length", async function () {
    const recordId = "REC-1003";
    const invalidHash = "short_hash";

    await expect(
      recordRegistry.registerRecord(recordId, invalidHash)
    ).to.be.revertedWith("Invalid SHA-256 hash length");
  });
});
