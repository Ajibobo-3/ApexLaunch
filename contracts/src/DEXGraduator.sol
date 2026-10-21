// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IUniswapV2.sol";

/**
 * @title DEXGraduator
 * @notice Handles the automatic migration of bonding curve liquidity to a DEX (e.g. Uniswap V2/V4)
 * and permanently locks/burns the LP tokens.
 */
contract DEXGraduator is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    address public dexRouter;
    address public dexFactory;
    address public factory;

    event LiquidityGraduated(
        address indexed token,
        address indexed pool,
        address indexed dexPair,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 lpBurned
    );

    event DEXRouterUpdated(address newRouter, address newFactory);
    event FactoryUpdated(address newFactory);

    modifier onlyAuthorized() {
        require(msg.sender == factory || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address _dexRouter, address _dexFactory) Ownable(msg.sender) {
        dexRouter = _dexRouter;
        dexFactory = _dexFactory;
    }

    function setFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "Invalid factory");
        factory = _factory;
        emit FactoryUpdated(_factory);
    }

    function setDEXRouter(address _dexRouter, address _dexFactory) external onlyOwner {
        dexRouter = _dexRouter;
        dexFactory = _dexFactory;
        emit DEXRouterUpdated(_dexRouter, _dexFactory);
    }

    /**
     * @notice Graduates a pool by depositing ETH + tokens into the DEX and burning LP tokens.
     * @param token Address of the ERC-20 token being graduated
     * @param tokenAmount Amount of tokens to add as DEX liquidity
     */
    function graduate(
        address token,
        uint256 tokenAmount
    ) external payable nonReentrant returns (address pair, uint256 lpBurned) {
        require(msg.value > 0, "No ETH provided");
        require(tokenAmount > 0, "No tokens provided");
        require(IERC20(token).balanceOf(address(this)) >= tokenAmount, "Insufficient token balance");

        // Approve router
        IERC20(token).approve(dexRouter, tokenAmount);

        // Add liquidity with dead address as recipient
        (uint256 amountTokenUsed, uint256 amountETHUsed, uint256 liquidity) = IUniswapV2Router02(dexRouter).addLiquidityETH{value: msg.value}(
            token,
            tokenAmount,
            0, // Accept any slippage for initial pool creation
            0,
            DEAD_ADDRESS, // Burn LP tokens directly to DEAD_ADDRESS
            block.timestamp + 600
        );

        if (dexFactory != address(0)) {
            pair = IUniswapV2Factory(dexFactory).getPair(token, IUniswapV2Router02(dexRouter).WETH());
        }

        // Refund any leftover ETH or tokens back to caller
        if (msg.value > amountETHUsed) {
            uint256 ethRefund = msg.value - amountETHUsed;
            (bool success, ) = payable(msg.sender).call{value: ethRefund}("");
            require(success, "ETH refund failed");
        }
        if (tokenAmount > amountTokenUsed) {
            uint256 tokenRefund = tokenAmount - amountTokenUsed;
            IERC20(token).safeTransfer(msg.sender, tokenRefund);
        }

        emit LiquidityGraduated(
            token,
            msg.sender,
            pair,
            amountETHUsed,
            amountTokenUsed,
            liquidity
        );

        return (pair, liquidity);
    }

    receive() external payable {}
}
