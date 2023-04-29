const { expect } = require("chai")
const { ethers } = require("hardhat")
const { executeContractCallWithSigners, safeSignMessage, signHash } = require("../test/helpers/execution")

const GnosisSafe_ = require("@gnosis.pm/safe-contracts/build/artifacts/contracts/GnosisSafe.sol/GnosisSafe.json")
const GnosisSafeProxy_ = require("@gnosis.pm/safe-contracts/build/artifacts/contracts/proxies/GnosisSafeProxy.sol/GnosisSafeProxy.json")
const SignMessageLib_ = require("@gnosis.pm/safe-contracts/build/artifacts/contracts/examples/libraries/SignMessage.sol/SignMessageLib.json")
// const { executeContractCallWithSigners } = require("@gnosis.pm/safe-contracts/src/utils/execution");

const TestToken = require("@superfluid-finance/ethereum-contracts/build/contracts/TestToken.json")
const { Framework } = require("@superfluid-finance/sdk-core")
const { deployTestFramework } = require("@superfluid-finance/ethereum-contracts/dev-scripts/deploy-test-framework");

async function main() {

    let admin

    let gnosisSafe
    let streamingModule
    let signUtils

    let sfDeployer
    let contractsFramework
    let sf
    let dai
    let daix

    const CALL = 0
    const ADDRESS_0 = "0x0000000000000000000000000000000000000000"
    const ADDRESS_1 = "0x0000000000000000000000000000000000000001"
    const thousandEther = ethers.utils.parseEther("10000")

    const flowRate = ethers.utils.parseEther("0.000000001");
    const flowRate1 = ethers.utils.parseEther("0.000000002");
    const flowRate2 = ethers.utils.parseEther("0.000000003");

    [admin] = await ethers.getSigners()

    // const GnosisSafe = await ethers.getContractFactory(GnosisSafe_.abi, GnosisSafe_.bytecode, owner)
    // const GnosisSafeProxy = await ethers.getContractFactory(GnosisSafeProxy_.abi, GnosisSafeProxy_.bytecode, owner)
    const SignMessageLib = await ethers.getContractFactory(SignMessageLib_.abi, SignMessageLib_.bytecode, admin)
    const StreamingModule = await ethers.getContractFactory("StreamingModule", admin)
    const OracleFunctionsConsumer = await ethers.getContractFactory("OracleFunctionsConsumer", admin)

    // const gnosisSafeMasterCopy = await GnosisSafe.deploy()
    // const proxy = await GnosisSafeProxy.deploy(gnosisSafeMasterCopy.address)
    // gnosisSafe = await ethers.getContractAt(GnosisSafe_.abi, proxy.address, owner)

    // await gnosisSafe.setup([owner.address], 1, ADDRESS_0, "0x", ADDRESS_0, ADDRESS_0, 0, ADDRESS_0)

    signUtils = await SignMessageLib.deploy()
    await signUtils.deployed()
    console.log("SignMessageLib deployed to:", signUtils.address);

    sfDeployer = await deployTestFramework();
    // GETTING SUPERFLUID FRAMEWORK SET UP

    // deploy the framework locally
    contractsFramework = await sfDeployer.getFramework()

    // initialize framework
    sf = await Framework.create({
        chainId: 31337,
        provider: admin.provider,
        resolverAddress: contractsFramework.resolver, // (empty)
        protocolReleaseVersion: "test"
    })

    // DEPLOYING DAI and DAI wrapper super token
    await sfDeployer.deployWrapperSuperToken(
        "Fake DAI Token",
        "fDAI",
        18,
        ethers.utils.parseEther("100000000").toString()
    )

    daix = await sf.loadSuperToken("fDAIx")
    console.log("DAIx address:", daix.address)

    dai = new ethers.Contract(
        daix.underlyingToken.address,
        TestToken.abi,
        admin
    )
    console.log("DAI address:", daix.underlyingToken.address)

    // minting test DAI
    await dai.mint(admin.address, thousandEther)
    await dai.mint("0x14b33B6e371eC5e92F0134e5cB56Cc4dB1a6aF5B", thousandEther)
    // await dai.transfer(gnosisSafe.address, thousandEther)

    let oracle = await OracleFunctionsConsumer.deploy(flowRate1, flowRate2)
    await oracle.deployed()
    console.log("Oracle deployed to:", oracle.address);

    streamingModule = await StreamingModule.deploy(admin.address, daix.address, oracle.address)
    await streamingModule.deployed()
    console.log("StreamingModule deployed to:", streamingModule.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
