import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const config: HardhatUserConfig = {
    solidity: "0.8.18",
    networks: {
        // hardhat: {
        //     forking: {
        //         url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
        //         blockNumber: 11000000,
        //     },
        //     gas: 12000000,
        // }
    },
};

export default config;
