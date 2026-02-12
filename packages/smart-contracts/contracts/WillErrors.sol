//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

// SIGNATURE GIVEN ADJACENT TO THE ERROR FOR DEBUGGING.

// ========================
// Role / Permission errors
error ERR_NotPM(); // 0x37114932 | Caller is not the primary member
error ERR_NotSM(); // 0x753455fb | Caller is not a secondary member

// ========================
// Secondary Member (SM) errors
error ERR_TooManySMs(); // 0x2c3ebdf7
error ERR_NotEnoughSMs(); // 0xd3233b0f
error ERR_DuplicateSM(); // 0x8b97bb50
error ERR_EmptySMLists(); // 0x139ce78f
error ERR_SMAlreadyValidated(); // 0x76b04149
error ERR_SMAlreadyDeclaredDeath(); // 0x3b5f6558
error ERR_SMNotValidated(); // 0x622bb4a8
error ERR_UpdatedSMDoesNotExist(); // 0x0c0e2da8
error ERR_DeletedSMDoesNotExist(); // 0x544a0688
error ERR_CreatedSMExistsAlready(); // 0x1a24f67c
error ERR_SMListsFinalResultIncoherent(); // 0xbd1b7294
error ERR_SMListsFinalResultTooManySM(); // 0x711f1dc1

// ========================
// Will lifecycle errors
error ERR_WillCanceled(); // 0x904ce552
error ERR_WillNotCanceled(); // 0x16e6b0c6
error ERR_WillNotInactive(); // 0x92da48c4
error ERR_WillNotActive(); // 0x0f40095d
error ERR_WillExecuted(); // 0xa4f9e909
error ERR_WillOnCooldown(); // 0x46032016
error ERR_WillNotOnCooldown(); // 0xa1b62cab
error ERR_WillNoDeclaration(); // 0xc58e90d1

// ========================
// Assets-related errors
error ERR_AssetsNotInteractable(); // 0xcc930531
error ERR_InvalidDeposit(); // 0xfbcf07f8
error ERR_InvalidWithdrawal(); // 0x19481aa1
error ERR_InsufficientBalance(); // 0xcb87e8ef
error ERR_FailedWithdrawal(); // 0xa3a0170f

// ========================
// Security period / Timing errors
error ERR_InvalidSecurityPeriods(); // 0xd41db8d9
error ERR_SecurityPeriodNotStarted(); // 0xfdd9826d
error ERR_SecurityPeriodNotFinished(); // 0xfe8ee237
