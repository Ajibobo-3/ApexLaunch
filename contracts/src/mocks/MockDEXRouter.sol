// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../interfaces/IUniswapV2.sol";

contract MockPair is ERC20 {
    address public token0;
    address public token1;
    uint112 private reserve0;
    uint112 private reserve1;
    uint32 private blockTimestampLast;

    constructor(address _token0, address _token1) ERC20("Apex LP Token", "APEX-LP") {
        token0 = _token0;
        token1 = _token1;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function setReserves(uint112 _r0, uint112 _r1) external {
        reserve0 = _r0;
        reserve1 = _r1;
        blockTimestampLast = uint32(block.timestamp);
    }

    function getReserves() external view returns (uint112, uint112, uint32) {
        return (reserve0, reserve1, blockTimestampLast);
    }
}

contract MockDEXFactory is IUniswapV2Factory {
    mapping(address => mapping(address => address)) public pairs;
    address[] public allPairs;

    function createPair(address tokenA, address tokenB) external override returns (address pair) {
        require(pairs[tokenA][tokenB] == address(0), "Pair exists");
        MockPair newPair = new MockPair(tokenA, tokenB);
        pair = address(newPair);
        pairs[tokenA][tokenB] = pair;
        pairs[tokenB][tokenA] = pair;
        allPairs.push(pair);
    }

    function getPair(address tokenA, address tokenB) external view override returns (address pair) {
        return pairs[tokenA][tokenB];
    }
}

contract MockWETH is ERC20 {
    constructor() ERC20("Wrapped Ether", "WETH") {}

    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        _burn(msg.sender, amount);
        (bool ok,) = payable(msg.sender).call{value: amount}("");
        require(ok, "ETH transfer failed");
    }

    receive() external payable {
        _mint(msg.sender, msg.value);
    }
}

contract MockDEXRouter is IUniswapV2Router02 {
    address public immutable override factory;
    address public immutable override WETH;

    constructor() {
        MockDEXFactory f = new MockDEXFactory();
        factory = address(f);
        MockWETH w = new MockWETH();
        WETH = address(w);
    }

    function addLiquidityETH(address token, uint256 amountTokenDesired, uint256, uint256, address to, uint256)
        external
        payable
        override
        returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)
    {
        require(msg.value > 0, "No ETH");
        require(amountTokenDesired > 0, "No tokens");

        // Pull tokens
        IERC20(token).transferFrom(msg.sender, address(this), amountTokenDesired);

        // Get or create pair
        address pair = IUniswapV2Factory(factory).getPair(token, WETH);
        if (pair == address(0)) {
            pair = IUniswapV2Factory(factory).createPair(token, WETH);
        }

        // Calculate synthetic liquidity tokens
        liquidity = msg.value; // Simple 1:1 ETH liquidity calculation
        MockPair(pair).mint(to, liquidity);
        MockPair(pair).setReserves(uint112(amountTokenDesired), uint112(msg.value));

        return (amountTokenDesired, msg.value, liquidity);
    }

    receive() external payable {}
}
