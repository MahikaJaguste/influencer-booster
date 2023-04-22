import { ethers } from "ethers";
import {
    SafeAuthKit,
} from "@safe-global/auth-kit";
import EthersAdapter from "@safe-global/safe-ethers-lib";
import { SafeFactory } from "@safe-global/safe-core-sdk";

import  { executeContractCallWithSigners } from "../hardhat/test/helpers/execution";

const GnosisSafe_ = require("@gnosis.pm/safe-contracts/build/artifacts/contracts/GnosisSafe.sol/GnosisSafe.json")
const GnosisSafeProxy_ = require("@gnosis.pm/safe-contracts/build/artifacts/contracts/proxies/GnosisSafeProxy.sol/GnosisSafeProxy.json")


const useSafeWallet = () => {

    const deployments = {
        "signMessageLib": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        "daix": "0xF7d1AA5463f06210f57d7D055Ee8CeB99b3930f2",
        "dai": "0x0a200434A7186CE40Bb554dBd05246eb7AC9fC32",
        "oracle": "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0",
        "streamingModule": "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
    }

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

    return { createSafeWallet };
};

export default useSafeWallet;

// mumbai safe - 0x11B63a365f0D8A6C6c01251f376946D7e50C5D82