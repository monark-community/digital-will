import prisma from "../lib/prisma";

/**
 * Ensures a WillFactory row exists for the given chainId.
 * If it doesn't exist yet, creates it with an empty cursor so the
 * listener can start fresh from blockDeployed.
 * If it already exists, returns the last processed cursor and last processed block so the listener can resume from there.
 */
export async function ensureWillFactoryExists(
  chainId: string,
  contractAddressInBlockchain: string,
  blockDeployed: string,
): Promise<{ cursor: string | undefined; lastProcessedBlock: number | undefined }> {
  const chainId_parsed = parseInt(chainId);
  const blockDeployed_parsed = parseInt(blockDeployed);

  const existing = await prisma.willFactory.findFirst({
    where: { chainId: chainId_parsed, contractAddressInBlockchain },
  });

  if (existing) {
    console.log(`[SubstreamsDB] WillFactory entry already exists for chainId ${chainId}.
            returning existing cursor: ${existing.lastProcessedCursor ? existing.lastProcessedCursor : "undefined"}
            lastProcessedBlock is: ${existing.lastProcessedBlock ? existing.lastProcessedBlock : "undefined"}
            `);
    return {
      cursor: existing.lastProcessedCursor || undefined,
      lastProcessedBlock: existing.lastProcessedBlock || undefined,
    };
  }

  await prisma.willFactory.upsert({
    where: { chainId: chainId_parsed },
    update: {
      contractAddressInBlockchain,
      blockDeployed: blockDeployed_parsed,
      lastProcessedBlock: null,
      lastProcessedCursor: null,
    },
    create: {
      contractAddressInBlockchain,
      chainId: chainId_parsed,
      blockDeployed: blockDeployed_parsed,
      lastProcessedBlock: null,
      lastProcessedCursor: null,
    },
  });

  console.log(
    `[SubstreamsDB] Upserted WillFactory entry for chainId ${chainId} at ${contractAddressInBlockchain}.`,
  );
  return {
    cursor: undefined,
    lastProcessedBlock: undefined,
  };
}

/**
 * Updates the lastProcessedCursor for the given chainId.
 * Does nothing if no WillFactory entry exists for that chain.
 */
export async function updateLastCursorInDB(
  chainId: string,
  cursor: string,
  blockNumber?: number,
): Promise<void> {
  const willFactory = await prisma.willFactory.findUnique({
    where: { chainId: parseInt(chainId) },
  });
  if (!willFactory) {
    console.warn(
      `[SubstreamsDB] No WillFactory entry found in DB for chainId ${chainId} — cannot persist cursor ${cursor}.`,
    );
    return;
  }
  await prisma.willFactory.update({
    where: { chainId: parseInt(chainId) },
    data: { lastProcessedCursor: cursor, lastProcessedBlock: blockNumber ?? null },
  });
  console.log(
    `[SubstreamsDB] Cursor persisted for chainId ${chainId}: ${cursor} and last processed block: ${blockNumber}`,
  );
}
