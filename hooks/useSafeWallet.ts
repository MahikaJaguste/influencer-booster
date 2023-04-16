import { ethers } from "ethers";
import {
  GaslessWallet,
  GaslessWalletConfig,
} from "@gelatonetwork/gasless-wallet";
import {
    SafeAuthKit,
} from "@safe-global/auth-kit";
import { ExternalProvider } from "@ethersproject/providers";
import EthersAdapter from "@safe-global/safe-ethers-lib";
import { SafeFactory } from "@safe-global/safe-core-sdk";

const useSafeWallet = () => {
 
    const createGelatoWallet = async (safeAuth: SafeAuthKit<any>): Promise<string | null> => {
        await safeAuth.signIn();

        const provider = safeAuth.getProvider();

        if(!provider){
            return null;
        }

        const ethProvider: ExternalProvider = new ethers.providers.Web3Provider(
            provider
        ) as unknown as ExternalProvider;


        const gaslessWalletConfig: GaslessWalletConfig = {
            apiKey: process.env.NEXT_PUBLIC_GELATO_RELAY_API_KEY,
        };
  
        const gelatoWallet = new GaslessWallet(ethProvider, gaslessWalletConfig);
        await gelatoWallet.init();

        const gelatoWalletContractAddress = gelatoWallet.getAddress();
        return gelatoWalletContractAddress;
    };

    const createSafeWallet = async (safeAuth: SafeAuthKit<any>, owners: string[]): Promise<string | null> => {
        await safeAuth.signIn();

        console.log("safeAuth", safeAuth)

        const provider = safeAuth.getProvider();

        console.log("provider", provider)

        if(!provider){
            return null;
        }

        const ethProvider = new ethers.providers.Web3Provider(
            provider
        );

        console.log("ethProvider", ethProvider)

        const signer = ethProvider.getSigner();

        console.log("signer", signer)

        const ethAdapter = new EthersAdapter({
            ethers,
            signerOrProvider: signer,
        });
        console.log("ethAdapter", ethAdapter);

        const safeFactory = await SafeFactory.create({
            ethAdapter,
        });
        console.log("sf", safeFactory);

        const safeAccountConfig = {
            owners: owners,
            threshold: owners.length,
        };

        console.log("safeAccountConfig", safeAccountConfig);

        console.log(await safeFactory.predictSafeAddress({ safeAccountConfig, safeDeploymentConfig:{saltNonce:"0x0"} }));

        const safeSdkOwner = await safeFactory.deploySafe({ safeAccountConfig });
        console.log("owner", safeSdkOwner);

        const safeAddress = safeSdkOwner.getAddress();

        console.log("Your Safe has been deployed:");
        console.log(`Safe address: ${safeAddress}`);
        // console.log(`https://app.safe.global/gor:${safeAddress}`);

        return safeAddress;
    };

    return { createGelatoWallet, createSafeWallet };
};

export default useSafeWallet;

// mumbai safe - 0x11B63a365f0D8A6C6c01251f376946D7e50C5D82