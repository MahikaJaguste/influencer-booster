import { ethers } from "hardhat";

async function main() {
  const Booster = await ethers.getContractFactory("Booster");
  const booster = await Booster.deploy();

  await booster.deployed();

  console.log(
    `Booster deployed to ${booster.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
