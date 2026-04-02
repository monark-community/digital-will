import { RETRY_DELAYS_MS } from "./constants";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries an async operation with exponential backoff using RETRY_DELAYS_MS.
 * Keeps retrying as long as `shouldRetry(result)` returns true.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  shouldRetry: (result: T) => boolean,
  logTag: string,
): Promise<T> {
  let result = await fn();
  for (let i = 0; shouldRetry(result) && i < RETRY_DELAYS_MS.length; i++) {
    console.warn(
      `${logTag} retrying in ${RETRY_DELAYS_MS[i]}ms (attempt ${i + 1}/${RETRY_DELAYS_MS.length})`,
    );
    await sleep(RETRY_DELAYS_MS[i]);
    result = await fn();
  }
  return result;
}
