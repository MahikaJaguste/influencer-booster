
// const utils = require('@gnosis.pm/safe-contracts/test/utils/general')
const { expect } = require("chai")
const { ethers } = require("hardhat")
const { executeContractCallWithSigners, safeSignMessage, signHash } = require("./helpers/execution")

const GnosisSafe_ = require("@gnosis.pm/safe-contracts/build/artifacts/contracts/GnosisSafe.sol/GnosisSafe.json")
const GnosisSafeProxy_ = require("@gnosis.pm/safe-contracts/build/artifacts/contracts/proxies/GnosisSafeProxy.sol/GnosisSafeProxy.json")
const SignMessageLib_ = require("@gnosis.pm/safe-contracts/build/artifacts/contracts/examples/libraries/SignMessage.sol/SignMessageLib.json")
// const { executeContractCallWithSigners } = require("@gnosis.pm/safe-contracts/src/utils/execution");

const TestToken = require("@superfluid-finance/ethereum-contracts/build/contracts/TestToken.json")
const { Framework } = require("@superfluid-finance/sdk-core")
const { deployTestFramework } = require("@superfluid-finance/ethereum-contracts/dev-scripts/deploy-test-framework");

let owner
let influencer
let account2
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
const tweetId = ethers.utils.formatBytes32String("123456");
const durationSeconds = 30 * 86400;
const paymentPlan = 1;

before(async function() {

    [owner, influencer, account2, admin] = await ethers.getSigners();

    const GnosisSafe = await ethers.getContractFactory(GnosisSafe_.abi, GnosisSafe_.bytecode, owner)
    const GnosisSafeProxy = await ethers.getContractFactory(GnosisSafeProxy_.abi, GnosisSafeProxy_.bytecode, owner)
    const SignMessageLib = await ethers.getContractFactory(SignMessageLib_.abi, SignMessageLib_.bytecode, owner)
    const StreamingModule = await ethers.getContractFactory("StreamingModule", owner)
    const OracleFunctionsConsumer = await ethers.getContractFactory("OracleFunctionsConsumer", owner)

    const gnosisSafeMasterCopy = await GnosisSafe.deploy()
    const proxy = await GnosisSafeProxy.deploy(gnosisSafeMasterCopy.address)
    gnosisSafe = await ethers.getContractAt(GnosisSafe_.abi, proxy.address, owner)

    await gnosisSafe.setup([owner.address], 1, ADDRESS_0, "0x", ADDRESS_0, ADDRESS_0, 0, ADDRESS_0)

    signUtils = await SignMessageLib.deploy()

    sfDeployer = await deployTestFramework();
    // GETTING SUPERFLUID FRAMEWORK SET UP

    // deploy the framework locally
    contractsFramework = await sfDeployer.getFramework()

    // initialize framework
    sf = await Framework.create({
        chainId: 31337,
        provider: owner.provider,
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

    dai = new ethers.Contract(
        daix.underlyingToken.address,
        TestToken.abi,
        owner
    )
    // minting test DAI
    await dai.mint(owner.address, thousandEther)
    await dai.transfer(gnosisSafe.address, thousandEther)

    let oracle = await OracleFunctionsConsumer.deploy(flowRate1, flowRate2)
    await oracle.deployed()

    streamingModule = await StreamingModule.deploy(admin.address, daix.address, oracle.address)
    await streamingModule.deployed()

    console.log("Gnosis safe daix balance = ", await dai.balanceOf(gnosisSafe.address))
    console.log("Influencer module daix balance", await dai.balanceOf(influencer.address))
})


describe("StreamingSafeModule", function () {
    it("Setup", async function () {
        expect(await gnosisSafe.getOwners(), [owner.address])
    })

    it("Enable module", async function () {
        await executeContractCallWithSigners(gnosisSafe, gnosisSafe, "enableModule", [streamingModule.address], [owner]);
        let modules = await gnosisSafe.getModulesPaginated(ADDRESS_1, 10)
        expect(modules.array.length).to.eq(1)
        expect(modules.array[0]).to.eq(streamingModule.address)
    })

    it("Approve, start, update and end a deal", async function () {

        await executeContractCallWithSigners(gnosisSafe, streamingModule, "approveDeal", [influencer.address, flowRate, paymentPlan, durationSeconds], [owner]);

        await streamingModule.connect(admin).initDeal(gnosisSafe.address, influencer.address, tweetId);

        const dealHash = await streamingModule.generateDealHash(gnosisSafe.address, influencer.address, tweetId, flowRate, paymentPlan, durationSeconds, 0)
        const sig = await signHash(influencer, dealHash)
        await streamingModule.connect(influencer).startDeal(gnosisSafe.address, influencer.address, sig.data);
        let accountFlowRate = await daix.getFlow({
            sender: gnosisSafe.address,
            receiver: influencer.address,
            providerOrSigner: owner,
        })
        expect(accountFlowRate.flowRate).to.equal(flowRate);
        let deal = await streamingModule.getDealInfo(gnosisSafe.address, influencer.address);
       
        await streamingModule.connect(influencer).updateDeal(gnosisSafe.address, influencer.address);
        accountFlowRate = await daix.getFlow({
            sender: gnosisSafe.address,
            receiver: influencer.address,
            providerOrSigner: owner,
        })
        expect(accountFlowRate.flowRate).to.equal(flowRate);

        await ethers.provider.send("evm_increaseTime", [86400 * 7.5])
        await ethers.provider.send("evm_mine")

        await streamingModule.connect(influencer).updateDeal(gnosisSafe.address, influencer.address);
        accountFlowRate = await daix.getFlow({
            sender: gnosisSafe.address,
            receiver: influencer.address,
            providerOrSigner: owner,
        })
        expect(accountFlowRate.flowRate).to.equal((flowRate*2).toString());
        deal = await streamingModule.getDealInfo(gnosisSafe.address, influencer.address)

        await ethers.provider.send("evm_increaseTime", [86400 * 7.5])
        await ethers.provider.send("evm_mine")

        await streamingModule.connect(influencer).updateDeal(gnosisSafe.address, influencer.address);
        accountFlowRate = await daix.getFlow({
            sender: gnosisSafe.address,
            receiver: influencer.address,
            providerOrSigner: owner,
        })
        expect(accountFlowRate.flowRate).to.equal((flowRate*3).toString());
        deal = await streamingModule.getDealInfo(gnosisSafe.address, influencer.address)
        // console.log("Deal info", deal)

        await ethers.provider.send("evm_increaseTime", [86400 * 15])
        await ethers.provider.send("evm_mine")

        await executeContractCallWithSigners(gnosisSafe, streamingModule, "endDeal", [influencer.address], [owner]);
        accountFlowRate = await daix.getFlow({
            sender: gnosisSafe.address,
            receiver: influencer.address,
            providerOrSigner: owner,
        })
        expect(accountFlowRate.flowRate).to.equal("0");

        console.log("Gnosis safe Daix balance =", await daix.balanceOf({account: gnosisSafe.address, providerOrSigner: owner}));
        console.log("Influencer Daix balance =", await daix.balanceOf({account: influencer.address, providerOrSigner: owner}));

    })
})