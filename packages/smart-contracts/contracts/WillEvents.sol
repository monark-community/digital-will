//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

// SIGNATURE GIVEN ADJACENT TO THE EVENT FOR DEBUGGING.

abstract contract WillEvents {
    // ========================
    // Will-related events
    event EVT_WillChain_WillActivated(); // 0xc6012a41
    event EVT_WillChain_WillCanceled(); // 0x22e2a16c

    // ========================
    // Will-update-related events
    event EVT_WillChain_SMUpdated(
        address indexed smAddress,
        uint8 indexed votePower
    ); // 0x4ca053a8
    event EVT_WillChain_SMAdded(
        address indexed smAddress,
        uint8 indexed votePower
    ); // 0xa9cf850b
    event EVT_WillChain_SMRemoved(address indexed smAddress); // 0x0789a1d1
    event EVT_WillChain_SecurityPeriodUpdated(
        uint256 indexed minSecurityPeriod,
        uint256 indexed maxSecurityPeriod
    ); // 0x3dee9173

    // ========================
    // Assets-related events
    event EVT_WillChain_AssetsSwapped(
        address indexed smAddress,
        uint256 indexed usdcAmount
    ); // 0x7b936eb9

    // ========================
    // Process / SM / Death-related events
    event EVT_WillChain_SMValidated(address indexed smAddress); // 0x52ddaebb
    event EVT_WillChain_SMDesisted(
        address indexed smAddress,
        bool indexed validatedPreDesist
    ); // 0xb8f3e5f2
    event EVT_WillChain_DeathDeclared(
        address indexed smAddress,
        uint256 indexed assets
    ); // 0x22161f8a
    event EVT_WillChain_DeathConfirmed(address indexed smAddress); // 0xcff84342
    event EVT_WillChain_VetoExercised(); // 0xd0ff9f07
}
