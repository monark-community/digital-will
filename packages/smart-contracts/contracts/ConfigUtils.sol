//SPDX-license-identifier: MIT

pragma solidity 0.8.19;

import {SwapConfig} from "@interfaces/SwapConfig.sol";
import "@constants/Will.c.sol" as C_WILL;

library ConfigUtils {
    function getConfig() public view returns (SwapConfig memory) {
        SwapConfig memory cfg;
        if (block.chainid == 11155111) {
            // Sepolia
            cfg = SwapConfig({
                swapRouter: C_WILL.SEPOLIA_SWAP_ROUTER,
                quoter: C_WILL.SEPOLIA_QUOTER,
                wNative: C_WILL.SEPOLIA_WETH,
                usdc: C_WILL.SEPOLIA_USDC,
                poolFee: C_WILL.SEPOLIA_POOL_FEE
            });
        } else if (block.chainid == 31337) {
            // Anvil
            cfg = SwapConfig({
                swapRouter: C_WILL.ANVIL_SWAP_ROUTER,
                quoter: C_WILL.ANVIL_QUOTER,
                wNative: C_WILL.ANVIL_WETH,
                usdc: C_WILL.ANVIL_USDC,
                poolFee: C_WILL.ANVIL_POOL_FEE
            });
        } else {
            revert("Unsupported chain");
        }
        return cfg;
    }
}
