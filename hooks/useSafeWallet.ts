import { ethers } from "ethers";
import  { executeContractCallWithSigners } from "../hardhat/test/helpers/execution";
import { deployments } from "./deployments";
const GnosisSafe_ = require("@gnosis.pm/safe-contracts/build/artifacts/contracts/GnosisSafe.sol/GnosisSafe.json")
const GnosisSafeProxy_ = require("@gnosis.pm/safe-contracts/build/artifacts/contracts/proxies/GnosisSafeProxy.sol/GnosisSafeProxy.json")


const useSafeWallet = () => {
    
    const ADDRESS_0 = "0x0000000000000000000000000000000000000000"

    const createSafeWallet = async (signer: ethers.providers.JsonRpcSigner): Promise<ethers.Contract> => {

        const GnosisSafeFactory = new ethers.ContractFactory(GnosisSafe_.abi, GnosisSafe_.bytecode, signer)
        const GnosisSafeProxyFactory = new ethers.ContractFactory(GnosisSafeProxy_.abi, GnosisSafeProxy_.bytecode, signer)

        const gnosisSafeMasterCopy = await GnosisSafeFactory.deploy();
        await gnosisSafeMasterCopy.deployed();

        const proxy = await GnosisSafeProxyFactory.deploy(gnosisSafeMasterCopy.address)
        await proxy.deployed()

        const gnosisSafe = new ethers.Contract(proxy.address, GnosisSafe_.abi, signer)
        const safeOwner = await signer.getAddress()
        await gnosisSafe.setup([safeOwner], 1, ADDRESS_0, "0x", ADDRESS_0, ADDRESS_0, 0, ADDRESS_0)
        await executeContractCallWithSigners(gnosisSafe, gnosisSafe, "enableModule", [deployments["streamingModule"]], [signer]);

        return gnosisSafe;
    };

    const getSafe = async (signer: ethers.providers.JsonRpcSigner, safeAddress: string): Promise<ethers.Contract> => {
        const gnosisSafe = new ethers.Contract(safeAddress, GnosisSafe_.abi, signer)
        return gnosisSafe;
    };

    return { createSafeWallet, getSafe };
};

export default useSafeWallet;

// mumbai safe - 0x11B63a365f0D8A6C6c01251f376946D7e50C5D82