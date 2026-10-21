// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ApexToken.sol";
import "../src/BondingCurvePool.sol";
import "../src/LaunchpadFactory.sol";
import "../src/DEXGraduator.sol";
import "../src/mocks/MockDEXRouter.sol";

contract DeployScript is Script {
    // Known Sepolia addresses
    address constant SEPOLIA_UNISWAP_V2_ROUTER = 0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008;
    address constant SEPOLIA_UNISWAP_V2_FACTORY = 0x7E0987E5b3a30e3f2828572Bb659A548460a3003;

    function run() external {
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80) // Default Anvil key #0
        );

        address deployer = vm.addr(deployerPrivateKey);
        if (deployer.balance < 1 ether) {
            vm.deal(deployer, 10 ether);
        }
        console.log("Deploying ApexLaunch from:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        address dexRouter;
        address dexFactory;

        // If on Sepolia, use real Uniswap V2 testnet router; otherwise deploy mock router
        if (block.chainid == 11155111) {
            dexRouter = SEPOLIA_UNISWAP_V2_ROUTER;
            dexFactory = SEPOLIA_UNISWAP_V2_FACTORY;
            console.log("Using Sepolia Uniswap V2 Router:", dexRouter);
        } else {
            MockDEXRouter mockRouter = new MockDEXRouter();
            dexRouter = address(mockRouter);
            dexFactory = mockRouter.factory();
            console.log("Deployed MockDEXRouter:", dexRouter);
        }

        // 1. Deploy DEXGraduator
        DEXGraduator graduator = new DEXGraduator(dexRouter, dexFactory);
        console.log("Deployed DEXGraduator:", address(graduator));

        // 2. Deploy LaunchpadFactory
        LaunchpadFactory factory = new LaunchpadFactory(deployer, address(graduator));
        console.log("Deployed LaunchpadFactory:", address(factory));

        // 3. Link Factory in Graduator
        graduator.setFactory(address(factory));
        console.log("Linked Factory in DEXGraduator");

        // 4. Launch inaugural showcase tokens
        (address apexToken, address apexPool) = factory.createToken{value: 0.0005 ether + 0.1 ether}(
            "Apex Cybernetics",
            "APEX",
            "https://bafybeigvffp46s4h34t45vjyg2h62xirq72z6r75yqly76j7m2w3r6sxyu.ipfs.nftstorage.link/apex.json",
            0
        );
        console.log("Showcase Token deployed:", apexToken);
        console.log("Showcase Pool deployed:", apexPool);

        (address novaToken, address novaPool) = factory.createToken{value: 0.0005 ether}(
            "Nova Quantum",
            "NOVA",
            "https://bafybeigvffp46s4h34t45vjyg2h62xirq72z6r75yqly76j7m2w3r6sxyu.ipfs.nftstorage.link/nova.json",
            0
        );
        console.log("Nova Token deployed:", novaToken);
        console.log("Nova Pool deployed:", novaPool);

        vm.stopBroadcast();

        console.log("\n--- DEPLOYMENT COMPLETE ---");
        console.log("FACTORY_ADDRESS:", address(factory));
        console.log("GRADUATOR_ADDRESS:", address(graduator));
        console.log("DEX_ROUTER:", dexRouter);
    }
}
