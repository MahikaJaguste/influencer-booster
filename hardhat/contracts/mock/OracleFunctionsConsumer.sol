// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract OracleFunctionsConsumer {
    uint8 flag = 0;
    uint96 updatedFlowRate1;
    uint96 updatedFlowRate2;

    constructor(uint96 _updatedFlowRate1, uint96 _updatedFlowRate2) {
        updatedFlowRate1 = _updatedFlowRate1;
        updatedFlowRate2 = _updatedFlowRate2;
    }

    function getTweetScore(
        bytes32 _tweetId,
        uint96 _basePaymentFlowRate,
        uint8 _paymentPlan
    ) public returns (uint96) {
        if (flag == 0) {
            flag = 1;
            return _basePaymentFlowRate;
        } else if (flag == 1) {
            flag = 2;
            return updatedFlowRate1;
        }
        return updatedFlowRate2;
    }
}
