// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title ApexToken
 * @notice Fixed supply ERC-20 token with EIP-2612 Permit support and rich launchpad metadata.
 * @dev 1 Billion fixed supply minted entirely upon deployment and transferred to BondingCurvePool.
 */
contract ApexToken is ERC20, ERC20Burnable, ERC20Permit {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10 ** 18; // 1 Billion tokens

    string public tokenURI;
    address public immutable creator;
    uint256 public immutable launchedAt;

    event MetadataUpdated(string newTokenURI);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory tokenURI_,
        address creator_
    ) ERC20(name_, symbol_) ERC20Permit(name_) {
        require(creator_ != address(0), "Invalid creator");

        tokenURI = tokenURI_;
        creator = creator_;
        launchedAt = block.timestamp;

        // Mint entire supply to deployer (LaunchpadFactory)
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    /**
     * @notice Allows creator to update metadata URI if needed.
     */
    function updateTokenURI(string calldata newTokenURI) external {
        require(msg.sender == creator, "Unauthorized");
        tokenURI = newTokenURI;
        emit MetadataUpdated(newTokenURI);
    }
}
