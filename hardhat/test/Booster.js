const { expect } = require("chai")
const { Framework } = require("@superfluid-finance/sdk-core")
const { ethers } = require("hardhat")
const { deployTestFramework } = require("@superfluid-finance/ethereum-contracts/dev-scripts/deploy-test-framework");
const TestToken = require("@superfluid-finance/ethereum-contracts/build/contracts/TestToken.json")

let sfDeployer
let contractsFramework
let sf
let dai
let daix
let booster

// Test Accounts
let owner;
let account1;
let account2

const thousandEther = ethers.utils.parseEther("10000")

before(async function () {
    // get hardhat accounts
    [owner, account1, account2] = await ethers.getSigners();
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

    // DEPLOYING DAI and DAI wrapper super token (which will be our `spreaderToken`)
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
    await dai.mint(account1.address, thousandEther)
    await dai.mint(account2.address, thousandEther)

    // approving DAIx to spend DAI (Super Token object is not an ethers contract object and has different operation syntax)
    await dai.approve(daix.address, ethers.constants.MaxInt256)
    await dai
        .connect(account1)
        .approve(daix.address, ethers.constants.MaxInt256)
    await dai
        .connect(account2)
        .approve(daix.address, ethers.constants.MaxInt256)
    // Upgrading all DAI to DAIx
    const ownerUpgrade = daix.upgrade({amount: thousandEther});
    const account1Upgrade = daix.upgrade({amount: thousandEther});
    const account2Upgrade = daix.upgrade({amount: thousandEther});

    await ownerUpgrade.exec(owner)
    await account1Upgrade.exec(account1)
    await account2Upgrade.exec(account2)

    let Booster = await ethers.getContractFactory("Booster", owner)

    booster = await Booster.deploy()
    await booster.deployed()
});

describe("Booster", function () {
    it("Setup", async function () {
        let accountDAIxBalance = await daix.balanceOf({account: account1.address, providerOrSigner: account1});
        expect(accountDAIxBalance, ethers.utils.parseEther("100"));
    })
    it("Contract creates flow from account 1 to account 2", async function () {
        let authorizeContractOperation = daix.updateFlowOperatorPermissions(
            {
                flowOperator: booster.address,
                permissions: "7", //full control
                flowRateAllowance: "1000000000000000" // ~2500 per month
            }
        )
        await authorizeContractOperation.exec(account1)

        await booster.startFlow(
            daix.address,
            account1.address,
            account2.address,
            "100000000000000"
        ) //about 250 daix per month

        let accountFlowRate = await daix.getFlow({
            sender: account1.address,
            receiver: account2.address,
            providerOrSigner: account1
        })

        expect(accountFlowRate.flowRate).to.equal("100000000000000");

        const account1_b1 = ethers.BigNumber.from(await daix.balanceOf({account: account1.address, providerOrSigner: account1}));
        const account2_b1 = ethers.BigNumber.from(await daix.balanceOf({account: account2.address, providerOrSigner: account2}));

        await ethers.provider.send("evm_increaseTime", [86400 * 30])
        await ethers.provider.send("evm_mine")

        const account1_b2 = ethers.BigNumber.from(await daix.balanceOf({account: account1.address, providerOrSigner: account1}));
        const account2_b2 = ethers.BigNumber.from(await daix.balanceOf({account: account2.address, providerOrSigner: account2}));

        expect(account1_b1.sub(account1_b2)).to.be.gt(ethers.utils.parseEther("2.5"));
        expect(account2_b2.sub(account2_b1)).to.be.gt(ethers.utils.parseEther("2.5"));
    })
    it("Contract updates flow from account 1 to account 2", async function () {
        await booster.updateFlow(
            daix.address,
            account1.address,
            account2.address,
            "200000000000000"
        ) //about 500 daix per month

        let accountFlowRate = await daix.getFlow({
            sender: account1.address,
            receiver: account2.address,
            providerOrSigner: account1
        })

        expect(accountFlowRate.flowRate).to.equal("200000000000000");

        const account1_b1 = ethers.BigNumber.from(await daix.balanceOf({account: account1.address, providerOrSigner: account1}));
        const account2_b1 = ethers.BigNumber.from(await daix.balanceOf({account: account2.address, providerOrSigner: account2}));

        await ethers.provider.send("evm_increaseTime", [86400 * 30])
        await ethers.provider.send("evm_mine")

        const account1_b2 = ethers.BigNumber.from(await daix.balanceOf({account: account1.address, providerOrSigner: account1}));
        const account2_b2 = ethers.BigNumber.from(await daix.balanceOf({account: account2.address, providerOrSigner: account2}));

        expect(account1_b1.sub(account1_b2)).to.be.gt(ethers.utils.parseEther("5"));
        expect(account2_b2.sub(account2_b1)).to.be.gt(ethers.utils.parseEther("5"));
    })
    it("Contract stops flow from account 1 to account 2", async function () {
        await booster.stopFlow(
            daix.address,
            account1.address,
            account2.address
        )

        let accountFlowRate = await daix.getFlow({
            sender: account1.address,
            receiver: account2.address,
            providerOrSigner: account1
        })

        expect(accountFlowRate.flowRate).to.equal("0");

        const account1_b1 = ethers.BigNumber.from(await daix.balanceOf({account: account1.address, providerOrSigner: account1}));
        const account2_b1 = ethers.BigNumber.from(await daix.balanceOf({account: account2.address, providerOrSigner: account2}));

        await ethers.provider.send("evm_increaseTime", [86400 * 30])
        await ethers.provider.send("evm_mine")

        const account1_b2 = ethers.BigNumber.from(await daix.balanceOf({account: account1.address, providerOrSigner: account1}));
        const account2_b2 = ethers.BigNumber.from(await daix.balanceOf({account: account2.address, providerOrSigner: account2}));

        expect(account1_b1.sub(account1_b2)).to.equal(ethers.utils.parseEther("0"));
        expect(account2_b2.sub(account2_b1)).to.equal(ethers.utils.parseEther("0"));
    })
})