//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {WillState} from "@interfaces/WillState.sol";
import {SMInfo} from "@interfaces/SMInfo.sol";
import {SMState} from "@interfaces/SMState.sol";

contract Will {
    error ERR_NotPM();
    error ERR_NotSM();
    error ERR_TooManySMs();
    error ERR_InvalidSMAndVotePowerLength();
    error ERR_SMAlreadyValidated();
    error ERR_SMAlreadyDeclaredDeath();
    error ERR_WillCanceled();
    error ERR_WillNotInactive();
    error ERR_WillNotActive();
    error ERR_WillExecuted();

    WillState public willState;
    address public immutable PM;
    uint16 public totalVotePower;
    uint16 public cumulatedVotePower;
    address[] private smList;
    mapping(address smAddress => SMInfo smInfo) private smMapping;
    uint8 private validatedCount;
    uint256 public deathDeclarationTimestamp;
    uint256 public executionTimeStamp;

    event EVT_WillCreated();
    event EVT_WillActivated();
    event EVT_WillModified();
    event EVT_WillCanceled();
    event EVT_SMValidated(address smAddress);
    event EVT_SMDesisted(address smAddress);
    event EVT_DeathDeclared();
    event EVT_DeathConfirmed();
    event EVT_VetoExercised(address pm);
    event EVT_AssetsSwitched(address smAddress);
    event EVT_AssetsWithdrawn();
    event EVT_AssetsDeposited();

    constructor(address pmAddress) {
        initializeWill();
        PM = pmAddress;
        emit EVT_WillCreated();
    }

    function initializeWill() private {
        willState = WillState.INACTIVE;
        totalVotePower = 0;
        cumulatedVotePower = 0;
        validatedCount = 0;
        deathDeclarationTimestamp = 0;
    }

    modifier onlyPm() {
        _onlyPm();
        _;
    }

    function _onlyPm() internal view {
        if (msg.sender != PM) revert ERR_NotPM();
    }

    modifier onlySm() {
        _onlySm();
        _;
    }

    function _onlySm() internal view {
        if (smMapping[msg.sender].index == 0) revert ERR_NotSM();
    }

    modifier willNotCanceled() {
        _willNotCanceled();
        _;
    }

    function _willNotCanceled() internal view {
        if (willState == WillState.CANCELED) revert ERR_WillCanceled();
    }

    modifier willInactive() {
        _willInactive();
        _;
    }

    function _willInactive() internal view {
        if (willState != WillState.INACTIVE) revert ERR_WillNotInactive();
    }

    modifier willActive() {
        _willActive();
        _;
    }

    function _willActive() internal view {
        if (willState != WillState.ACTIVE) revert ERR_WillNotActive();
    }

    modifier willNotExecuted() {
        _willNotExecuted();
        _;
    }

    function _willNotExecuted() internal view {
        if (willState == WillState.EXECUTED) revert ERR_WillExecuted();
    }
}
