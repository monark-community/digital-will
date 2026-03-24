// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {MockUSDC} from "./MockUSDC.sol";
import {MockWETH} from "./MockWETH.sol";

contract MockSwapRouter {
    // Fake ETH/USDC price: 2000 USDC per ETH
    uint256 public constant MOCK_ETH_PRICE = 2000;
    address private owner;

    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    constructor() {
        owner = msg.sender;
    }

    function exactInputSingle(
        ExactInputSingleParams calldata params
    ) external returns (uint256 amountOut) {
        // Pull WETH from caller
        require(
            IERC20(params.tokenIn).transferFrom(
                msg.sender,
                address(this),
                params.amountIn
            ),
            "WETH transfer failed"
        );

        // Calculate fake USDC out (ETH price * amount, adjusted for decimals)
        // amountIn is 18 decimals (WETH), amountOut is 6 decimals (USDC)
        amountOut = (params.amountIn * MOCK_ETH_PRICE) / 10 ** 12;
        uint256 feeAmount = (amountOut * params.fee) / 1_000_000; // crude simulation
        amountOut -= feeAmount;

        require(amountOut >= params.amountOutMinimum, "Slippage exceeded");
        require(block.timestamp <= params.deadline, "Deadline exceeded");

        // Mint USDC directly to recipient, simulating reception without real liquidity pool.
        MockUSDC(params.tokenOut).mint(params.recipient, amountOut);
        return amountOut;
    }

    receive() external payable {}

    function withdrawAll(address wethAddress) external {
        MockWETH weth = MockWETH(wethAddress);
        uint256 amount = weth.balanceOf(address(this));

        // Unwrap WETH into ETH
        weth.withdraw(amount);

        // Send ETH to caller
        (bool success, ) = payable(owner).call{value: address(this).balance}(
            ""
        );
        require(success, "ETH transfer failed");
    }
}
