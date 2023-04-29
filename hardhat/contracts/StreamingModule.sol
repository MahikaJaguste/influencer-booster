// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "@gnosis.pm/safe-contracts/contracts/common/Enum.sol";
import "@gnosis.pm/safe-contracts/contracts/common/SignatureDecoder.sol";

import {ISuperfluid} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import {SuperTokenV1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {OracleFunctionsConsumer} from "./mock/OracleFunctionsConsumer.sol";

import "hardhat/console.sol";

interface GnosisSafe {
    /// @dev Allows a Module to execute a Safe transaction without any further confirmations.
    /// @param to Destination address of module transaction.
    /// @param value Ether value of module transaction.
    /// @param data Data payload of module transaction.
    /// @param operation Operation type of module transaction.
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) external returns (bool success);
}

contract StreamingModule is SignatureDecoder {
    string public constant NAME = "Streaming Module";
    string public constant VERSION = "0.1.0";

    using SuperTokenV1Library for ISuperToken;

    bytes32 public constant DOMAIN_SEPARATOR_TYPEHASH =
        0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218;
    // keccak256(
    //     "EIP712Domain(uint256 chainId,address verifyingContract)"
    // );

    bytes32 public constant SUPER_ALLOWANCE_TYPEHASH =
        0xd5157347abe2571626499c3f94dc2081fa1952d72911c24f3eaf5e9e0802c922;
    // keccak256(
    //     "SuperAllowance(address safe,address influencer,bytes32 tweetId,uint96 basePaymentFlowRate,uint8 paymentPlan,uint16 nonce)"
    // );

    enum Status {
        NOT_STARTED,
        STARTED,
        COMPLETED
    }

    struct Deal {
        bool isWhitelistedInfluencer;
        Status status;
        uint8 paymentPlan;
        uint96 basePaymentFlowRate;
        uint256 durationSeconds;
        uint256 dealStartTime;
        uint256 dealLastUpdatedTime;
        uint256 tokensDeposited;
        bytes32 tweetId;
    }

    uint256 public constant ONE_DAY_IN_SECONDS = 86400;

    // mapping Safe => Influencer => Deal
    mapping(address => mapping(address => Deal)) private deals;

    address public boosterAdmin;
    ISuperToken public superToken;
    ISuperfluid public host;
    IConstantFlowAgreementV1 public cfa;
    OracleFunctionsConsumer public oracleFunctionsConsumer;

    constructor(
        address _boosterAdmin,
        address _superToken,
        address _oracleFunctionsConsumer
    ) {
        boosterAdmin = _boosterAdmin;
        superToken = ISuperToken(_superToken);
        host = ISuperfluid(superToken.getHost());
        cfa = IConstantFlowAgreementV1(
            address(
                ISuperfluid(host).getAgreementClass(
                    //keccak256("org.superfluid-finance.agreements.ConstantFlowAgreement.v1")
                    0xa9214cc96615e0085d3bb077758db69497dc2dce3b2b1e97bc93c3d18d83efd3
                )
            )
        );
        oracleFunctionsConsumer = OracleFunctionsConsumer(
            _oracleFunctionsConsumer
        );
    }

    modifier isBoosterAdmin() {
        require(msg.sender == boosterAdmin, "Not authorized");
        _;
    }

    function updateBoosterAdmin(address _boosterAdmin) public isBoosterAdmin {
        boosterAdmin = _boosterAdmin;
    }

    /// @dev This function needs to be called by the safe to approve a deal for itself.
    /// @param _influencer Influencer address.
    /// @param _basePaymentFlowRate Base payment flow rate.
    /// @param _paymentPlan Payment plan.
    function approveDeal(
        address _influencer,
        uint96 _basePaymentFlowRate,
        uint8 _paymentPlan,
        uint256 _durationSeconds
    ) public {
        require(
            _paymentPlan == 1 || _paymentPlan == 2,
            "Payment plan must be 1 or 2"
        );
        require(_basePaymentFlowRate > 0, "Base payment flow rate must be > 0");
        require(_durationSeconds > 0, "Duration must be > 0");
        require(_influencer != address(0), "Influencer address cannot be 0");
        require(
            deals[msg.sender][_influencer].status != Status.STARTED,
            "Deal already approved"
        );

        uint256 tokensNeeded = _basePaymentFlowRate * _durationSeconds;
        address underlyingToken = superToken.getUnderlyingToken();

        bytes memory data = abi.encodeCall(
            IERC20(underlyingToken).approve,
            (address(superToken), tokensNeeded)
        );

        require(
            GnosisSafe(msg.sender).execTransactionFromModule(
                underlyingToken,
                0,
                data,
                Enum.Operation.Call
            ),
            "Could not execute underlying token approval"
        );

        console.log("tokensNeeded", tokensNeeded);

        data = abi.encodeCall(superToken.upgrade, (tokensNeeded));
        require(
            GnosisSafe(msg.sender).execTransactionFromModule(
                address(superToken),
                0,
                data,
                Enum.Operation.Call
            ),
            "Could not execute token upgrade"
        );

        deals[msg.sender][_influencer] = Deal({
            isWhitelistedInfluencer: true,
            status: Status.NOT_STARTED,
            paymentPlan: _paymentPlan,
            basePaymentFlowRate: _basePaymentFlowRate,
            durationSeconds: _durationSeconds,
            dealStartTime: 0,
            dealLastUpdatedTime: 0,
            tokensDeposited: tokensNeeded,
            tweetId: ""
        });
    }

    /// @dev This function needs to be called by the platform admin after checking that the tweet is relevant to this deal.
    /// @param _safe Safe contract address.
    /// @param _influencer Influencer address.
    /// @param _tweetId Tweet ID.
    function initDeal(
        address _safe,
        address _influencer,
        bytes32 _tweetId
    ) public isBoosterAdmin {
        Deal storage deal = deals[_safe][_influencer];
        require(deal.isWhitelistedInfluencer, "Influencer is not whitelisted");
        require(
            deal.status == Status.NOT_STARTED,
            "Deal has already been started"
        );
        deal.tweetId = _tweetId;
    }

    /// @dev Getter function for details of a deal.
    /// @param _safe Safe contract address.
    /// @param _influencer Influencer address.
    function getDealInfo(
        address _safe,
        address _influencer
    ) public view returns (Deal memory) {
        return deals[_safe][_influencer];
    }

    /// @dev This function needs to be called by the influencer to start the deal.
    /// (The booster admin is also eligible to call this function)
    ///
    /// @param _safe Safe contract address.
    /// @param _influencer Influencer address.
    /// @param signature Signature generated by the influencer to start the deal.
    function startDeal(
        GnosisSafe _safe,
        address _influencer,
        bytes memory signature
    ) public {
        Deal memory deal = getDealInfo(address(_safe), _influencer);

        require(deal.isWhitelistedInfluencer, "Influencer is not whitelisted");
        require(
            deal.status == Status.NOT_STARTED,
            "Deal has already been started"
        );
        require(
            deal.tweetId != bytes32(0),
            "Tweet ID not set. Please start the deal first."
        );

        deals[address(_safe)][_influencer].status = Status.STARTED;
        deals[address(_safe)][_influencer].dealStartTime = block.timestamp;
        deals[address(_safe)][_influencer].dealLastUpdatedTime = block
            .timestamp;

        bytes memory dealHashData = generateDealHashData(
            address(_safe),
            _influencer,
            deal.tweetId,
            deal.basePaymentFlowRate,
            deal.paymentPlan,
            deal.durationSeconds,
            deal.status
        );

        checkSignature(_influencer, signature, dealHashData);

        startDealOperation(_safe, _influencer, deal.basePaymentFlowRate);
    }

    function startDealOperation(
        GnosisSafe _safe,
        address _influencer,
        uint96 _basePaymentFlowRate
    ) private {
        int96 flowRate = int96(_basePaymentFlowRate);

        bytes memory callData = abi.encodeCall(
            cfa.createFlow,
            (superToken, _influencer, flowRate, new bytes(0))
        );

        bytes memory data = abi.encodeCall(
            host.callAgreement,
            (cfa, callData, new bytes(0))
        );

        require(
            _safe.execTransactionFromModule(
                address(host),
                0,
                data,
                Enum.Operation.Call
            ),
            "Could not execute super token create flow"
        );
    }

    /// @dev This function needs to be can be called by anyone to update the deal.
    ///
    /// @param _safe Safe contract address.
    /// @param _influencer Influencer address.
    function updateDeal(GnosisSafe _safe, address _influencer) public {
        Deal memory deal = getDealInfo(address(_safe), _influencer);

        require(deal.isWhitelistedInfluencer, "Influencer is not whitelisted");
        require(deal.status == Status.STARTED, "Deal is not active");
        require(deal.tweetId != bytes32(0), "Tweet ID not set");

        uint96 updatedPaymentFlowRate = oracleFunctionsConsumer.getTweetScore(
            deal.tweetId,
            deal.basePaymentFlowRate,
            deal.paymentPlan
        );

        if (updatedPaymentFlowRate == deal.basePaymentFlowRate) {
            return;
        }

        bool updateRate = true;
        uint256 tokensNeeded = 0;

        uint256 timeSinceDealLastUpdated = (block.timestamp -
            deal.dealLastUpdatedTime);
        uint256 tokensUsed = timeSinceDealLastUpdated *
            deal.basePaymentFlowRate;
        uint256 tokensDeposited = deal.tokensDeposited;
        uint newTokensDeposited = 0;

        uint256 tokensRemaining = tokensDeposited - tokensUsed;
        if (tokensRemaining < 0) {
            tokensRemaining = 0;
        }

        if (timeSinceDealLastUpdated >= deal.durationSeconds) {
            updateRate = false;
        } else {
            newTokensDeposited =
                updatedPaymentFlowRate *
                (deal.durationSeconds - timeSinceDealLastUpdated);
            tokensNeeded = newTokensDeposited - tokensRemaining;
        }

        if (!updateRate) {
            return;
        }

        console.log("tokensNeeded", tokensNeeded);

        deals[address(_safe)][_influencer].dealLastUpdatedTime = block
            .timestamp;
        deals[address(_safe)][_influencer]
            .basePaymentFlowRate = updatedPaymentFlowRate;
        deals[address(_safe)][_influencer].tokensDeposited = newTokensDeposited;
        deals[address(_safe)][_influencer].durationSeconds =
            deal.durationSeconds -
            timeSinceDealLastUpdated;

        address underlyingToken = superToken.getUnderlyingToken();

        bytes memory data = abi.encodeCall(
            IERC20(underlyingToken).approve,
            (address(superToken), tokensNeeded)
        );

        require(
            _safe.execTransactionFromModule(
                underlyingToken,
                0,
                data,
                Enum.Operation.Call
            ),
            "Could not execute underlying token approval"
        );

        data = abi.encodeCall(superToken.upgrade, (tokensNeeded));
        require(
            _safe.execTransactionFromModule(
                address(superToken),
                0,
                data,
                Enum.Operation.Call
            ),
            "Could not execute token upgrade"
        );

        updateDealOperation(_safe, _influencer, updatedPaymentFlowRate);
    }

    function updateDealOperation(
        GnosisSafe _safe,
        address _influencer,
        uint96 _updatedPaymentFlowRate
    ) private {
        int96 flowRate = int96(_updatedPaymentFlowRate);

        bytes memory callData = abi.encodeCall(
            cfa.updateFlow,
            (superToken, _influencer, flowRate, new bytes(0))
        );

        bytes memory data = abi.encodeCall(
            host.callAgreement,
            (cfa, callData, new bytes(0))
        );

        require(
            _safe.execTransactionFromModule(
                address(host),
                0,
                data,
                Enum.Operation.Call
            ),
            "Could not execute super token create flow"
        );
    }

    /// @dev This function needs to be called by the safe to end the deal.
    ///
    /// @param _influencer Influencer address.
    function endDeal(address _influencer) public {
        Deal memory deal = getDealInfo(msg.sender, _influencer);
        require(deal.status == Status.STARTED, "Deal is not active");
        require(
            deal.dealStartTime + deal.durationSeconds <= block.timestamp,
            "Deal is not over"
        );
        deals[msg.sender][_influencer].status = Status.COMPLETED;
        bytes memory callData = abi.encodeCall(
            cfa.deleteFlow,
            (superToken, msg.sender, _influencer, new bytes(0))
        );

        bytes memory data = abi.encodeCall(
            host.callAgreement,
            (cfa, callData, new bytes(0))
        );

        require(
            GnosisSafe(msg.sender).execTransactionFromModule(
                address(host),
                0,
                data,
                Enum.Operation.Call
            ),
            "Could not execute super token create flow"
        );
    }

    /// @dev Returns the chain id used by this contract.
    function getChainId() public view returns (uint256) {
        uint256 id;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            id := chainid()
        }
        return id;
    }

    /// @dev Generates the data for the deal hash (required for signing)
    function generateDealHashData(
        address _safe,
        address _influencer,
        bytes32 _tweetId,
        uint96 _basePaymentFlowRate,
        uint8 _paymentPlan,
        uint256 _durationSeconds,
        Status _status
    ) private view returns (bytes memory) {
        uint256 chainId = getChainId();
        bytes32 domainSeparator = keccak256(
            abi.encode(DOMAIN_SEPARATOR_TYPEHASH, chainId, this)
        );
        bytes32 dealHash = keccak256(
            abi.encode(
                SUPER_ALLOWANCE_TYPEHASH,
                _safe,
                _influencer,
                _tweetId,
                _basePaymentFlowRate,
                _paymentPlan,
                _durationSeconds,
                _status
            )
        );
        return
            abi.encodePacked(
                bytes1(0x19),
                bytes1(0x01),
                domainSeparator,
                dealHash
            );
    }

    /// @dev Generates the deal hash that should be signed to start a deal.
    function generateDealHash(
        address _safe,
        address _influencer,
        bytes32 _tweetId,
        uint96 _basePaymentFlowRate,
        uint8 _paymentPlan,
        uint256 _durationSeconds,
        Status _status
    ) public view returns (bytes32) {
        return
            keccak256(
                generateDealHashData(
                    _safe,
                    _influencer,
                    _tweetId,
                    _basePaymentFlowRate,
                    _paymentPlan,
                    _durationSeconds,
                    _status
                )
            );
    }

    function checkSignature(
        address _influencer,
        bytes memory signature,
        bytes memory dealHashData
    ) private view {
        address signer = recoverSignature(signature, dealHashData);
        require(
            _influencer == signer || boosterAdmin == signer,
            "Invalid signature"
        );
    }

    // We use the same format as used for the Safe contract, except that we only support exactly 1 signature and no contract signatures.
    function recoverSignature(
        bytes memory signature,
        bytes memory dealHashData
    ) private view returns (address owner) {
        // If there is no signature data msg.sender should be used
        if (signature.length == 0) return msg.sender;
        // Check that the provided signature data is as long as 1 encoded ecsda signature
        require(signature.length == 65, "signatures.length == 65");
        uint8 v;
        bytes32 r;
        bytes32 s;
        (v, r, s) = signatureSplit(signature, 0);
        // If v is 0 then it is a contract signature
        if (v == 0) {
            revert("Contract signatures are not supported by this module");
        } else if (v == 1) {
            // If v is 1 we also use msg.sender, this is so that we are compatible to the GnosisSafe signature scheme
            owner = msg.sender;
        } else if (v > 30) {
            // To support eth_sign and similar we adjust v and hash the dealHashData with the Ethereum message prefix before applying ecrecover
            owner = ecrecover(
                keccak256(
                    abi.encodePacked(
                        "\x19Ethereum Signed Message:\n32",
                        keccak256(dealHashData)
                    )
                ),
                v - 4,
                r,
                s
            );
        } else {
            // Use ecrecover with the messageHash for EOA signatures
            owner = ecrecover(keccak256(dealHashData), v, r, s);
        }
        // 0 for the recovered owner indicates that an error happened.
        require(owner != address(0), "owner != address(0)");
    }
}
