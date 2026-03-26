/**
 * Centralized mapping of smart contract error codes to user-friendly messages.
 * Error codes are derived from WillErrors.sol
 */

export interface ContractError {
  code: string;
  name: string;
  message: string;
  category: 'permission' | 'secondary-member' | 'lifecycle' | 'assets' | 'timing';
}

/**
 * Complete mapping of all Will contract errors with their 4-byte selectors
 */
export const WILL_CONTRACT_ERRORS: Record<string, ContractError> = {
  // ========================
  // Role / Permission errors
  // ========================
  '0x37114932': {
    code: '0x37114932',
    name: 'ERR_NotPM',
    message: 'Only the primary member can perform this action.',
    category: 'permission',
  },
  '0x753455fb': {
    code: '0x753455fb',
    name: 'ERR_NotSM',
    message: 'Only secondary members can perform this action.',
    category: 'permission',
  },

  // ========================
  // Secondary Member (SM) errors
  // ========================
  '0x2c3ebdf7': {
    code: '0x2c3ebdf7',
    name: 'ERR_TooManySMs',
    message: 'Too many secondary members. Maximum of 255 secondary members allowed.',
    category: 'secondary-member',
  },
  '0xd3233b0f': {
    code: '0xd3233b0f',
    name: 'ERR_NotEnoughSMs',
    message: 'Not enough secondary members. At least one secondary member is required.',
    category: 'secondary-member',
  },
  '0x8b97bb50': {
    code: '0x8b97bb50',
    name: 'ERR_DuplicateSM',
    message: 'Duplicate secondary member address detected. Each member must have a unique address.',
    category: 'secondary-member',
  },
  '0x76b04149': {
    code: '0x76b04149',
    name: 'ERR_SMAlreadyValidated',
    message: 'This secondary member has already validated the will.',
    category: 'secondary-member',
  },
  '0x3b5f6558': {
    code: '0x3b5f6558',
    name: 'ERR_SMAlreadyDeclaredDeath',
    message: 'This secondary member has already declared death.',
    category: 'secondary-member',
  },
  '0x507ee7d0': {
    code: '0x507ee7d0',
    name: 'ERR_SMDoesNotExist',
    message: 'Secondary member does not exist.',
    category: 'secondary-member',
  },
  '0x0c0e2da8': {
    code: '0x0c0e2da8',
    name: 'ERR_UpdatedSMDoesNotExist',
    message: 'Cannot update: secondary member does not exist.',
    category: 'secondary-member',
  },
  '0x544a0688': {
    code: '0x544a0688',
    name: 'ERR_DeletedSMDoesNotExist',
    message: 'Cannot delete: secondary member does not exist.',
    category: 'secondary-member',
  },
  '0x1a24f67c': {
    code: '0x1a24f67c',
    name: 'ERR_CreatedSMExistsAlready',
    message: 'Cannot create: secondary member already exists.',
    category: 'secondary-member',
  },
  '0xbd1b7294': {
    code: '0xbd1b7294',
    name: 'ERR_SMListsFinalResultIncoherent',
    message: 'The secondary member list changes are incoherent.',
    category: 'secondary-member',
  },
  '0x711f1dc1': {
    code: '0x711f1dc1',
    name: 'ERR_SMListsFinalResultTooManySM',
    message: 'The resulting secondary member list would exceed the maximum allowed.',
    category: 'secondary-member',
  },
  '0xe9594537': {
    code: '0xe9594537',
    name: 'ERR_SMVotePowerInvalid',
    message: 'Invalid voting power. Must be between 1 and 255.',
    category: 'secondary-member',
  },
  '0x9e8f1ac8': {
    code: '0x9e8f1ac8',
    name: 'ERR_PMIsSM',
    message: 'The primary member cannot also be a secondary member.',
    category: 'secondary-member',
  },

  // ========================
  // Will lifecycle errors
  // ========================
  '0x904ce552': {
    code: '0x904ce552',
    name: 'ERR_WillCanceled',
    message: 'This will has been canceled and cannot be modified.',
    category: 'lifecycle',
  },
  '0x16e6b0c6': {
    code: '0x16e6b0c6',
    name: 'ERR_WillNotCanceled',
    message: 'The will must be in canceled state for this operation.',
    category: 'lifecycle',
  },
  '0x92da48c4': {
    code: '0x92da48c4',
    name: 'ERR_WillNotInactive',
    message: 'The will must be inactive for this operation.',
    category: 'lifecycle',
  },
  '0x0f40095d': {
    code: '0x0f40095d',
    name: 'ERR_WillNotActive',
    message: 'The will must be active for this operation.',
    category: 'lifecycle',
  },
  '0xa4f9e909': {
    code: '0xa4f9e909',
    name: 'ERR_WillExecuted',
    message: 'This will has already been executed.',
    category: 'lifecycle',
  },
  '0x46032016': {
    code: '0x46032016',
    name: 'ERR_WillOnCooldown',
    message: 'The will is on cooldown after the primary member vetoed. New declarations are blocked until the cooldown expires.',
    category: 'lifecycle',
  },
  '0xa1b62cab': {
    code: '0xa1b62cab',
    name: 'ERR_WillNotOnCooldown',
    message: 'The will is not on cooldown.',
    category: 'lifecycle',
  },
  '0xc58e90d1': {
    code: '0xc58e90d1',
    name: 'ERR_WillNoDeclaration',
    message: 'No death declaration has been made for this will.',
    category: 'lifecycle',
  },

  // ========================
  // Assets-related errors
  // ========================
  '0xcc930531': {
    code: '0xcc930531',
    name: 'ERR_AssetsNotInteractable',
    message: 'Assets cannot be interacted with in the current will state.',
    category: 'assets',
  },
  '0xfbcf07f8': {
    code: '0xfbcf07f8',
    name: 'ERR_InvalidDeposit',
    message: 'Invalid deposit amount or parameters.',
    category: 'assets',
  },
  '0x19481aa1': {
    code: '0x19481aa1',
    name: 'ERR_InvalidWithdrawal',
    message: 'Invalid withdrawal amount or parameters.',
    category: 'assets',
  },
  '0xcb87e8ef': {
    code: '0xcb87e8ef',
    name: 'ERR_InsufficientBalance',
    message: 'Insufficient balance for this operation.',
    category: 'assets',
  },
  '0xa3a0170f': {
    code: '0xa3a0170f',
    name: 'ERR_FailedWithdrawal',
    message: 'Withdrawal transaction failed.',
    category: 'assets',
  },

  // ========================
  // Security period / Timing errors
  // ========================
  '0xd41db8d9': {
    code: '0xd41db8d9',
    name: 'ERR_InvalidSecurityPeriods',
    message: 'Invalid security period configuration. Minimum period must be less than or equal to maximum period.',
    category: 'timing',
  },
  '0xfdd9826d': {
    code: '0xfdd9826d',
    name: 'ERR_SecurityPeriodNotStarted',
    message: 'The security period has not started yet.',
    category: 'timing',
  },
  '0x15f28e81': {
    code: '0x15f28e81',
    name: 'ERR_SecurityPeriodStarted',
    message: 'The security period has already started.',
    category: 'timing',
  },
  '0xfe8ee237': {
    code: '0xfe8ee237',
    name: 'ERR_SecurityPeriodNotFinished',
    message: 'The security period has not finished yet. Please wait until it expires.',
    category: 'timing',
  },
};

