//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {WillEvents} from "@src/WillEvents.sol";

import {WillState} from "@interfaces/WillState.sol";
import {SMInfo, SMPartialInfo} from "@interfaces/SMInfo.sol";
import {SMState} from "@interfaces/SMState.sol";
import {SecurityPeriodConfig} from "@interfaces/SecurityPeriodConfig.sol";

import "@src/WillErrors.sol" as Errors;

import "@constants/Will.c.sol" as C_WILL;

contract Will is WillEvents {
    /*/////////////////////////////////////////////////////////
                       VARIABLES
    /////////////////////////////////////////////////////////*/
    address public immutable PM_I;

    WillState public willStateS;
    SecurityPeriodConfig public securityPeriodConfigS;
    uint16 public totalVotePowerS;
    uint16 public cumulatedVotePowerS;
    address[] private smListS;
    mapping(address smAddress => SMInfo smInfo) private smMappingS;
    uint8 private validatedCountS;
    uint256 public deathDeclarationTimestampS;
    uint256 public executionTimeStampS;
    uint256 public cooldownTimeStampS;

    /* ========= CONSTRUCTOR ========= */
    constructor(
        address pmAddress,
        SMPartialInfo[] memory newSmList,
        SecurityPeriodConfig memory securityPeriodConfig
    ) {
        PM_I = pmAddress;
        createWillInitial(newSmList, securityPeriodConfig);
    }

    /*/////////////////////////////////////////////////////////
                       FUNCTIONS
    /////////////////////////////////////////////////////////*/

    /* ========= WILL MANAGEMENT ========= */
    // Necessary because msg.sender is not the PM when the will is created by the factory, so we can't add modifier onlyPm.
    // tx.origin is spoofable, we gotta use msg.sender.
    function createWillInitial(
        SMPartialInfo[] memory newSmList,
        SecurityPeriodConfig memory securityPeriodConfig
    ) private {
        createWillInternal(newSmList, securityPeriodConfig);
    }

    function createNewWill(
        SMPartialInfo[] memory newSmList,
        SecurityPeriodConfig memory securityPeriodConfig
    ) public onlyPm willCanceled {
        createWillInternal(newSmList, securityPeriodConfig);
    }

    function createWillInternal(
        SMPartialInfo[] memory newSmList,
        SecurityPeriodConfig memory securityPeriodConfig
    ) private {
        if (newSmList.length < 2) revert Errors.ERR_NotEnoughSMs();
        if (newSmList.length > 255) revert Errors.ERR_TooManySMs();
        _validateSecurityPeriod(securityPeriodConfig);

        initializeWill(securityPeriodConfig);
        replaceAllSm(newSmList);

        emit EVT_WillCreated();
    }

    function cancelWill() public onlyPm willNotExecuted willNotCanceled {
        willStateS = WillState.CANCELED;
        withdrawAllPm();
        emit EVT_WillCanceled();
    }

    function initializeWill(
        SecurityPeriodConfig memory securityPeriodConfig
    ) private {
        willStateS = WillState.INACTIVE;
        totalVotePowerS = 0;
        cumulatedVotePowerS = 0;
        validatedCountS = 0;
        deathDeclarationTimestampS = 0;
        executionTimeStampS = 0;
        cooldownTimeStampS = 0;
        securityPeriodConfigS = securityPeriodConfig;
    }

    function updateWill(
        SMPartialInfo[] memory updatedSmList,
        SMPartialInfo[] memory addedSmList,
        SMPartialInfo[] memory deletedSmList,
        SecurityPeriodConfig memory securityPeriodConfig
    ) public onlyPm willNotCanceled willNotExecuted {
        _validateSecurityPeriod(securityPeriodConfig);
        _validateSmUpdate(updatedSmList, addedSmList, deletedSmList);

        securityPeriodConfigS = securityPeriodConfig;
        updateSmList(updatedSmList, addedSmList, deletedSmList);

        checkAndUpdateWillState();

        emit EVT_WillModified();
    }

    function _validateSecurityPeriod(
        SecurityPeriodConfig memory securityPeriodConfig
    ) private pure {
        if (
            securityPeriodConfig.minSecurityPeriod >=
            securityPeriodConfig.maxSecurityPeriod
        ) revert Errors.ERR_InvalidSecurityPeriods();
    }

    function checkAndUpdateWillState() private {
        totalVotePowerS = 0;
        cumulatedVotePowerS = 0;
        validatedCountS = 0;

        for (uint256 i = 0; i < smListS.length; i++) {
            if (smMappingS[smListS[i]].state != SMState.PENDING) {
                // VALIDATED or DECLARED_DEATH
                validatedCountS += 1;
                if (smMappingS[smListS[i]].state == SMState.DECLARED_DEATH) {
                    cumulatedVotePowerS += smMappingS[smListS[i]].votePower;
                }
            }
            totalVotePowerS += smMappingS[smListS[i]].votePower;
        }

        // Rule 1: if at least one PENDING → INACTIVE
        if (validatedCountS != smListS.length) {
            willStateS = WillState.INACTIVE;
        }
        // Rule 2: all VALIDATED/DECLARED_DEATH → ACTIVE
        else {
            willStateS = WillState.ACTIVE;
            //TODO : updatePeriod();
        }
    }

    /////////////////////////////////////////////////////////
    /* ========= Secondary Member Management ========= */
    function updateSmList(
        SMPartialInfo[] memory updatedSmList,
        SMPartialInfo[] memory addedSmList,
        SMPartialInfo[] memory deletedSmList
    ) private {
        updateExistentSmList(updatedSmList);
        addNewSmList(addedSmList);
        deleteSmFromList(deletedSmList);
    }

    function _validateSmUpdate(
        SMPartialInfo[] memory updatedSmList,
        SMPartialInfo[] memory addedSmList,
        SMPartialInfo[] memory deletedSmList
    ) private view {
        // Trivial case with empty arrays.
        if (
            updatedSmList.length == 0 &&
            addedSmList.length == 0 &&
            deletedSmList.length == 0
        ) revert Errors.ERR_EmptySMLists();

        // No duplicates/overlap in the lists.
        _checkNoSmDuplicates(updatedSmList, addedSmList, deletedSmList);

        // Updated SMs must exist
        for (uint256 i = 0; i < updatedSmList.length; i++) {
            if (smMappingS[updatedSmList[i].smAddress].index == 0) {
                revert Errors.ERR_UpdatedSMDoesNotExist();
            }
        }

        // Deleted SMs must exist
        for (uint256 i = 0; i < deletedSmList.length; i++) {
            if (smMappingS[deletedSmList[i].smAddress].index == 0) {
                revert Errors.ERR_DeletedSMDoesNotExist();
            }
        }

        // New SMs must not exist
        for (uint256 i = 0; i < addedSmList.length; i++) {
            if (smMappingS[addedSmList[i].smAddress].index != 0) {
                revert Errors.ERR_CreatedSMExistsAlready();
            }
        }

        // Prevent underflow explicitly
        if (deletedSmList.length + 1 >= smListS.length + addedSmList.length) {
            revert Errors.ERR_SMListsFinalResultIncoherent();
        }

        // Enforce upper bound (fits uint8 index)
        if (smListS.length + addedSmList.length - deletedSmList.length > 255) {
            revert Errors.ERR_SMListsFinalResultTooManySM();
        }
    }

    function _checkNoSmDuplicates(
        SMPartialInfo[] memory a,
        SMPartialInfo[] memory b,
        SMPartialInfo[] memory c
    ) private pure {
        for (uint256 i = 0; i < a.length; i++) {
            for (uint256 j = 0; j < b.length; j++) {
                if (a[i].smAddress == b[j].smAddress)
                    revert Errors.ERR_DuplicateSM();
            }
            for (uint256 j = 0; j < c.length; j++) {
                if (a[i].smAddress == c[j].smAddress)
                    revert Errors.ERR_DuplicateSM();
            }
        }

        for (uint256 i = 0; i < b.length; i++) {
            for (uint256 j = 0; j < c.length; j++) {
                if (b[i].smAddress == c[j].smAddress)
                    revert Errors.ERR_DuplicateSM();
            }
        }
    }

    function updateExistentSmList(
        SMPartialInfo[] memory updatedSmList
    ) private {
        for (uint256 i = 0; i < updatedSmList.length; i++) {
            SMInfo storage infoUpdatedSm = smMappingS[
                updatedSmList[i].smAddress
            ];
            infoUpdatedSm.votePower = updatedSmList[i].votePower;
        }
    }

    function addNewSmList(SMPartialInfo[] memory newSmList) private {
        for (uint256 i = 0; i < newSmList.length; i++) {
            smListS.push(newSmList[i].smAddress);

            smMappingS[newSmList[i].smAddress] = SMInfo({
                state: SMState.PENDING,
                votePower: newSmList[i].votePower,
                index: uint8(smListS.length) // 1-based
            });
        }
    }

    function deleteSmFromList(SMPartialInfo[] memory deletedSmList) private {
        for (uint256 i = 0; i < deletedSmList.length; i++) {
            address sm = deletedSmList[i].smAddress;

            uint256 idx = smMappingS[sm].index - 1;
            uint256 lastIdx = smListS.length - 1;

            if (idx != lastIdx) {
                address lastSm = smListS[lastIdx];
                smListS[idx] = lastSm;
                // Because max 255 enforced.
                // forge-lint: disable-next-line(unsafe-typecast)
                smMappingS[lastSm].index = uint8(idx + 1);
            }

            smListS.pop();
            delete smMappingS[sm];
        }
    }

    function replaceAllSm(SMPartialInfo[] memory newSmList) private {
        clearSm();

        totalVotePowerS = 0;
        validatedCountS = 0;
        cumulatedVotePowerS = 0;

        for (uint8 i = 0; i < newSmList.length; i++) {
            smListS.push(newSmList[i].smAddress);
            smMappingS[newSmList[i].smAddress] = SMInfo({
                state: SMState.PENDING,
                votePower: newSmList[i].votePower,
                index: i + 1
            });
            totalVotePowerS += newSmList[i].votePower;
        }
    }

    function clearSm() private {
        for (uint8 i = 0; i < smListS.length; i++) {
            delete smMappingS[smListS[i]];
        }
        delete smListS;
    }

    /////////////////////////////////////////////////////////
    /* ========= ASSET MANAGEMENT ========= */

    function deposit() external payable onlyPm interactableAssets {
        if (msg.value == 0) revert Errors.ERR_InvalidDeposit();
    }

    function withdraw(uint256 amount) external onlyPm interactableAssets {
        if (amount == 0) revert Errors.ERR_InvalidWithdrawal();
        if (address(this).balance < amount)
            revert Errors.ERR_InsufficientBalance();

        (bool callSuccess, ) = payable(PM_I).call{value: amount}("");
        if (!callSuccess) revert Errors.ERR_FailedWithdrawal();

        emit EVT_AssetsWithdrawn();
    }

    function withdrawAllPm() private interactableAssets {
        uint256 balance = address(this).balance;
        if (balance == 0) revert Errors.ERR_InsufficientBalance();

        (bool callSuccess, ) = payable(PM_I).call{value: balance}("");
        if (!callSuccess) revert Errors.ERR_FailedWithdrawal();

        emit EVT_AssetsWithdrawnAll();
    }

    function switchAssets() public {
        //TODO : Switch assets to USDC
    }

    /////////////////////////////////////////////////////////
    /* ========= Sm Participation ========= */

    function validateSm() external onlySm willInactive {
        if (smMappingS[msg.sender].state != SMState.PENDING)
            revert Errors.ERR_SMAlreadyValidated(); // already validated

        smMappingS[msg.sender].state = SMState.VALIDATED;
        validatedCountS += 1;
        if (validatedCountS == smListS.length) {
            willStateS = WillState.ACTIVE;
        }
        emit EVT_SMValidated(msg.sender);
    }

    function desistSm(
        address smAddress
    ) external onlySm willNotCanceled willNotExecuted {
        if (smMappingS[smAddress].state == SMState.PENDING)
            revert Errors.ERR_SMNotValidated(); //Needs to be

        SMInfo storage sm = smMappingS[smAddress];
        uint8 idx = sm.index;
        if (idx == 0) return; // not in array

        uint8 lastIdx = uint8(smListS.length);
        address lastSm = smListS[lastIdx - 1];

        // Swap with last element
        smListS[idx - 1] = lastSm;
        smMappingS[lastSm].index = idx;

        // Remove last
        smListS.pop();
        delete smMappingS[smAddress];

        // TODO:  DISTRIBUTE POINTS TO OTHERS.
        if (smListS.length == 0) {
            willStateS = WillState.CANCELED;
            emit EVT_SMDesisted(smAddress);
            emit EVT_WillCanceled();
            return;
        } else {
            totalVotePowerS -= sm.votePower;
        }
        emit EVT_SMDesisted(smAddress);
    }

    /////////////////////////////////////////////////////////
    /* ========= DECLARATION LOGIC ========= */

    function declareDeath() external onlySm willActive notOnCooldown {
        if (smMappingS[msg.sender].state == SMState.DECLARED_DEATH)
            revert Errors.ERR_SMAlreadyDeclaredDeath();

        if (deathDeclarationTimestampS == 0) {
            deathDeclarationTimestampS = block.timestamp;
            emit EVT_DeathDeclared();
        } else {
            emit EVT_DeathConfirmed();
        }
        cumulatedVotePowerS += smMappingS[msg.sender].votePower;
        smMappingS[msg.sender].state = SMState.DECLARED_DEATH;

        //Accelerer la periode de protection.
    }

    function vetoDeath() external onlyPm willActive notOnCooldown {
        cooldownTimeStampS = block.timestamp + C_WILL.COOLDOWN_PERIOD;
        deathDeclarationTimestampS = 0;
        willStateS = WillState.INACTIVE;
        // TODO : Set all SM back to validate.
        // checkAndUpdateState vars.
        emit EVT_VetoExercised();
    }

    /* ========= GETTERS ========= */

    function getSmList() external view returns (address[] memory) {
        return smListS;
    }

    function getCoodldownTimeLeft() external view onCooldown returns (uint256) {
        return block.timestamp - cooldownTimeStampS;
    }

    function getState() external view returns (WillState) {
        return willStateS;
    }

    /* ========= MODIFIERS ========= */
    //////////
    modifier onlyPm() {
        _onlyPm();
        _;
    }

    function _onlyPm() internal view {
        if (msg.sender != PM_I) revert Errors.ERR_NotPM();
    }

    //////////
    modifier onlySm() {
        _onlySm();
        _;
    }

    function _onlySm() internal view {
        if (smMappingS[msg.sender].index == 0) revert Errors.ERR_NotSM();
    }

    //////////
    modifier interactableAssets() {
        _interactableAssets();
        _;
    }

    function _interactableAssets() internal view {
        if (
            willStateS == WillState.CANCELED || willStateS == WillState.EXECUTED
        ) revert Errors.ERR_AssetsNotInteractable();
    }

    //////////
    modifier willCanceled() {
        _willCanceled();
        _;
    }

    function _willCanceled() internal view {
        if (willStateS != WillState.CANCELED)
            revert Errors.ERR_WillNotCanceled();
    }

    //////////
    modifier willNotCanceled() {
        _willNotCanceled();
        _;
    }

    function _willNotCanceled() internal view {
        if (willStateS == WillState.CANCELED) revert Errors.ERR_WillCanceled();
    }

    //////////
    modifier willInactive() {
        _willInactive();
        _;
    }

    function _willInactive() internal view {
        if (willStateS != WillState.INACTIVE)
            revert Errors.ERR_WillNotInactive();
    }

    //////////
    modifier willActive() {
        _willActive();
        _;
    }

    function _willActive() internal view {
        if (willStateS != WillState.ACTIVE) revert Errors.ERR_WillNotActive();
    }

    //////////
    modifier willNotExecuted() {
        _willNotExecuted();
        _;
    }

    function _willNotExecuted() internal view {
        if (willStateS == WillState.EXECUTED) revert Errors.ERR_WillExecuted();
    }

    //////////
    modifier notOnCooldown() {
        _notOnCooldown();
        _;
    }

    function _notOnCooldown() internal view {
        if (cooldownTimeStampS >= block.timestamp)
            revert Errors.ERR_WillOnCooldown();
    }

    //////////
    modifier onCooldown() {
        _onCooldown();
        _;
    }

    function _onCooldown() internal view {
        if (cooldownTimeStampS < block.timestamp)
            revert Errors.ERR_WillNotOnCooldown();
    }

    //////////
    modifier activeDeclaration() {
        _activeDeclaration();
        _;
    }

    function _activeDeclaration() internal view {
        if (validatedCountS == 0) revert Errors.ERR_NoActiveDeclaration();
    }
}
