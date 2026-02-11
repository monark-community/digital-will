//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

abstract contract WillEvents {
    event EVT_SMValidated(address smAddress);
    event EVT_SMDesisted(address smAddress);
    event EVT_DeathDeclared();
    event EVT_DeathConfirmed();
    event EVT_VetoExercised();
    event EVT_WillCreated();
    event EVT_WillActivated();
    event EVT_WillModified();
    event EVT_WillCanceled();
    event EVT_WillNotCanceled();
    event EVT_AssetsSwitched(address smAddress);
    event EVT_AssetsWithdrawn();
    event EVT_AssetsDeposited();
    event EVT_AssetsWithdrawnAll();
}
