const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying RecordRegistry smart contract...");

  const RecordRegistry = await hre.ethers.getContractFactory("RecordRegistry");
  const contract = await RecordRegistry.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`RecordRegistry deployed successfully to address: ${address}`);

  // Write deployment info to backend env / JSON for Web3.py consumption
  const deploymentInfo = {
    address: address,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };

  const outputPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Saved deployment details to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
