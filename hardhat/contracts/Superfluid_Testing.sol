// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// import {ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
// import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
// import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
// import "hardhat/console.sol";

// contract Booster {
//     using SuperTokenV1Library for ISuperToken;

//     function startFlow(
//         ISuperToken token,
//         address _sender,
//         address _receiver,
//         int96 _flowRate
//     ) public {
//         token.createFlowFrom(_sender, _receiver, _flowRate);
//     }

//     function updateFlow(
//         ISuperToken token,
//         address _sender,
//         address _receiver,
//         int96 _flowRate
//     ) public {
//         token.updateFlowFrom(_sender, _receiver, _flowRate);
//     }

//     function stopFlow(
//         ISuperToken token,
//         address _sender,
//         address _receiver
//     ) public {
//         token.deleteFlowFrom(_sender, _receiver);
//     }
// }
