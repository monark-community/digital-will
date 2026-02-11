//SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

error ERR_NotPM();
error ERR_NotSM();
error ERR_TooManySMs();
error ERR_NotEnoughSMs();
error ERR_DuplicateSM();
error ERR_EmptySMLists();

error ERR_InvalidSecurityPeriods();
error ERR_SMAlreadyValidated();
error ERR_SMAlreadyDeclaredDeath();
error ERR_SMNotValidated();
error ERR_UpdatedSMDoesNotExist();
error ERR_DeletedSMDoesNotExist();
error ERR_CreatedSMExistsAlready();
error ERR_SMListsFinalResultIncoherent();
error ERR_SMListsFinalResultTooManySM();
error ERR_NoActiveDeclaration();
error ERR_WillCanceled();
error ERR_WillNotInactive();
error ERR_WillNotActive();
error ERR_WillExecuted();
error ERR_AssetsNotInteractable();
error ERR_InvalidDeposit();
error ERR_InvalidWithdrawal();
error ERR_InsufficientBalance();
error ERR_FailedWithdrawal();
error ERR_WillOnCooldown();
error ERR_WillNotOnCooldown();
