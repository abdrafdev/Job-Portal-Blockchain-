import hre from "hardhat";
import { writeFileSync } from "node:fs";
import path from "node:path";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  const JobPortal = await hre.ethers.getContractFactory("JobPortal");
  const jobPortal = await JobPortal.deploy();
  await jobPortal.waitForDeployment();

  const address = await jobPortal.getAddress();
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  const artifact = await hre.artifacts.readArtifact("JobPortal");

  const out = {
    chainId,
    address,
    abi: artifact.abi,
  };

  const outPath = path.join(
    process.cwd(),
    "src",
    "lib",
    "contracts",
    "jobPortal.json"
  );
  writeFileSync(outPath, JSON.stringify(out, null, 2), "utf-8");

  console.log(`JobPortal deployed: ${address} (chainId: ${chainId})`);
  console.log(`Contract export written to: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
