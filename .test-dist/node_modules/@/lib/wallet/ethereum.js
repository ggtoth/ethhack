"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEPOLIA_PARAMS = exports.SEPOLIA_CHAIN_ID_DECIMAL = exports.SEPOLIA_CHAIN_ID = void 0;
exports.getEthereumProvider = getEthereumProvider;
exports.getWalletName = getWalletName;
exports.SEPOLIA_CHAIN_ID = "0xaa36a7";
exports.SEPOLIA_CHAIN_ID_DECIMAL = 11155111;
exports.SEPOLIA_PARAMS = {
    chainId: exports.SEPOLIA_CHAIN_ID,
    chainName: "Sepolia",
    nativeCurrency: {
        name: "Sepolia ETH",
        symbol: "ETH",
        decimals: 18,
    },
    rpcUrls: ["https://rpc.sepolia.org"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
};
function getEthereumProvider() {
    if (typeof window === "undefined") {
        return null;
    }
    if (window.ethereum?.isMetaMask) {
        return window.ethereum;
    }
    return window.ethereum ?? window.phantom?.ethereum ?? null;
}
function getWalletName(provider) {
    if (provider?.isMetaMask) {
        return "MetaMask";
    }
    if (provider?.isPhantom) {
        return "Phantom";
    }
    return provider ? "wallet" : "wallet";
}
