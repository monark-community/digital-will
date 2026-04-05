import { IMessageTypeRegistry } from "@bufbuild/protobuf";
import { createRequest } from "@substreams/core";
import { readPackage } from "@substreams/manifest";
import { BlockEmitter } from "@substreams/node";
import { EventsCalls } from "./interfaces/raw/calls_events_interfaces";
import { updateLastCursorInDB } from "../services/substreamService";
import { Transport } from "@connectrpc/connect";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an EventsCalls message contains any actual data
 */
function hasEventOrCallData(message: EventsCalls): boolean {
  return (
    Object.keys(message.events ?? {}).length > 0 ||
    Object.keys(message.calls ?? {}).length > 0
  );
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
): Promise<{ cursor: string | undefined }> {
  console.log(
    `in stream function with startBlockNum: ${startBlockNum} and cursor: ${cursor}`,
  );

  const startBlockNumParsed = parseInt(startBlockNum); // will be used for startBlockNum when we will deploy the server

  const request = createRequest({
    substreamPackage: pkg,
    outputModule,
    ...(cursor ? { startCursor: cursor } : { startBlockNum: -1 }),
  });

  // NodeJS Events
  const emitter = new BlockEmitter(
    transport as any,
    request as any,
    registry as any,
  );

  // Track latest committed cursor for resumption on reconnect
  let lastCursor: string | undefined = cursor;

  // Stream Blocks — forward each EventsCalls payload to the event service
  emitter.on("anyMessage", async (message, cursor, clock) => {
    const eventsCallsMessage = message as unknown as EventsCalls;
    if (hasEventOrCallData(eventsCallsMessage)) {
      console.log("\n==================== RAW MESSAGE ====================");
      console.dir(eventsCallsMessage, { depth: null, colors: true });
      console.log("=================================================\n");
      try {
        await onMessage(eventsCallsMessage, chainId);
        /*
         * In case the server crashes before the "close" event is emitted,
         * we want to have the last cursor updated in the DB to avoid
         * reprocessing too many blocks when restarting the listener.
         */
        await updateLastCursorInDB(chainId, cursor);
      } catch (error) {
        console.error("[Substreams] Error processing message:", error);
      }
    }
    lastCursor = cursor;
  });

  // Progress — fired each 5 mins with module processing stats (useful for monitoring sync progress)
  // let lastProgressLog = 0;
  // emitter.on("progress", (progress: any) => {
  //   const now = Date.now();
  //   if (now - lastProgressLog >= 300_000) {
  //     lastProgressLog = now;
  //     console.dir(`[Substreams] Progress:`);
  //     console.dir(progress, { depth: null, colors: true });
  //   }
  // });

  return new Promise<{ cursor: string | undefined }>((resolve, reject) => {
    (emitter as any).on("close", (error: any) => {
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
    (emitter as any).on("fatalError", (error: any) => {
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
