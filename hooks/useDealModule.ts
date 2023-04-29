import * as ethers from "ethers";
import  { executeContractCallWithSigners, signHash } from "../hardhat/test/helpers/execution";
import { deployments } from "./deployments";
import { StreamingModule__factory } from "@/hardhat/typechain-types";
import TestToken from "@superfluid-finance/ethereum-contracts/build/contracts/TestToken.json"
import { IConstantFlowAgreementV1__factory } from "@/hardhat/typechain-types";


const useDealModule = () => {

    if(!process.env.NEXT_PUBLIC_DAPP_RPC_URL || !process.env.NEXT_PUBLIC_DAPP_PRIVATE_KEY) {
        throw new Error("NEXT_DAPP_RPC_URL and NEXT_DAPP_PRIVATE_KEY must be defined in .env.local");
    }

    const dappProvider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_DAPP_RPC_URL);
    const dappWallet = new ethers.Wallet(process.env.NEXT_PUBLIC_DAPP_PRIVATE_KEY);
    const dappSigner = dappWallet.connect(dappProvider);


    const paymentPlan = 1;
    const durationSeconds = 30 * 86400;

    const approveDeal = async (signer: ethers.providers.JsonRpcSigner, gnosisSafe: ethers.Contract, influencer: string, flowRate: number): Promise<void> => {
        const dai = new ethers.Contract(
            deployments["dai"],
            TestToken.abi,
            signer
        )
        // minting test DAI
        const thousandEther = ethers.utils.parseEther("10000")
        await dai.mint(gnosisSafe.address, thousandEther)
        console.log("approveDeal")
        const streamingModule = StreamingModule__factory.connect(deployments["streamingModule"], signer);
        console.log("approveDeal streamingModule", streamingModule)
        console.log(await gnosisSafe.getOwners(), gnosisSafe.address, streamingModule.address, influencer, flowRate, paymentPlan, durationSeconds);
        console.log(await gnosisSafe.nonce())
        console.log(await signer.getAddress())
        const txn = await executeContractCallWithSigners(gnosisSafe, streamingModule, "approveDeal", [influencer, flowRate, paymentPlan, durationSeconds], [signer]);
        await txn.wait();
        console.log("approveDeal done", txn)
    };

    const initDeal = async (signer: ethers.providers.JsonRpcSigner, gnosisSafe: ethers.Contract, influencer: string, tweetId: string): Promise<void> => {
        console.log("initDeal")
        const streamingModule = StreamingModule__factory.connect(deployments["streamingModule"], signer);
        const txn = await streamingModule.connect(dappSigner).initDeal(gnosisSafe.address, influencer, tweetId);
        await txn.wait();
        console.log("initDeal done", txn)
    };

    const startDeal = async (signer: ethers.providers.JsonRpcSigner, gnosisSafe: ethers.Contract, influencer: string, tweetId: string, flowRate: number): Promise<void> => {
        console.log("startDeal")
        const streamingModule = StreamingModule__factory.connect(deployments["streamingModule"], dappProvider);
        const dealHash = await streamingModule.generateDealHash(gnosisSafe.address, influencer, tweetId, flowRate, paymentPlan, durationSeconds, 0)
        const sig = await signHash(dappSigner, dealHash)
        const txn = await streamingModule.connect(dappSigner).startDeal(gnosisSafe.address, influencer, sig.data);
        await txn.wait();
        console.log("startDeal done", txn)
    };

    const getDeal = async (signer: ethers.providers.JsonRpcSigner, gnosisSafe: ethers.Contract, influencer: string): Promise<void> => {
        const streamingModule = StreamingModule__factory.connect(deployments["streamingModule"], signer);
        const deal = await streamingModule.getDealInfo(gnosisSafe.address, influencer);
        const deal_ = {
            basePaymentFlowRate: deal.basePaymentFlowRate.toString(),
            dealStartTime: deal.dealStartTime.toString(),
            dealLastUpdatedTime: deal.dealLastUpdatedTime.toString(),
            durationSeconds: deal.durationSeconds.toString(),
            tokensDeposited: deal.tokensDeposited.toString(),
            isWhitelistedInfluencer: deal.isWhitelistedInfluencer,
            status: deal.status,
            paymentPlan: deal.paymentPlan,
            tweetId: ethers.utils.parseBytes32String(deal.tweetId),
        }
        console.log(deal_);
    };

    const getFlow = async (signer: ethers.providers.JsonRpcSigner, gnosisSafe: ethers.Contract, influencer: string): Promise<string> => {
        const streamingModule = StreamingModule__factory.connect(deployments["streamingModule"], signer);
        const cfa = new ethers.Contract(await streamingModule.cfa(), IConstantFlowAgreementV1__factory.abi, signer);
        const daix = new ethers.Contract(deployments["daix"], TestToken.abi, signer);
        let accountFlowRate = await cfa.getFlow(daix.address, gnosisSafe.address, influencer); 
        const accountFlowRate_ = {
            deposit: accountFlowRate.deposit.toString(),
            flowRate: accountFlowRate.flowRate.toString(),
            timestamp: accountFlowRate.timestamp.toString(),
            owedDeposit: accountFlowRate.owedDeposit.toString(),
        }
        return accountFlowRate_.flowRate.toString();
    };

    const getBalance = async (signer: ethers.providers.JsonRpcSigner, account: string): Promise<string> => {
        await signer.sendTransaction({ to: account, value: ethers.utils.parseEther("0") });
        const daix = new ethers.Contract(
            deployments["daix"],
            TestToken.abi,
            signer
        )
        const balance = await daix.balanceOf(account)
        return balance.toString()
    };

    const updateDeal = async (signer: ethers.providers.JsonRpcSigner, gnosisSafe: ethers.Contract, influencer: string): Promise<void> => {
        console.log("updateDeal")
        const streamingModule = StreamingModule__factory.connect(deployments["streamingModule"], signer);
        const txn = await streamingModule.connect(dappSigner).updateDeal(gnosisSafe.address, influencer);
        await txn.wait();
        console.log("updateDeal done", txn)
    };

    return { approveDeal, initDeal, startDeal, getDeal, getFlow, updateDeal, getBalance };
};

export default useDealModule;