/**
 * Get user-friendly error message from error code
 * @param errorCode - 4-byte error selector (e.g., "0x46032016")
 * @returns User-friendly error message or default message if code not found
 */
export function getContractErrorMessage(errorCode: string): string {
  const normalizedCode = errorCode.toLowerCase();
  const error = WILL_CONTRACT_ERRORS[normalizedCode];
  
  if (error) {
    return error.message;
  }
  
  return 'Transaction failed. Please try again or contact support.';
}

/**
 * Get full error details from error code
 * @param errorCode - 4-byte error selector
 * @returns Contract error object or null if not found
 */
export function getContractError(errorCode: string): ContractError | null {
  const normalizedCode = errorCode.toLowerCase();
  return WILL_CONTRACT_ERRORS[normalizedCode] || null;
}

/**
 * Extract error code from various error formats that ethers.js might return
 * Handles multiple common patterns from MetaMask and ethers.js errors
 */
export function extractErrorCode(error: any): string | null {
  if (!error) return null;

  // Direct error data property
  if (error.data && typeof error.data === 'string' && error.data.startsWith('0x')) {
    const code = error.data.slice(0, 10); // Get first 4 bytes (0x + 8 hex chars)
    if (code.length === 10) return code;
  }

  // Nested error.info.error.data (common with MetaMask)
  if (error.info?.error?.data && typeof error.info.error.data === 'string') {
    const code = error.info.error.data.slice(0, 10);
    if (code.length === 10) return code;
  }

  // Error in message string
  if (error.message && typeof error.message === 'string') {
    const match = error.message.match(/0x[0-9a-fA-F]{8}/);
    if (match) return match[0];
  }

  // Error reason might contain the code
  if (error.reason && typeof error.reason === 'string') {
    const match = error.reason.match(/0x[0-9a-fA-F]{8}/);
    if (match) return match[0];
  }

  return null;
}

