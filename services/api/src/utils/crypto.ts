import { verifyMessage } from 'ethers';
import { UnauthorizedError } from './errors';

/**
 * Verify that a message was signed by the claimed wallet address
 * @param message - The original message that was signed
 * @param signature - The signature from the wallet
 * @param expectedAddress - The wallet address that should have signed the message
 * @returns true if signature is valid, throws error otherwise
 */
export function verifyWalletSignature(
  message: string,
  signature: string,
  expectedAddress: string
): boolean {
  try {
    const recoveredAddress = verifyMessage(message, signature);

        console.log("BELEK 11 double ici", expectedAddress, recoveredAddress);

    if (recoveredAddress.toLowerCase() !== expectedAddress.toLowerCase()) {
      throw new UnauthorizedError('Signature verification failed: Address mismatch');
    }

    return true;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Invalid signature');
  }
}

/**
 * Validate that the authentication message is recent (within 5 minutes)
 * This prevents replay attacks with old signatures
 */
export function validateMessageTimestamp(message: string): boolean {
  try {
    const timestampMatch = message.match(/Timestamp: (.+?)(\n|$)/);
    
    if (!timestampMatch) {
      throw new UnauthorizedError('Message does not contain a valid timestamp');
    }

    const timestamp = new Date(timestampMatch[1]);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    const timeDiff = now.getTime() - timestamp.getTime();

    if (timeDiff > fiveMinutes) {
      throw new UnauthorizedError('Signature has expired. Please sign in again.');
    }

    if (timeDiff < 0) {
      throw new UnauthorizedError('Invalid timestamp: Message is from the future');
    }

    return true;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Invalid message format');
  }
}

/**
 * Validate wallet address format
 */
export function validateWalletAddress(address: string): boolean {
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  
  if (!addressRegex.test(address)) {
    throw new UnauthorizedError('Invalid wallet address format');
  }

  return true;
}
