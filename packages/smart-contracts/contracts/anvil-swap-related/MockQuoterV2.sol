// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract MockQuoterV2 {
    uint256 public constant MOCK_NATIVE_PRICE = 2000; // USDC per NATIVE (ETH, etc.)

    struct QuoteExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint24 fee;
        uint160 sqrtPriceLimitX96;
    }

    function quoteExactInputSingle(
        QuoteExactInputSingleParams memory params
    )
        external
        pure
        returns (
            uint256 amountOut,
            uint160 sqrtPriceX96After,
            uint32 initializedTicksCrossed,
            uint256 gasEstimate
        )
    {
        // Calculate amountOutMin from mock price with 0.5% slippage
        amountOut = (params.amountIn * MOCK_NATIVE_PRICE) / 10 ** 12;
        sqrtPriceX96After = 0; // Not relevant for mock
        initializedTicksCrossed = 0; // Not relevant for mock
        gasEstimate = 200000; // Arbitrary gas estimate
    }
}