/**
 * Check if error is a user rejection (MetaMask cancellation)
 */
export function isUserRejection(error: any): boolean {
  if (!error) return false;

  return (
    error.code === 4001 ||
    error.code === 'ACTION_REJECTED' ||
    error.reason === 'rejected' ||
    error.message?.includes('user rejected') ||
    error.message?.includes('User denied') ||
    error.message?.includes('ethers-user-denied')
  );
}

/**
 * Check if error is an invalid address checksum error
 */
export function isInvalidAddressError(error: any): boolean {
  if (!error) return false;

  return (
    error.code === 'INVALID_ARGUMENT' &&
    (
      error.message?.includes('bad address checksum') ||
      error.message?.includes('invalid address') ||
      error.argument === 'address'
    )
  );
}

/**
 * Check if error is a contract deployment/address issue
 */
export function isContractAddressError(error: any): boolean {
  if (!error) return false;

  // CALL_EXCEPTION with no data typically means contract not deployed or wrong address
  if (error.code === 'CALL_EXCEPTION') {
    const hasNoData = 
      error.data === '0x' || 
      error.transaction?.data === '0x' ||
      error.message?.includes('no data present') ||
      error.message?.includes('require(false)');
    
    if (hasNoData) return true;
  }

  // Other indicators of contract issues
  return (
    error.message?.includes('contract not deployed') ||
    error.message?.includes('execution reverted') && error.data === '0x' ||
    error.code === 'INVALID_ARGUMENT' && error.message?.includes('contract')
  );
}

/**
 * Get appropriate error message for display to user
 * Handles user rejections, known contract errors, and unknown errors
 * 
 * @param error - Error object from transaction or contract call
 * @param fallbackMessage - Optional custom fallback message
 * @returns User-friendly error message
 */
export function getErrorMessage(error: any, fallbackMessage?: string): string {
  // Check for user rejection first
  if (isUserRejection(error)) {
    return 'Transaction cancelled. You rejected the request in MetaMask.';
  }

  // Check for invalid address checksum
  if (isInvalidAddressError(error)) {
    const addressValue = error.value || 'unknown';
    return `Invalid Ethereum address format: "${addressValue}". Please check that the address is correct and properly formatted (addresses are case-sensitive).`;
  }

  // Check for contract deployment/address issues
  if (isContractAddressError(error)) {
    return 'Contract call failed (CALL_EXCEPTION): No data returned. The contract may not be deployed on this network, or the address is incorrect.';
  }

  // Try to extract and decode contract error
  const errorCode = extractErrorCode(error);
  if (errorCode) {
    const contractError = getContractError(errorCode);
    if (contractError) {
      return contractError.message;
    }
  }

  // Fall back to error's own message or custom fallback
  if (error.reason && typeof error.reason === 'string') {
    return error.reason;
  }

  if (error.message && typeof error.message === 'string') {
    return error.message;
  }

  return fallbackMessage || 'Transaction failed. Please try again.';
}

/**
 * Get all errors by category
 */
export function getErrorsByCategory(category: ContractError['category']): ContractError[] {
  return Object.values(WILL_CONTRACT_ERRORS).filter(
    (error) => error.category === category
  );
}

/**
 * Check if an error code is a known contract error
 */
export function isKnownContractError(errorCode: string): boolean {
  const normalizedCode = errorCode.toLowerCase();
  return normalizedCode in WILL_CONTRACT_ERRORS;
}
