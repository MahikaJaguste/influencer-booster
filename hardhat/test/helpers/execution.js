const { AddressZero } = require("@ethersproject/constants");
const utils = require("ethers").utils;

const EIP712_SAFE_TX_TYPE = {
    // "SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
    SafeTx: [
        { type: "address", name: "to" },
        { type: "uint256", name: "value" },
        { type: "bytes", name: "data" },
        { type: "uint8", name: "operation" },
        { type: "uint256", name: "safeTxGas" },
        { type: "uint256", name: "baseGas" },
        { type: "uint256", name: "gasPrice" },
        { type: "address", name: "gasToken" },
        { type: "address", name: "refundReceiver" },
        { type: "uint256", name: "nonce" },
    ]
}

const calculateSafeTransactionHash = (safe, safeTx, chainId) => {
    return utils._TypedDataEncoder.hash({ verifyingContract: safe.address, chainId }, EIP712_SAFE_TX_TYPE, safeTx)
}

const signHash = async (signer, hash) => {
    const typedDataHash = utils.arrayify(hash)
    const signerAddress = await signer.getAddress()
    return {
        signer: signerAddress,
        data: (await signer.signMessage(typedDataHash)).replace(/1b$/, "1f").replace(/1c$/, "20")
    }
}

const safeSignMessage = async (signer, safe, safeTx, chainId) => {
    const cid = chainId || (await signer.provider.getNetwork()).chainId
    return signHash(signer, calculateSafeTransactionHash(safe, safeTx, cid))
}

const safeSignTypedData = async (signer, safe, safeTx, chainId) => {
    if (!chainId && !signer.provider) throw Error("Provider required to retrieve chainId")
    const cid = chainId || (await signer.provider.getNetwork()).chainId
    const signerAddress = await signer.getAddress()
    return {
        signer: signerAddress,
        data: await signer._signTypedData({ verifyingContract: safe.address, chainId: cid }, EIP712_SAFE_TX_TYPE, safeTx)
    }
}

const buildContractCall = (contract, method, params, nonce, delegateCall, overrides) => {
    const data = contract.interface.encodeFunctionData(method, params)
    return buildSafeTransaction(Object.assign({
        to: contract.address,
        data,
        operation: delegateCall ? 1 : 0,
        nonce
    }, overrides))
}

const executeTxWithSigners = async (safe, tx, signers, overrides) => {
    const sigs = await Promise.all(signers.map((signer) => safeSignTypedData(signer, safe, tx)))
    return executeTx(safe, tx, sigs, overrides)
}

const executeTx = async (safe, safeTx, signatures, overrides) => {
    const signatureBytes = buildSignatureBytes(signatures)
    return safe.execTransaction(safeTx.to, safeTx.value, safeTx.data, safeTx.operation, safeTx.safeTxGas, safeTx.baseGas, safeTx.gasPrice, safeTx.gasToken, safeTx.refundReceiver, signatureBytes, overrides || {})
}

const buildSignatureBytes = (signatures) => {
    signatures.sort((left, right) => left.signer.toLowerCase().localeCompare(right.signer.toLowerCase()))
    let signatureBytes = "0x"
    for (const sig of signatures) {
        signatureBytes += sig.data.slice(2)
    }
    return signatureBytes
}

const executeContractCallWithSigners = async (safe, contract, method, params, signers, delegateCall, overrides) => {
    const tx = buildContractCall(contract, method, params, await safe.nonce(), delegateCall, overrides)
    return executeTxWithSigners(safe, tx, signers)
}

const buildSafeTransaction = (template) => {
    return {
        to: template.to,
        value: template.value || 0,
        data: template.data || "0x",
        operation: template.operation || 0,
        safeTxGas: template.safeTxGas || 0,
        baseGas: template.baseGas || 0,
        gasPrice: template.gasPrice || 0,
        gasToken: template.gasToken || AddressZero,
        refundReceiver: template.refundReceiver || AddressZero,
        nonce: template.nonce
    }
}


module.exports = {
    executeContractCallWithSigners,
    safeSignMessage,
    buildSafeTransaction,
    signHash
};