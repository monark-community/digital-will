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
    address public immutable PM_I; // Not in storage slot, keep first.

    // Security Period Config. occupies 2 slots bc 2 uint256.
    SecurityPeriodConfig public securityPeriodConfigS;

    // Timestamp storage slots, 1 per variable.
    uint256 public deathDeclarationTimestampS;
    uint256 public executionTimeStampS;
    uint256 public cooldownTimeStampS;

    // 1 storage slot for the following 4 variables.
    WillState public willStateS;
    uint16 public totalVotePowerS;
    uint16 public cumulatedVotePowerS;
    uint8 private validatedCountS;

    // Dynamic storage slots
    address[] private smListS;
    mapping(address smAddress => SMInfo smInfo) private smMappingS;

    /* ========= CONSTRUCTOR ========= */
    constructor(
        address pmAddress,
        SMPartialInfo[] memory newSmList,
        SecurityPeriodConfig memory securityPeriodConfig
    ) payable {
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
        SMPartialInfo[] calldata newSmList,
        SecurityPeriodConfig calldata securityPeriodConfig
    ) external payable onlyPm willCanceled {
        createWillInternal(newSmList, securityPeriodConfig);
    }

    function createWillInternal(
        SMPartialInfo[] memory newSmList,
        SecurityPeriodConfig memory securityPeriodConfig
    ) private {
        if (newSmList.length < 2) revert Errors.ERR_NotEnoughSMs();
        if (newSmList.length > 255) revert Errors.ERR_TooManySMs();
        if (
            securityPeriodConfig.minSecurityPeriod == 0 &&
            securityPeriodConfig.maxSecurityPeriod == 0
        ) {
            revert Errors.ERR_InvalidSecurityPeriods();
        }

        _validateSecurityPeriod(securityPeriodConfig);
        _checkNoSmDuplicates(newSmList);
        // Validate vote power > 0 for each.
        for (uint256 i = 0; i < newSmList.length; i++) {
            if (newSmList[i].votePower == 0) {
                revert Errors.ERR_SMVotePowerInvalid();
            }
        }

        initializeWill(securityPeriodConfig);
        replaceAllSm(newSmList);
    }

    function cancelWill()
        external
        onlyPm
        willNotExecuted
        willNotCanceled
        executionTimeNotPassed
    {
        willStateS = WillState.CANCELED;
        withdrawAllPm();
        emit EVT_WillCanceled();
    }

    function initializeWill(
        SecurityPeriodConfig memory securityPeriodConfig
    ) private {
        willStateS = WillState.INACTIVE;
        securityPeriodConfigS = securityPeriodConfig;
        totalVotePowerS = 0;
        cumulatedVotePowerS = 0;
        validatedCountS = 0;
        deathDeclarationTimestampS = 0;
        executionTimeStampS = 0;
        cooldownTimeStampS = 0;
    }

    function updateWill(
        SMPartialInfo[] calldata updatedSmList,
        SMPartialInfo[] calldata addedSmList,
        address[] calldata deletedSmList,
        SecurityPeriodConfig calldata securityPeriodConfig
    )
        external
        onlyPm
        willNotCanceled
        willNotExecuted
        executionTimeNotPassed
        securityPeriodNotStarted
    {
        _validateSecurityPeriod(securityPeriodConfig);
        _validateSmUpdate(updatedSmList, addedSmList, deletedSmList);

        // Case where security period is to be updated.
        if (securityPeriodConfig.maxSecurityPeriod != 0) {
            securityPeriodConfigS = securityPeriodConfig;
            emit EVT_SecurityPeriodUpdated(
                securityPeriodConfig.minSecurityPeriod,
                securityPeriodConfig.maxSecurityPeriod
            );
        }
        updateSmList(updatedSmList, addedSmList, deletedSmList);

        checkAndUpdateWillState();
    }

    function _validateSecurityPeriod(
        SecurityPeriodConfig memory securityPeriodConfig
    ) private pure {
        if (
            securityPeriodConfig.minSecurityPeriod >
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
            if (cumulatedVotePowerS > 0) {
                updatePeriodUntilExecution();
            } else {
                //TODO: Ask if when the last person who declared leaves
                // executionTimeStampS = 0; //This covers for when all who declared have now left.
                // deathDeclarationTimeStampS = 0;
            }
        }
    }

    function updatePeriodUntilExecution() private {
        uint256 newExecutionTimestamp = ((securityPeriodConfigS
            .maxSecurityPeriod - securityPeriodConfigS.minSecurityPeriod) *
            (uint256(totalVotePowerS) - uint256(cumulatedVotePowerS))) /
            uint256(totalVotePowerS) +
            deathDeclarationTimestampS +
            securityPeriodConfigS.minSecurityPeriod;

        if (
            newExecutionTimestamp < executionTimeStampS ||
            executionTimeStampS == 0
        ) {
            executionTimeStampS = newExecutionTimestamp;
        }
    }

    /////////////////////////////////////////////////////////
    /* ========= Secondary Member Management ========= */
    function updateSmList(
        SMPartialInfo[] memory updatedSmList,
        SMPartialInfo[] memory addedSmList,
        address[] memory deletedSmList
    ) private {
        updateExistentSmList(updatedSmList);
        addNewSmList(addedSmList);
        deleteSmFromList(deletedSmList);
    }

    function _validateSmUpdate(
        SMPartialInfo[] memory updatedSmList,
        SMPartialInfo[] memory addedSmList,
        address[] memory deletedSmList
    ) private view {
        // All arrays can be empty. It is the case where PM only updates securityPeriodConfig
        // Given order of updates, this is how we do it because the uint8 will overflow.
        if (updatedSmList.length + addedSmList.length > 255)
            revert Errors.ERR_SMListsFinalResultTooManySM();
        // Prevent underflow explicitly, or 1 SM left.
        if (deletedSmList.length + 1 >= smListS.length + addedSmList.length) {
            revert Errors.ERR_SMListsFinalResultIncoherent();
        }

        // No duplicates/overlap in the lists.
        _checkNoSmDuplicates(updatedSmList, addedSmList, deletedSmList);

        // Updated SMs must exist + valid power
        for (uint256 i = 0; i < updatedSmList.length; i++) {
            if (smMappingS[updatedSmList[i].smAddress].index == 0) {
                revert Errors.ERR_UpdatedSMDoesNotExist();
            }
            if (updatedSmList[i].votePower == 0) {
                revert Errors.ERR_SMVotePowerInvalid();
            }
        }

        // Deleted SMs must exist
        for (uint256 i = 0; i < deletedSmList.length; i++) {
            if (smMappingS[deletedSmList[i]].index == 0) {
                revert Errors.ERR_DeletedSMDoesNotExist();
            }
        }

        // New SMs must not exist + valid power
        for (uint256 i = 0; i < addedSmList.length; i++) {
            if (smMappingS[addedSmList[i].smAddress].index != 0) {
                revert Errors.ERR_CreatedSMExistsAlready();
            }
            if (updatedSmList[i].votePower == 0) {
                revert Errors.ERR_SMVotePowerInvalid();
            }
        }
    }

    function _checkNoSmDuplicates(SMPartialInfo[] memory a) private pure {
        for (uint256 i = 0; i < a.length; i++) {
            for (uint256 j = i + 1; j < a.length; j++) {
                if (a[i].smAddress == a[j].smAddress)
                    revert Errors.ERR_DuplicateSM();
            }
        }
    }

    function _checkNoSmDuplicates(address[] memory a) private pure {
        for (uint256 i = 0; i < a.length; i++) {
            for (uint256 j = i + 1; j < a.length; j++) {
                if (a[i] == a[j]) revert Errors.ERR_DuplicateSM();
            }
        }
    }

    function _checkNoSmDuplicates(
        SMPartialInfo[] memory a,
        SMPartialInfo[] memory b,
        address[] memory c
    ) private pure {
        _checkNoSmDuplicates(a);
        _checkNoSmDuplicates(b);
        _checkNoSmDuplicates(c);

        for (uint256 i = 0; i < a.length; i++) {
            for (uint256 j = 0; j < b.length; j++) {
                if (a[i].smAddress == b[j].smAddress)
                    revert Errors.ERR_DuplicateSM();
            }
            for (uint256 j = 0; j < c.length; j++) {
                if (a[i].smAddress == c[j]) revert Errors.ERR_DuplicateSM();
            }
        }

        for (uint256 i = 0; i < b.length; i++) {
            for (uint256 j = 0; j < c.length; j++) {
                if (b[i].smAddress == c[j]) revert Errors.ERR_DuplicateSM();
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
            emit EVT_SMUpdated(
                updatedSmList[i].smAddress,
                updatedSmList[i].votePower
            );
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

            emit EVT_SMAdded(newSmList[i].smAddress, newSmList[i].votePower);
        }
    }

    function deleteSmFromList(address[] memory deletedSmList) private {
        for (uint256 i = 0; i < deletedSmList.length; i++) {
            uint256 idx = smMappingS[deletedSmList[i]].index - 1;
            uint256 lastIdx = smListS.length - 1;

            if (idx != lastIdx) {
                address lastSm = smListS[lastIdx];
                smListS[idx] = lastSm;
                // Because max 255 enforced.
                // forge-lint: disable-next-line(unsafe-typecast)
                smMappingS[lastSm].index = uint8(idx + 1);
            }

            smListS.pop();
            delete smMappingS[deletedSmList[i]];

            emit EVT_SMRemoved(deletedSmList[i]);
        }
    }

    function replaceAllSm(SMPartialInfo[] memory newSmList) private {
        clearSm();

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

    function deposit()
        external
        payable
        onlyPm
        interactableAssets
        executionTimeNotPassed
    {
        if (msg.value == 0) revert Errors.ERR_InvalidDeposit();
        emit EVT_AssetsDeposited(msg.value);
    }

    function withdraw(
        uint256 amount
    ) external onlyPm interactableAssets executionTimeNotPassed {
        if (amount == 0) revert Errors.ERR_InvalidWithdrawal();
        if (address(this).balance < amount)
            revert Errors.ERR_InsufficientBalance();

        (bool callSuccess, ) = payable(PM_I).call{value: amount}("");
        if (!callSuccess) revert Errors.ERR_FailedWithdrawal();

        emit EVT_AssetsWithdrawn(amount);
    }

    function withdrawAllPm() private {
        uint256 balance = address(this).balance;
        if (balance != 0) {
            (bool callSuccess, ) = payable(PM_I).call{value: balance}("");
            if (!callSuccess) revert Errors.ERR_FailedWithdrawal();
            emit EVT_AssetsWithdrawnAll();
        }
    }

    function swapAssets()
        external
        onlySm
        willActive
        securityPeriodStarted
        securityPeriodFinished
    {
        //TODO : Switch assets to USDC
        willStateS = WillState.EXECUTED;
        emit EVT_AssetsSwapped(msg.sender);
    }

    /////////////////////////////////////////////////////////
    /* ========= Sm Participation ========= */

    function validateSm() external onlySm willInactive {
        if (smMappingS[msg.sender].state != SMState.PENDING)
            revert Errors.ERR_SMAlreadyValidated(); // already validated

        smMappingS[msg.sender].state = SMState.VALIDATED;
        validatedCountS += 1;
        emit EVT_SMValidated(msg.sender);
        if (validatedCountS == smListS.length) {
            willStateS = WillState.ACTIVE;
            emit EVT_WillActivated();
        }
    }

    function desistSm()
        external
        onlySm
        willNotCanceled
        willNotExecuted
        executionTimeNotPassed
    {
        if (smMappingS[msg.sender].state == SMState.PENDING)
            revert Errors.ERR_SMNotValidated(); // can't desist if didn't give approval previously.

        // Remove from datasources
        SMInfo storage sm = smMappingS[msg.sender];

        uint8 idx = sm.index;

        uint8 lastIdx = uint8(smListS.length);
        address lastSm = smListS[lastIdx - 1];

        // Swap with last element
        smListS[idx - 1] = lastSm;
        smMappingS[lastSm].index = idx;

        // Remove last
        smListS.pop();
        delete smMappingS[msg.sender];

        if (smListS.length == 0) {
            willStateS = WillState.CANCELED;
            withdrawAllPm();
            emit EVT_SMDesisted(msg.sender);
            emit EVT_WillCanceled();
            return;
        } else {
            // This updates the vote power too. It is assumed that substracting desisted points from total preserves the same proportions allst whilst adding points to everyone.
            // In case they ask to distribute points explicitly, change here. TODO
            checkAndUpdateWillState();
        }
        emit EVT_SMDesisted(msg.sender);
    }

    /////////////////////////////////////////////////////////
    /* ========= DECLARATION LOGIC ========= */

    function declareDeath()
        external
        onlySm
        willActive
        notOnCooldown
        executionTimeNotPassed
    {
        if (smMappingS[msg.sender].state == SMState.DECLARED_DEATH)
            revert Errors.ERR_SMAlreadyDeclaredDeath();

        if (deathDeclarationTimestampS == 0) {
            deathDeclarationTimestampS = block.timestamp;
            emit EVT_DeathDeclared(msg.sender);
        } else {
            emit EVT_DeathConfirmed(msg.sender);
        }

        cumulatedVotePowerS += smMappingS[msg.sender].votePower;
        smMappingS[msg.sender].state = SMState.DECLARED_DEATH;

        updatePeriodUntilExecution();
    }

    function vetoDeath()
        external
        onlyPm
        willActive
        notOnCooldown
        executionTimeNotPassed
    {
        if (cumulatedVotePowerS == 0) revert Errors.ERR_WillNoDeclaration();

        cooldownTimeStampS = block.timestamp + C_WILL.COOLDOWN_PERIOD;
        deathDeclarationTimestampS = 0;
        executionTimeStampS = 0;

        resetDeclareSmListState();
        checkAndUpdateWillState();

        //Starts cooldown by itself through conditions.

        emit EVT_VetoExercised();
    }

    function resetDeclareSmListState() private {
        for (uint8 i = 0; i < smListS.length; i++) {
            if (smMappingS[smListS[i]].state == SMState.DECLARED_DEATH)
                smMappingS[smListS[i]].state = SMState.VALIDATED;
        }
    }

    /* ========= GETTERS ========= */

    function getSmList() external view returns (address[] memory) {
        return smListS;
    }

    function getDetailedSm(address sm) external view returns (SMInfo memory) {
        if (smMappingS[sm].index == 0) {
            revert Errors.ERR_SMDoesNotExist();
        }
        return smMappingS[sm];
    }

    function getSecurityPeriodConfig()
        external
        view
        returns (SecurityPeriodConfig memory)
    {
        return securityPeriodConfigS;
    }

    function getCoodldownEndTimestamp()
        external
        view
        onCooldown
        returns (uint256)
    {
        if (block.timestamp >= cooldownTimeStampS) {
            return 0; // cooldown expired
        } else {
            return cooldownTimeStampS;
        }
    }

    function getState() external view returns (WillState) {
        return willStateS;
    }

    function getExecutionPossibleTimestamp()
        external
        view
        willActive
        securityPeriodStarted
        returns (uint256)
    {
        return executionTimeStampS;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    /* ========= MODIFIERS ========= */
    //////////
    modifier onlyPm() {
        _onlyPm();
        _;
    }

    function _onlyPm() private view {
        if (msg.sender != PM_I) revert Errors.ERR_NotPM();
    }

    //////////
    modifier onlySm() {
        _onlySm();
        _;
    }

    function _onlySm() private view {
        if (smMappingS[msg.sender].index == 0) revert Errors.ERR_NotSM();
    }

    //////////
    modifier interactableAssets() {
        _interactableAssets();
        _;
    }

    function _interactableAssets() private view {
        if (
            willStateS == WillState.CANCELED || willStateS == WillState.EXECUTED
        ) revert Errors.ERR_AssetsNotInteractable();
    }

    //////////
    modifier willCanceled() {
        _willCanceled();
        _;
    }

    function _willCanceled() private view {
        if (willStateS != WillState.CANCELED)
            revert Errors.ERR_WillNotCanceled();
    }

    //////////
    modifier willNotCanceled() {
        _willNotCanceled();
        _;
    }

    function _willNotCanceled() private view {
        if (willStateS == WillState.CANCELED) revert Errors.ERR_WillCanceled();
    }

    //////////
    modifier willInactive() {
        _willInactive();
        _;
    }

    function _willInactive() private view {
        if (willStateS != WillState.INACTIVE)
            revert Errors.ERR_WillNotInactive();
    }

    //////////
    modifier willActive() {
        _willActive();
        _;
    }

    function _willActive() private view {
        if (willStateS != WillState.ACTIVE) revert Errors.ERR_WillNotActive();
    }

    //////////
    modifier willNotExecuted() {
        _willNotExecuted();
        _;
    }

    function _willNotExecuted() private view {
        if (willStateS == WillState.EXECUTED) revert Errors.ERR_WillExecuted();
    }

    //////////
    modifier executionTimeNotPassed() {
        _executionTimeNotPassed();
        _;
    }

    function _executionTimeNotPassed() private view {
        if (block.timestamp > executionTimeStampS && executionTimeStampS != 0)
            revert Errors.ERR_WillExecuted();
    }

    //////////
    modifier notOnCooldown() {
        _notOnCooldown();
        _;
    }

    function _notOnCooldown() private view {
        if (cooldownTimeStampS >= block.timestamp)
            revert Errors.ERR_WillOnCooldown();
    }

    //////////
    modifier onCooldown() {
        _onCooldown();
        _;
    }

    function _onCooldown() private view {
        if (cooldownTimeStampS < block.timestamp)
            revert Errors.ERR_WillNotOnCooldown();
    }

    modifier securityPeriodStarted() {
        _securityPeriodStarted();
        _;
    }

    function _securityPeriodStarted() private view {
        if (deathDeclarationTimestampS == 0)
            revert Errors.ERR_SecurityPeriodNotStarted();
    }

    modifier securityPeriodNotStarted() {
        _securityPeriodNotStarted();
        _;
    }

    function _securityPeriodNotStarted() private view {
        if (deathDeclarationTimestampS != 0)
            revert Errors.ERR_SecurityPeriodStarted();
    }

    modifier securityPeriodFinished() {
        _securityPeriodFinished();
        _;
    }

    function _securityPeriodFinished() private view {
        if (executionTimeStampS > block.timestamp)
            revert Errors.ERR_SecurityPeriodNotFinished();
    }
}
