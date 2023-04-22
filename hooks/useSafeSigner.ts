import { ethers } from "ethers";
import { SafeAuthKit } from "@safe-global/auth-kit";

const useSafeSigner = () => {

    if(!process.env.NEXT_PUBLIC_DAPP_RPC_URL || !process.env.NEXT_PUBLIC_DAPP_PRIVATE_KEY) {
        throw new Error("NEXT_DAPP_RPC_URL and NEXT_DAPP_PRIVATE_KEY must be defined in .env.local");
    }

    const dappProvider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_DAPP_RPC_URL);
    const dappWallet = new ethers.Wallet(process.env.NEXT_PUBLIC_DAPP_PRIVATE_KEY);
    const dappSigner = dappWallet.connect(dappProvider);

    const getSafeSigner = async (safeAuth: SafeAuthKit<any>): Promise<ethers.providers.JsonRpcSigner | undefined>=> {
        await safeAuth.signIn();
        const provider = safeAuth.getProvider();
        if(!provider){
            return;
        }

        const ethProvider = new ethers.providers.Web3Provider(
            provider
        );
        const signer = ethProvider.getSigner();
        const balance = await signer.getBalance()

        if(balance.eq(0)) {
            const txn = await dappSigner.sendTransaction({
                to: signer.getAddress(),
                value: ethers.utils.parseEther("0.1")
            })
            await txn.wait();
        };
        return signer;
    }

    return { getSafeSigner };
};

export default useSafeSigner;

// mumbai safe - 0x11B63a365f0D8A6C6c01251f376946D7e50C5D82