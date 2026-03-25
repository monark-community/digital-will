/**
 * Server-side validation utilities for wills
 */

import { isValidEthereumAddress } from "./blockchain";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface WillMember {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  walletAddress?: string | null;
  tempWalletAddress?: string | null;
  votingPower: number;
}

/**
 * Validate a will for deployment readiness
 */
export function validateForDeployment(will: {
  secondaryMembers: WillMember[];
  minSecurityPeriod: number;
  maxSecurityPeriod: number;
}): ValidationResult {
  const errors: string[] = [];

  // 1. Check minimum 2 members
  if (will.secondaryMembers.length < 2) {
    errors.push("At least 2 secondary members are required for deployment");
  }

  // 2. Validate each member
  for (let i = 0; i < will.secondaryMembers.length; i++) {
    const member = will.secondaryMembers[i];
    const address = member.walletAddress || member.tempWalletAddress;

    if (!address) {
      errors.push(
        `Member ${i + 1} (${member.firstName} ${member.lastName}) has no wallet address`,
      );
    } else if (!isValidEthereumAddress(address)) {
      errors.push(
        `Member ${i + 1} (${member.firstName} ${member.lastName}) has invalid wallet address format`,
      );
    }

    // 3. Validate voting power (1-255)
    if (member.votingPower < 1 || member.votingPower > 255) {
      errors.push(
        `Member ${i + 1} (${member.firstName} ${member.lastName}) has invalid voting power (must be 1-255)`,
      );
    }
  }

  // 4. Check for unique addresses
  const addresses = will.secondaryMembers
    .map((m) => (m.walletAddress || m.tempWalletAddress)?.toLowerCase())
    .filter(Boolean);
  const uniqueAddresses = new Set(addresses);
  if (addresses.length !== uniqueAddresses.size) {
    errors.push("Duplicate member addresses are not allowed");
  }

  // 5. Validate security periods (received in seconds from frontend)
  const isLocalOrDev = process.env.NODE_ENV !== "production";
  const minLimitSeconds = isLocalOrDev ? 1 * 60 : 28 * 86400; // 1 min or 28 days
  const maxLimitSeconds = isLocalOrDev ? 10000 * 60 : 154 * 86400; // 10000 min or 154 days

  if (
    will.minSecurityPeriod < minLimitSeconds ||
    will.maxSecurityPeriod < minLimitSeconds
  ) {
    const minLabel = isLocalOrDev ? "1 minute" : "28 days";
    errors.push(`Security periods must be at least ${minLabel}`);
  }
  if (
    will.minSecurityPeriod > maxLimitSeconds ||
    will.maxSecurityPeriod > maxLimitSeconds
  ) {
    const maxLabel = isLocalOrDev ? "10000 minutes" : "154 days";
    errors.push(`Security periods cannot exceed ${maxLabel}`);
  }
  if (will.minSecurityPeriod > will.maxSecurityPeriod) {
    errors.push("Minimum security period cannot be greater than maximum");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate draft will form data
 */
export function validateDraftForm(data: {
  willName: string;
  secondaryMembers: Array<Partial<WillMember>>;
  minSecurityPeriod?: number;
  maxSecurityPeriod?: number;
}): ValidationResult {
  const errors: string[] = [];

  // Will name validation
  if (!data.willName.trim()) {
    errors.push("Will name is required");
  } else if (data.willName.length > 100) {
    errors.push("Will name must be less than 100 characters");
  }

  // Filter members with any data
  const membersWithData = data.secondaryMembers.filter(
    (m) =>
      m.firstName ||
      m.lastName ||
      m.email ||
      m.walletAddress ||
      m.tempWalletAddress,
  );

  // Validate each member with data
  for (let i = 0; i < data.secondaryMembers.length; i++) {
    const member = data.secondaryMembers[i];
    const hasAnyField =
      member.firstName ||
      member.lastName ||
      member.email ||
      member.walletAddress ||
      member.tempWalletAddress ||
      member.phoneNumber;

    if (hasAnyField) {
      // If any field is filled, require essential fields
      if (!member.firstName?.trim()) {
        errors.push(`Member ${i + 1}: First name is required`);
      }

      if (!member.lastName?.trim()) {
        errors.push(`Member ${i + 1}: Last name is required`);
      }

      if (!member.email?.trim()) {
        errors.push(`Member ${i + 1}: Email is required`);
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(member.email)) {
          errors.push(`Member ${i + 1}: Invalid email format`);
        }
      }

      if (member.phoneNumber && member.phoneNumber.trim()) {
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(member.phoneNumber)) {
          errors.push(`Member ${i + 1}: Phone number must be 10 digits`);
        }
      }

      const address = member.walletAddress || member.tempWalletAddress;
      if (!address?.trim()) {
        errors.push(`Member ${i + 1}: Wallet address is required`);
      } else if (!isValidEthereumAddress(address)) {
        errors.push(`Member ${i + 1}: Invalid wallet address format`);
      }

      if (
        member.votingPower !== undefined &&
        (member.votingPower < 1 || member.votingPower > 255)
      ) {
        errors.push(`Member ${i + 1}: Power must be between 1 and 255`);
      }
    }
  }

  // Validate periods if provided
  if (data.minSecurityPeriod !== undefined) {
    if (isNaN(data.minSecurityPeriod) || data.minSecurityPeriod < 28) {
      errors.push("Minimum security period must be at least 28 days");
    }
  }

  if (data.maxSecurityPeriod !== undefined) {
    if (isNaN(data.maxSecurityPeriod) || data.maxSecurityPeriod > 154) {
      errors.push("Maximum security period cannot exceed 154 days");
    }
  }

  if (
    data.minSecurityPeriod !== undefined &&
    data.maxSecurityPeriod !== undefined
  ) {
    if (data.minSecurityPeriod > data.maxSecurityPeriod) {
      errors.push("Minimum security period cannot be greater than maximum");
    }
  }

  // Check for duplicate addresses
  const addresses = membersWithData
    .map((m) => (m.walletAddress || m.tempWalletAddress)?.toLowerCase())
    .filter(Boolean);
  const uniqueAddresses = new Set(addresses);
  if (addresses.length !== uniqueAddresses.size) {
    errors.push("Duplicate secondary member addresses are not allowed");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
