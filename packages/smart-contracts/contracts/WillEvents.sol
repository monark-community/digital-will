//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

// SIGNATURE GIVEN ADJACENT TO THE EVENT FOR DEBUGGING.

abstract contract WillEvents {
    // ========================
    // Will-related events
    event EVT_WillCreated(); // 0x52ddaebb
    event EVT_WillActivated(); // 0xf6952527
    event EVT_WillModified(); // 0xfe07f774
    event EVT_WillCanceled(); // 0x703be417
    event EVT_WillNotCanceled(); // 0xd0ff9f07

    // ========================
    // Assets-related events
    event EVT_AssetsDeposited(); // 0xf67579e3
    event EVT_AssetsWithdrawn(); // 0x10905724
    event EVT_AssetsWithdrawnAll(); // 0xed373ad6
    event EVT_AssetsSwitched(address smAddress); // 0xb8d31018

    // ========================
    // Process / SM / Death-related events
    event EVT_SMValidated(address smAddress); // 0x52ddaebb
    event EVT_SMDesisted(address smAddress); // 0xf6952527
    event EVT_DeathDeclared(); // 0xfe07f774
    event EVT_DeathConfirmed(); // 0x703be417
    event EVT_VetoExercised(); // 0xd0ff9f07
}
