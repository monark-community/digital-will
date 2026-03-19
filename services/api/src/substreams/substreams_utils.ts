import { IMessageTypeRegistry } from "@bufbuild/protobuf";
import { createRequest } from "@substreams/core";
import { BlockUndoSignal, ModulesProgress } from "@substreams/core/proto";
import { readPackage } from "@substreams/manifest";
import { BlockEmitter } from "@substreams/node";
import { EventsCalls } from "./interfaces/raw/calls_events_interfaces";
import { updateLastCursorInDB } from "../services/substreamService";
import { Transport } from "@connectrpc/connect";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Inspired by https://www.npmjs.com/package/@substreams/node
export async function stream(
  pkg: Awaited<ReturnType<typeof readPackage>>,
  registry: IMessageTypeRegistry,
  transport: Transport,
  startBlockNum: string,
  outputModule: string,
  onMessage: (message: EventsCalls, chainId: string) => Promise<void>,
  chainId: string,
  cursor?: string,
  onUndo?: (signal: BlockUndoSignal, chainId: string) => Promise<void>,
): Promise<{ cursor: string | undefined }> {
  console.log(
    `in stream function with startBlockNum: ${startBlockNum} and cursor: ${cursor}`,
  );

  const startBlockNumParsed = parseInt(startBlockNum);

  const request = createRequest({
    substreamPackage: pkg,
    outputModule,
    ...(cursor ? { startCursor: cursor } : { startBlockNum: -1 }),
  });

  // NodeJS Events
  const emitter = new BlockEmitter(
    transport as unknown as any,
    request,
    registry,
  );

  // Track latest committed cursor for resumption on reconnect
  let lastCursor: string | undefined = cursor;

  // Stream Blocks — forward each EventsCalls payload to the event service
  emitter.on("anyMessage", async (message, cursor, clock) => {
    console.log("\n==================== RAW MESSAGE ====================");
    console.dir(message, { depth: null, colors: true });
    console.log("=================================================\n");
    try {
      await onMessage(message as unknown as EventsCalls, chainId);
      /*
       * In case the server crashes before the "close" event is emitted,
       * we want to have the last cursor updated in the DB to avoid
       * reprocessing too many blocks when restarting the listener.
       */
      await updateLastCursorInDB(chainId, cursor);
    } catch (error) {
      console.error("[Substreams] Error processing message:", error);
    }
    lastCursor = cursor;
  });

  // Block Undo Signal — fired on chain reorg; data from rolled-back blocks must be reversed
  emitter.on("undo", async (signal: BlockUndoSignal) => {
    console.warn(
      `[Substreams] Reorg detected. Rolling back to cursor: ${signal.lastValidCursor}`,
    );
    lastCursor = signal.lastValidCursor;
    if (onUndo) {
      await onUndo(signal, chainId);
    }
  });

  // Progress — fired each 120 seconds with module processing stats (useful for monitoring sync progress)
  let lastProgressLog = 0;
  emitter.on("progress", (progress: ModulesProgress) => {
    const now = Date.now();
    if (now - lastProgressLog >= 120_000) {
      lastProgressLog = now;
      console.dir(`[Substreams] Progress:`);
      console.dir(progress, { depth: null, colors: true });
    }
  });

  return new Promise<{ cursor: string | undefined }>((resolve, reject) => {
    emitter.on("close", (error) => {
      console.timeEnd("🆗 close");
      if (error) {
        console.error(
          "[Substreams] Stream closed with error: will reject promise with that error",
          error,
        );
        (error as Error & { streamCursor?: string }).streamCursor = lastCursor;
        reject(error);
        return;
      }
      resolve({ cursor: lastCursor });
    });

    // Fatal Error
    emitter.on("fatalError", (error) => {
      console.error(
        "[Substreams] Fatal error occurred:, will reject promise with that error",
        error,
      );
      (error as unknown as Error & { streamCursor?: string }).streamCursor =
        lastCursor;
      reject(error);
    });

    console.log("✅ start");
    console.time("🆗 close");
    emitter.start();
  });
}
