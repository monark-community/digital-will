/*
inspired by https://www.npmjs.com/package/@substreams/node
*/
import dotenv from "dotenv";
import path from "path";
import { createRegistry } from "@substreams/core";
import { BlockUndoSignal } from "@substreams/core/proto";
import { readPackage } from "@substreams/manifest";
import { sleep, stream } from "./substreams_utils";
import { eventsCallsDispatcher } from "./substreams_dispatcher";
import { isErrorRetryable } from "./errors";
import {
  ensureWillFactoryExists,
  updateLastCursorInDB,
} from "../services/substreamService";
import { Interceptor } from "@connectrpc/connect";
import { createGrpcTransport } from "@connectrpc/connect-node";

// Load .env from this folder
dotenv.config({ path: path.resolve(__dirname, ".env") });

const SUBSTREAM = process.env.MANIFEST;
const OUTPUT_MODULE = process.env.SUBSTREAMS_MODULE;
const SUBSTREAMS_URL = process.env.SUBSTREAMS_URL;
const API_KEY = process.env.SUBSTREAMS_API_KEY;
const CHAIN_ID = process.env.CHAIN_ID;
const WILL_FACTORY_ADDRESS = process.env.WILL_FACTORY_ADDRESS;
const BLOCK_DEPLOYED = process.env.BLOCK_DEPLOYED;

export async function startSubstreamsListener(): Promise<void> {
  if (
    !SUBSTREAM ||
    !OUTPUT_MODULE ||
    !SUBSTREAMS_URL ||
    !API_KEY ||
    !CHAIN_ID ||
    !WILL_FACTORY_ADDRESS ||
    !BLOCK_DEPLOYED
  ) {
    throw new Error(
      `Missing one or many of the required Substreams configuration:
                MANIFEST,
                SUBSTREAMS_MODULE,
                SUBSTREAMS_URL,
                SUBSTREAMS_API_KEY,
                CHAIN_ID,
                WILL_FACTORY_ADDRESS,
                BLOCK_DEPLOYED`,
    );
  }

  const dbCursor = await ensureWillFactoryExists(
    CHAIN_ID,
    WILL_FACTORY_ADDRESS,
    BLOCK_DEPLOYED,
  );

  const substreamPackage = await readPackage(SUBSTREAM);
  if (!substreamPackage.modules) {
    throw new Error("No modules found in substream package");
  }

  // Connect Transport
  const headers = new Headers({
    "X-User-Agent": "@substreams/node",
    "X-Api-Key": API_KEY,
  });
  const registry = createRegistry(substreamPackage);

  const apiKeyInterceptor: Interceptor = (next) => async (req) => {
    req.header.set("X-Api-Key", API_KEY);
    req.header.set("X-User-Agent", "@substreams/node");
    return next(req);
  };

  const transport = createGrpcTransport({
    baseUrl: SUBSTREAMS_URL,
    httpVersion: "2",
    interceptors: [apiKeyInterceptor],
  });

  /**
   * Called when a blockUndoSignal is received (chain reorg).
   * signal.lastValidCursor marks the last block that is still valid — any
   * data written to the DB for blocks *after* that point must be rolled back.
   * TODO: implement DB rollback logic
   */
  async function onUndo(
    signal: BlockUndoSignal,
    chainId: string,
  ): Promise<void> {
    console.warn(
      `[Substreams] Chain reorg on chainId=${chainId}. Last valid cursor: ${signal.lastValidCursor} and last valid block: ${signal.lastValidBlock}`,
    );
    // TODO: delete/revert DB rows whose block_number > the block referenced by signal.last_valid_block
  }

  // Exponential backoff state
  let backoffMs = 1_000;
  const maxBackoffMs = 30_000;
  let lastCursor: string | undefined = dbCursor;

  // The infinite loop handles disconnections. Every time a disconnection error is thrown,
  // the loop will automatically reconnect and start consuming from the latest committed cursor.
  /*
    Inspired by https://docs.substreams.dev/how-to-guides/sinks/stream/javascript 
    */
  while (true) {
    try {
      console.log("in the try block of startSubstreamsListener...");
      const result = await stream(
        substreamPackage,
        registry,
        transport,
        BLOCK_DEPLOYED,
        OUTPUT_MODULE,
        eventsCallsDispatcher,
        CHAIN_ID,
        lastCursor,
        onUndo,
      );
      lastCursor = result.cursor;

      // Stream ended cleanly — persist cursor and exit
      if (lastCursor) {
        await updateLastCursorInDB(CHAIN_ID, lastCursor);
      }
      console.log(`about to break of the while true bc stream ended cleanly`);
      break;
    } catch (e) {
      // Always recover the cursor from the error if the stream managed to advance it
      const thrownCursor = (e as Error & { streamCursor?: string })
        ?.streamCursor;
      if (thrownCursor) lastCursor = thrownCursor;

      // Persist whatever cursor we have before potentially retrying
      if (lastCursor) {
        await updateLastCursorInDB(CHAIN_ID, lastCursor).catch((dbErr) => {
          console.error(
            "[Substreams] Failed to persist cursor after error:",
            dbErr,
          );
        });
      }

      if (!isErrorRetryable(e)) {
        console.log(
          `A non-retryable error occurred, exiting the substreams listener...`,
        );
        console.dir(e, { depth: null, colors: true });
        throw e;
      }

      console.log(`A retryable error occurred, retrying after sleep...`);
      console.dir(e, { depth: null, colors: true });

      // Exponential backoff before reconnecting
      await sleep(backoffMs);
      backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
    }
  }
}
