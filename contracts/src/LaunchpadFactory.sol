// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ApexToken.sol";
import "./BondingCurvePool.sol";
import "./DEXGraduator.sol";

/**
 * @title LaunchpadFactory
 * @notice Factory contract that deploys new ApexTokens and BondingCurvePools,
 * enforces platform creation fees, supports creator dev-buy bundles, and indexes all launches.
 */
contract LaunchpadFactory is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    uint256 public creationFee = 0.0005 ether;
    address public feeRecipient;
    address public dexGraduator;

    address[] public allTokens;
    address[] public allPools;

    mapping(address => address) public poolForToken;
    mapping(address => address) public tokenForPool;
    mapping(address => bool) public isToken;
    mapping(address => address[]) public creatorTokens;

    event TokenCreated(
        address indexed token,
        address indexed pool,
        address indexed creator,
        string name,
        string symbol,
        string tokenURI,
        uint256 initialBuyEth,
        uint256 initialBuyTokens,
        uint256 timestamp
    );

    event CreationFeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newFeeRecipient);
    event DEXGraduatorUpdated(address newGraduator);

    constructor(
        address _feeRecipient,
        address _dexGraduator
    ) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_dexGraduator != address(0), "Invalid graduator");

        feeRecipient = _feeRecipient;
        dexGraduator = _dexGraduator;
    }

    function setCreationFee(uint256 _newFee) external onlyOwner {
        creationFee = _newFee;
        emit CreationFeeUpdated(_newFee);
    }

    function setFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient");
        feeRecipient = _newRecipient;
        emit FeeRecipientUpdated(_newRecipient);
    }

    function setDEXGraduator(address _newGraduator) external onlyOwner {
        require(_newGraduator != address(0), "Invalid graduator");
        dexGraduator = _newGraduator;
        emit DEXGraduatorUpdated(_newGraduator);
    }

    /**
     * @notice Total number of tokens created through the factory.
     */
    function totalTokensLaunched() external view returns (uint256) {
        return allTokens.length;
    }

    /**
     * @notice Returns all tokens deployed by a specific creator.
     */
    function getTokensByCreator(address _creator) external view returns (address[] memory) {
        return creatorTokens[_creator];
    }

    /**
     * @notice Returns paginated list of launched tokens.
     */
    function getTokens(uint256 offset, uint256 limit) external view returns (address[] memory tokens) {
        uint256 total = allTokens.length;
        if (offset >= total) return new address[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 length = end - offset;

        tokens = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            tokens[i] = allTokens[offset + i];
        }
    }

    /**
     * @notice Deploys a new token and bonding curve pool.
     * Supports optional dev-buy bundle with any ETH above the creation fee.
     * @param name Name of the token
     * @param symbol Symbol of the token
     * @param tokenURI IPFS or metadata URI containing logo, description, and socials
     * @param minInitialBuyTokens Minimum tokens to receive if dev-buy bundle is included
     */
    function createToken(
        string calldata name,
        string calldata symbol,
        string calldata tokenURI,
        uint256 minInitialBuyTokens
    ) external payable nonReentrant returns (address tokenAddress, address poolAddress) {
        require(msg.value >= creationFee, "Insufficient creation fee");

        uint256 initialBuyEth = msg.value - creationFee;

        // Collect platform creation fee
        if (creationFee > 0) {
            (bool feeOk, ) = payable(feeRecipient).call{value: creationFee}("");
            require(feeOk, "Creation fee transfer failed");
        }

        // 1. Deploy the ERC-20 ApexToken (mints 1B tokens to factory)
        ApexToken token = new ApexToken(name, symbol, tokenURI, msg.sender);
        tokenAddress = address(token);

        // 2. Deploy the BondingCurvePool
        BondingCurvePool pool = new BondingCurvePool(
            tokenAddress,
            msg.sender,
            feeRecipient,
            dexGraduator
        );
        poolAddress = address(pool);

        // 3. Fund pool with the total supply
        IERC20(tokenAddress).safeTransfer(poolAddress, token.TOTAL_SUPPLY());

        // 4. Record mappings and indexing
        allTokens.push(tokenAddress);
        allPools.push(poolAddress);
        poolForToken[tokenAddress] = poolAddress;
        tokenForPool[poolAddress] = tokenAddress;
        isToken[tokenAddress] = true;
        creatorTokens[msg.sender].push(tokenAddress);

        // 5. Execute initial dev-buy bundle if extra ETH was provided
        uint256 initialTokens = 0;
        if (initialBuyEth > 0) {
            initialTokens = pool.buy{value: initialBuyEth}(minInitialBuyTokens, msg.sender);
        }

        emit TokenCreated(
            tokenAddress,
            poolAddress,
            msg.sender,
            name,
            symbol,
            tokenURI,
            initialBuyEth,
            initialTokens,
            block.timestamp
        );

        return (tokenAddress, poolAddress);
    }
}
