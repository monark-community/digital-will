// ─────────────────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adds a 0x prefix to a hex address received from the substream.
 * evtAddress fields arrive as plain hex strings (no prefix).
 */
export function addHexPrefix(hex: string): string {
    return hex.startsWith('0x') ? hex : '0x' + hex;
}

/**
 * Converts a base64-encoded address (smAddress fields) to a 0x hex string.
 */
export function base64ToHex(b64: string): string {
    return '0x' + Buffer.from(b64, 'base64').toString('hex');
}
