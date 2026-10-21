// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./DEXGraduator.sol";

/**
 * @title BondingCurvePool
 * @notice Automated bonding curve market maker with anti-snipe decaying tax,
 * dynamic linear pricing, 1% swap fee, and automatic DEX liquidity graduation.
 */
contract BondingCurvePool is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Constants ---
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10 ** 18; // 1 Billion tokens
    uint256 public constant CURVE_SUPPLY = 800_000_000 * 10 ** 18;    // 800 Million tokens (80%)
    uint256 public constant DEX_RESERVE = 200_000_000 * 10 ** 18;     // 200 Million tokens (20%)
    uint256 public constant GRADUATION_THRESHOLD = 4.2 ether;          // 4.2 ETH accumulated
    uint256 public constant SWAP_FEE_BPS = 100;                        // 1% (100 / 10000)
    uint256 public constant BPS_DENOMINATOR = 10_000;

    // Mathematical curve constants:
    // Spot Price P(s) = P0 + (K_NUM * s) / (K_DEN_BASE)
    // Integral from s to s+ds = (P0 * ds) / 1e18 + (K_NUM * ds * (2s + ds)) / K_DEN
    // At s = 0 to 800M tokens, total ETH integral = 4.2 ETH exactly.
    uint256 public constant P0 = 1_000_000_000;                       // 1 Gwei base spot price
    uint256 public constant K_NUM = 85;
    uint256 public constant K_DEN = 16 * 10 ** 36;
    uint256 public constant C1_BASE = 16 * 10 ** 27;                  // (K_DEN * P0) / 1e18

    // --- State Variables ---
    address public immutable token;
    address public immutable factory;
    address public immutable creator;
    address public immutable feeRecipient;
    DEXGraduator public immutable dexGraduator;

    uint256 public immutable creationBlock;
    uint256 public immutable creationTimestamp;

    uint256 public supplySold;
    uint256 public ethReserve;
    bool public graduated;
    address public dexPair;

    // --- Events ---
    event Buy(
        address indexed buyer,
        address indexed recipient,
        uint256 ethIn,
        uint256 tokensOut,
        uint256 fee,
        uint256 antiSnipeTax,
        uint256 newSupplySold,
        uint256 spotPrice
    );

    event Sell(
        address indexed seller,
        address indexed recipient,
        uint256 tokensIn,
        uint256 ethOut,
        uint256 fee,
        uint256 newSupplySold,
        uint256 spotPrice
    );

    event PoolGraduated(
        address indexed token,
        address indexed dexPair,
        uint256 ethLiquidity,
        uint256 tokenLiquidity,
        uint256 lpTokensBurned
    );

    event EmergencySweep(address indexed token, uint256 amount);

    constructor(
        address _token,
        address _creator,
        address _feeRecipient,
        address _dexGraduator
    ) {
        require(_token != address(0), "Invalid token");
        require(_creator != address(0), "Invalid creator");
        require(_feeRecipient != address(0), "Invalid feeRecipient");
        require(_dexGraduator != address(0), "Invalid graduator");

        token = _token;
        factory = msg.sender;
        creator = _creator;
        feeRecipient = _feeRecipient;
        dexGraduator = DEXGraduator(payable(_dexGraduator));

        creationBlock = block.number;
        creationTimestamp = block.timestamp;
    }

    // --- Anti-Snipe Calculation ---

    /**
     * @notice Decaying anti-snipe tax percent: 99% decaying across 5 blocks to 0%.
     * Block 0: 99%
     * Block 1: 79%
     * Block 2: 59%
     * Block 3: 39%
     * Block 4: 19%
     * Block 5+: 0%
     */
    function getAntiSnipeTaxPercent() public view returns (uint256) {
        uint256 blocksPassed = block.number > creationBlock ? block.number - creationBlock : 0;
        if (blocksPassed >= 5) {
            return 0;
        }
        return 99 - (blocksPassed * 20);
    }

    // --- Price & Quote Functions ---

    /**
     * @notice Current spot price of 1 full token (10^18 units) in wei ETH.
     */
    function getCurrentPrice() public view returns (uint256) {
        // P(s) = P0 + (K_NUM * s * 1e18) / (8 * 10^36)
        // At s=0: 1 Gwei (1e9 wei)
        // At s=800M: 1e9 + (85 * 8e26 * 1e18) / (8 * 10^36) = 1e9 + 8.5e9 = 9.5 Gwei
        uint256 slopePart = (K_NUM * supplySold * 10 ** 18) / (8 * 10 ** 36);
        return P0 + slopePart;
    }

    /**
     * @notice Market cap in wei ETH based on current spot price.
     */
    function getMarketCap() public view returns (uint256) {
        return (getCurrentPrice() * TOTAL_SUPPLY) / 10 ** 18;
    }

    /**
     * @notice Percentage progress to graduation in basis points (10,000 = 100%).
     */
    function getGraduationProgress() public view returns (uint256) {
        if (graduated) return 10_000;
        if (ethReserve >= GRADUATION_THRESHOLD) return 10_000;
        return (ethReserve * 10_000) / GRADUATION_THRESHOLD;
    }

    /**
     * @notice Calculates the cost in ETH to purchase `tokenAmount` tokens from current supply sold.
     */
    function calculateCostForTokens(uint256 currentSupply, uint256 tokenAmount) public pure returns (uint256) {
        if (tokenAmount == 0) return 0;
        uint256 baseCost = (P0 * tokenAmount) / 10 ** 18;
        uint256 slopeCost = (tokenAmount * (2 * currentSupply + tokenAmount) * K_NUM) / K_DEN;
        return baseCost + slopeCost;
    }

    /**
     * @notice Calculates buy quote: tokens received, platform swap fee, and anti-snipe tax.
     */
    function calculateBuyQuote(
        uint256 ethAmountIn
    ) public view returns (uint256 tokensOut, uint256 fee, uint256 antiSnipeTax) {
        return calculateBuyQuoteFor(ethAmountIn, msg.sender);
    }

    /**
     * @notice Calculates buy quote considering whether buyer is exempt (e.g. factory dev-buy bundle).
     */
    function calculateBuyQuoteFor(
        uint256 ethAmountIn,
        address buyer
    ) public view returns (uint256 tokensOut, uint256 fee, uint256 antiSnipeTax) {
        if (ethAmountIn == 0 || graduated) return (0, 0, 0);

        fee = (ethAmountIn * SWAP_FEE_BPS) / BPS_DENOMINATOR;
        uint256 remainingEth = ethAmountIn - fee;
        uint256 taxPercent = (buyer == factory) ? 0 : getAntiSnipeTaxPercent();
        antiSnipeTax = (remainingEth * taxPercent) / 100;

        uint256 effectiveEth = remainingEth - antiSnipeTax;
        if (effectiveEth == 0) return (0, fee, antiSnipeTax);

        // Calculate available tokens before graduation
        uint256 remainingCurveTokens = CURVE_SUPPLY - supplySold;
        if (remainingCurveTokens == 0) return (0, fee, antiSnipeTax);

        // Solve quadratic equation: c2 * (ds)^2 + c1 * ds - c0 = 0
        // c2 = K_NUM = 85
        // c1 = C1_BASE + 2 * K_NUM * supplySold
        // c0 = K_DEN * effectiveEth
        uint256 c1 = C1_BASE + (2 * K_NUM * supplySold);
        uint256 c0 = K_DEN * effectiveEth;

        // D = c1^2 + 4 * c2 * c0
        uint256 d = (c1 * c1) + (4 * K_NUM * c0);
        uint256 sqrtD = Math.sqrt(d);

        tokensOut = (sqrtD - c1) / (2 * K_NUM);

        if (tokensOut > remainingCurveTokens) {
            tokensOut = remainingCurveTokens;
        }
    }

    /**
     * @notice Calculates sell quote: net ETH returned and platform swap fee.
     */
    function calculateSellQuote(
        uint256 tokenAmountIn
    ) public view returns (uint256 ethRefundNet, uint256 fee) {
        if (tokenAmountIn == 0 || graduated || supplySold == 0) return (0, 0);

        uint256 amountToSell = tokenAmountIn > supplySold ? supplySold : tokenAmountIn;

        // ETH gross refund = integral from (supplySold - amountToSell) to supplySold
        uint256 baseRefund = (P0 * amountToSell) / 10 ** 18;
        uint256 slopeRefund = (amountToSell * (2 * supplySold - amountToSell) * K_NUM) / K_DEN;
        uint256 grossEth = baseRefund + slopeRefund;

        if (grossEth > ethReserve) {
            grossEth = ethReserve;
        }

        fee = (grossEth * SWAP_FEE_BPS) / BPS_DENOMINATOR;
        ethRefundNet = grossEth > fee ? grossEth - fee : 0;
    }

    // --- Trading Functions ---

    /**
     * @notice Buys tokens along the bonding curve.
     * @param minTokensOut Slippage protection minimum tokens out
     * @param recipient Recipient of the purchased tokens
     */
    function buy(
        uint256 minTokensOut,
        address recipient
    ) external payable nonReentrant returns (uint256 tokensOut) {
        require(!graduated, "Curve graduated");
        require(msg.value > 0, "No ETH sent");
        require(recipient != address(0), "Invalid recipient");

        uint256 ethIn = msg.value;
        uint256 fee = (ethIn * SWAP_FEE_BPS) / BPS_DENOMINATOR;
        uint256 remainingEth = ethIn - fee;
        uint256 taxPercent = (msg.sender == factory) ? 0 : getAntiSnipeTaxPercent();
        uint256 antiSnipeTax = (remainingEth * taxPercent) / 100;
        uint256 effectiveEth = remainingEth - antiSnipeTax;

        require(effectiveEth > 0, "Effective ETH is zero");

        // Forward platform fee to fee recipient
        if (fee > 0) {
            (bool feeOk, ) = payable(feeRecipient).call{value: fee}("");
            require(feeOk, "Fee transfer failed");
        }

        // Anti-snipe tax is sent to feeRecipient / treasury
        if (antiSnipeTax > 0) {
            (bool taxOk, ) = payable(feeRecipient).call{value: antiSnipeTax}("");
            require(taxOk, "Tax transfer failed");
        }

        // Solve for tokens out using quadratic formula
        uint256 c1 = C1_BASE + (2 * K_NUM * supplySold);
        uint256 c0 = K_DEN * effectiveEth;
        uint256 d = (c1 * c1) + (4 * K_NUM * c0);
        uint256 sqrtD = Math.sqrt(d);

        tokensOut = (sqrtD - c1) / (2 * K_NUM);

        uint256 remainingCurve = CURVE_SUPPLY - supplySold;
        uint256 ethToCurve = effectiveEth;

        // If buy exceeds remaining curve supply, cap it and refund unused ETH
        if (tokensOut > remainingCurve) {
            tokensOut = remainingCurve;
            uint256 exactEthNeeded = calculateCostForTokens(supplySold, tokensOut);
            if (effectiveEth > exactEthNeeded) {
                uint256 refundEth = effectiveEth - exactEthNeeded;
                ethToCurve = exactEthNeeded;
                (bool refundOk, ) = payable(msg.sender).call{value: refundEth}("");
                require(refundOk, "ETH refund failed");
            }
        }

        require(tokensOut >= minTokensOut, "Slippage: below minTokensOut");
        require(tokensOut > 0, "Zero tokens out");

        supplySold += tokensOut;
        ethReserve += ethToCurve;

        // Transfer tokens to recipient
        IERC20(token).safeTransfer(recipient, tokensOut);

        emit Buy(
            msg.sender,
            recipient,
            ethIn,
            tokensOut,
            fee,
            antiSnipeTax,
            supplySold,
            getCurrentPrice()
        );

        // Check graduation condition
        if (ethReserve >= GRADUATION_THRESHOLD || supplySold >= CURVE_SUPPLY) {
            _graduate();
        }
    }

    /**
     * @notice Sells tokens back to the bonding curve in exchange for ETH.
     * @param tokenAmount Amount of tokens to sell
     * @param minEthOut Slippage protection minimum ETH out
     * @param recipient Recipient of the ETH refund
     */
    function sell(
        uint256 tokenAmount,
        uint256 minEthOut,
        address recipient
    ) external nonReentrant returns (uint256 ethRefundNet) {
        require(!graduated, "Curve graduated");
        require(tokenAmount > 0, "Zero tokens to sell");
        require(supplySold >= tokenAmount, "Cannot sell more than sold");
        require(recipient != address(0), "Invalid recipient");

        // Calculate gross ETH refund
        uint256 baseRefund = (P0 * tokenAmount) / 10 ** 18;
        uint256 slopeRefund = (tokenAmount * (2 * supplySold - tokenAmount) * K_NUM) / K_DEN;
        uint256 grossEth = baseRefund + slopeRefund;

        if (grossEth > ethReserve) {
            grossEth = ethReserve;
        }

        uint256 fee = (grossEth * SWAP_FEE_BPS) / BPS_DENOMINATOR;
        ethRefundNet = grossEth - fee;

        require(ethRefundNet >= minEthOut, "Slippage: below minEthOut");

        supplySold -= tokenAmount;
        ethReserve -= grossEth;

        // Pull tokens from seller
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);

        // Forward platform fee
        if (fee > 0) {
            (bool feeOk, ) = payable(feeRecipient).call{value: fee}("");
            require(feeOk, "Fee transfer failed");
        }

        // Send net ETH to recipient
        (bool refundOk, ) = payable(recipient).call{value: ethRefundNet}("");
        require(refundOk, "ETH refund transfer failed");

        emit Sell(
            msg.sender,
            recipient,
            tokenAmount,
            ethRefundNet,
            fee,
            supplySold,
            getCurrentPrice()
        );
    }

    /**
     * @notice Internal trigger to graduate pool liquidity to DEX.
     */
    function _graduate() internal {
        graduated = true;

        uint256 ethToMigrate = ethReserve;
        ethReserve = 0;

        // Transfer DEX reserve tokens to dexGraduator
        IERC20(token).safeTransfer(address(dexGraduator), DEX_RESERVE);

        // Call DEXGraduator with ETH
        (address pair, uint256 lpBurned) = dexGraduator.graduate{value: ethToMigrate}(
            token,
            DEX_RESERVE
        );

        dexPair = pair;

        emit PoolGraduated(token, pair, ethToMigrate, DEX_RESERVE, lpBurned);
    }

    /**
     * @notice External callable graduation trigger if threshold is reached.
     */
    function graduate() external nonReentrant {
        require(!graduated, "Already graduated");
        require(ethReserve >= GRADUATION_THRESHOLD || supplySold >= CURVE_SUPPLY, "Threshold not reached");
        _graduate();
    }

    receive() external payable {
        // Direct ETH deposits treated as buy for msg.sender
        if (!graduated && msg.value > 0) {
            // Can be called via buy() directly
            revert("Please use buy()");
        }
    }
}
