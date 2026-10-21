// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ApexToken.sol";
import "../src/BondingCurvePool.sol";
import "../src/LaunchpadFactory.sol";
import "../src/DEXGraduator.sol";
import "../src/mocks/MockDEXRouter.sol";

contract ApexLaunchTest is Test {
    LaunchpadFactory public factory;
    DEXGraduator public graduator;
    MockDEXRouter public router;

    address public feeRecipient = makeAddr("feeRecipient");
    address public creator = makeAddr("creator");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    ApexToken public token;
    BondingCurvePool public pool;

    function setUp() public {
        vm.deal(creator, 100 ether);
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);

        // Deploy Mock DEX Router
        router = new MockDEXRouter();

        // Deploy DEX Graduator
        graduator = new DEXGraduator(address(router), router.factory());

        // Deploy Launchpad Factory
        factory = new LaunchpadFactory(feeRecipient, address(graduator));

        // Authorize factory in graduator
        graduator.setFactory(address(factory));

        // Create token + pool via factory
        vm.prank(creator);
        (address tokenAddr, address poolAddr) = factory.createToken{value: 0.0005 ether}(
            "Apex Pepe",
            "APEPE",
            "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
            0
        );

        token = ApexToken(tokenAddr);
        pool = BondingCurvePool(payable(poolAddr));
    }

    function test_InitialDeploymentState() public view {
        assertEq(token.name(), "Apex Pepe");
        assertEq(token.symbol(), "APEPE");
        assertEq(token.totalSupply(), 1_000_000_000 * 10 ** 18);
        assertEq(token.balanceOf(address(pool)), 1_000_000_000 * 10 ** 18);
        assertEq(pool.supplySold(), 0);
        assertEq(pool.ethReserve(), 0);
        assertFalse(pool.graduated());
        assertEq(factory.totalTokensLaunched(), 1);
        assertEq(factory.poolForToken(address(token)), address(pool));
        assertEq(factory.tokenForPool(address(pool)), address(token));
    }

    function test_AntiSnipeDecayingTax() public {
        uint256 startBlock = pool.creationBlock();
        vm.roll(startBlock);
        assertEq(pool.getAntiSnipeTaxPercent(), 99);

        // Advance 1 block
        vm.roll(startBlock + 1);
        assertEq(pool.getAntiSnipeTaxPercent(), 79);

        // Advance 2 blocks total
        vm.roll(startBlock + 2);
        assertEq(pool.getAntiSnipeTaxPercent(), 59);

        // Advance 3 blocks total
        vm.roll(startBlock + 3);
        assertEq(pool.getAntiSnipeTaxPercent(), 39);

        // Advance 4 blocks total
        vm.roll(startBlock + 4);
        assertEq(pool.getAntiSnipeTaxPercent(), 19);

        // Advance 5 blocks total -> 0% tax
        vm.roll(startBlock + 5);
        assertEq(pool.getAntiSnipeTaxPercent(), 0);

        // Advance 10 blocks -> still 0%
        vm.roll(startBlock + 10);
        assertEq(pool.getAntiSnipeTaxPercent(), 0);
    }

    function test_BuyAfterAntiSnipePeriod() public {
        // Fast forward 5 blocks to avoid anti-snipe tax
        vm.roll(block.number + 5);
        assertEq(pool.getAntiSnipeTaxPercent(), 0);

        uint256 buyAmount = 0.5 ether;
        (uint256 expectedTokens, uint256 fee, uint256 tax) = pool.calculateBuyQuote(buyAmount);

        assertGt(expectedTokens, 0);
        assertEq(fee, (buyAmount * 100) / 10000); // 1%
        assertEq(tax, 0);

        uint256 feeRecipientBalBefore = feeRecipient.balance;

        vm.prank(alice);
        uint256 tokensReceived = pool.buy{value: buyAmount}(expectedTokens, alice);

        assertEq(tokensReceived, expectedTokens);
        assertEq(token.balanceOf(alice), tokensReceived);
        assertEq(feeRecipient.balance, feeRecipientBalBefore + fee);
        assertEq(pool.supplySold(), tokensReceived);
        assertEq(pool.ethReserve(), buyAmount - fee);
    }

    function test_BuyIncreasesPrice() public {
        vm.roll(block.number + 5);

        uint256 priceBefore = pool.getCurrentPrice();

        vm.prank(alice);
        pool.buy{value: 1 ether}(0, alice);

        uint256 priceAfter = pool.getCurrentPrice();
        assertGt(priceAfter, priceBefore);
    }

    function test_SellTokens() public {
        vm.roll(block.number + 5);

        // Alice buys 1 ETH worth of tokens
        vm.prank(alice);
        uint256 tokensBought = pool.buy{value: 1 ether}(0, alice);

        uint256 aliceEthBefore = alice.balance;

        // Alice sells half of her tokens
        uint256 tokensToSell = tokensBought / 2;
        (uint256 expectedEthOut, ) = pool.calculateSellQuote(tokensToSell);
        assertGt(expectedEthOut, 0);

        vm.startPrank(alice);
        token.approve(address(pool), tokensToSell);
        uint256 ethReceived = pool.sell(tokensToSell, expectedEthOut, alice);
        vm.stopPrank();

        assertEq(ethReceived, expectedEthOut);
        assertEq(alice.balance, aliceEthBefore + ethReceived);
        assertEq(token.balanceOf(alice), tokensBought - tokensToSell);
    }

    function test_SlippageProtection() public {
        vm.roll(block.number + 5);

        (uint256 quote, , ) = pool.calculateBuyQuote(0.1 ether);

        // Attempting to buy with minTokensOut higher than actual should revert
        vm.prank(alice);
        vm.expectRevert("Slippage: below minTokensOut");
        pool.buy{value: 0.1 ether}(quote + 1, alice);
    }

    function test_DevBuyBundleOption() public {
        // Creator launches token with 0.0005 fee + 0.2 ETH initial buy
        uint256 initialBuy = 0.2 ether;
        uint256 totalPayment = 0.0005 ether + initialBuy;

        vm.prank(creator);
        (address devTokenAddr, address devPoolAddr) = factory.createToken{value: totalPayment}(
            "Dev Gem",
            "DGEM",
            "ipfs://test",
            0
        );

        ApexToken devToken = ApexToken(devTokenAddr);
        BondingCurvePool devPool = BondingCurvePool(payable(devPoolAddr));

        // Creator should immediately have received tokens from the bundle
        assertGt(devToken.balanceOf(creator), 0);
        assertGt(devPool.supplySold(), 0);
        assertGt(devPool.ethReserve(), 0);
    }

    function test_GraduationToDex() public {
        vm.roll(block.number + 5);

        // Alice buys enough to fill the 4.2 ETH threshold
        // Curve target is 4.2 ETH.
        // Total ETH with 1% fee is approx 4.25 ETH
        uint256 largeBuy = 4.3 ether;

        vm.prank(alice);
        pool.buy{value: largeBuy}(0, alice);

        // Pool must now be graduated
        assertTrue(pool.graduated());
        assertGt(uint256(uint160(pool.dexPair())), 0);

        // LP tokens must have been burned to DEAD address (0xdead)
        address deadAddress = 0x000000000000000000000000000000000000dEaD;
        address pair = pool.dexPair();
        assertGt(IERC20(pair).balanceOf(deadAddress), 0);

        // Trading on curve must now be disabled
        vm.prank(bob);
        vm.expectRevert("Curve graduated");
        pool.buy{value: 0.1 ether}(0, bob);

        vm.startPrank(alice);
        token.approve(address(pool), 1000);
        vm.expectRevert("Curve graduated");
        pool.sell(1000, 0, alice);
        vm.stopPrank();
    }

    function test_AntiSnipeTaxPenalizesEarlySniper() public {
        // In creation block (block 0), tax is 99%
        uint256 sniperEth = 1 ether;
        (uint256 expectedTokens, uint256 fee, uint256 tax) = pool.calculateBuyQuote(sniperEth);

        assertEq(tax, 0.9801 ether);
        assertEq(fee, 0.01 ether);

        uint256 feeRecipientBefore = feeRecipient.balance;

        vm.prank(bob);
        uint256 tokensReceived = pool.buy{value: sniperEth}(0, bob);

        // Bob receives very few tokens because 99% of net ETH went to tax
        assertEq(tokensReceived, expectedTokens);
        // Fee recipient received both swap fee and anti-snipe tax
        assertEq(feeRecipient.balance, feeRecipientBefore + fee + tax);
    }

    function test_MultipleUsersTradingCycle() public {
        vm.roll(pool.creationBlock() + 5);

        // Alice buys 1 ETH
        vm.prank(alice);
        uint256 aliceTokens = pool.buy{value: 1 ether}(0, alice);

        // Bob buys 2 ETH
        vm.prank(bob);
        pool.buy{value: 2 ether}(0, bob);

        assertGt(pool.getCurrentPrice(), 1_000_000_000);
        assertGt(pool.getMarketCap(), 0);

        // Alice sells all her tokens at higher price
        vm.startPrank(alice);
        token.approve(address(pool), aliceTokens);
        (uint256 aliceRefund, ) = pool.calculateSellQuote(aliceTokens);
        uint256 ethReceived = pool.sell(aliceTokens, 0, alice);
        vm.stopPrank();

        assertEq(ethReceived, aliceRefund);
        assertEq(token.balanceOf(alice), 0);
        assertGt(token.balanceOf(bob), 0);
    }

    function test_GraduationProgressMetric() public {
        vm.roll(pool.creationBlock() + 5);

        assertEq(pool.getGraduationProgress(), 0);

        // Alice buys ~2.1 ETH (around 50% progress)
        vm.prank(alice);
        pool.buy{value: 2.12 ether}(0, alice);

        uint256 progress = pool.getGraduationProgress();
        // Progress should be around 5000 bps (50%)
        assertGt(progress, 4500);
        assertLt(progress, 5500);
    }

    function testFuzz_BuyQuoteMatchesExecution(uint256 ethAmount) public {
        // Bound ethAmount between 0.005 ETH and 3 ETH
        ethAmount = bound(ethAmount, 0.005 ether, 3.0 ether);

        vm.roll(pool.creationBlock() + 5);

        (uint256 quoteTokens, , ) = pool.calculateBuyQuote(ethAmount);

        vm.prank(alice);
        uint256 actualTokens = pool.buy{value: ethAmount}(quoteTokens, alice);

        assertEq(actualTokens, quoteTokens);
    }
}
