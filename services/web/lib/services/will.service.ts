/**
 * Will service for creating and managing wills
 */

import { ethers } from "ethers";
import { config } from "@/lib/config";
import { WILL_FACTORY_ABI } from "@/lib/contracts/WillFactoryABI";
import { getSigner, daysToSeconds, waitForTransaction } from "@/lib/utils/blockchain";
import type { CreateWillParams, CreateWillResult, SMPartialInfo, SecurityPeriodConfig } from "@/lib/types/contracts";

class WillService {
  /**
   * Create a new will by calling the WillFactory contract
   */
  async createWill(params: CreateWillParams): Promise<CreateWillResult> {
    try {
      const signer = await getSigner();

      const checksummedFactoryAddress = ethers.getAddress(params.factoryAddress);
      const checksummedOwner = ethers.getAddress(params.owner);

      const factoryContract = new ethers.Contract(
        checksummedFactoryAddress,
        WILL_FACTORY_ABI,
        signer
      );

      // Checksum each SM address
      const smList: [string, number][] = params.secondaryMembers.map((sm) => [
        ethers.getAddress(sm.smAddress),
        sm.votePower,
      ]);

      const securityConfig: [bigint, bigint] = [
        params.securityPeriodConfig.minSecurityPeriod,
        params.securityPeriodConfig.maxSecurityPeriod,
      ];

      // Send the transaction
      const tx = await factoryContract.createWill(
        checksummedOwner,
        smList,
        securityConfig
      );

      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error("Transaction failed: no receipt received");
      }

      let willAddress = "";

      for (const log of receipt.logs) {
        try {
          const parsed = factoryContract.interface.parseLog(log);
          if (parsed && parsed.name === "WillCreated") {
            willAddress = parsed.args.will;
            break;
          }
        } catch (_) {
        }
      }

      if (!willAddress) {
        throw new Error("Will address not found in transaction logs");
      }

      return {
        willAddress,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error("Error creating will:", error);
      
      if (error.code === 4001) {
        throw new Error("User rejected the transaction");
      }
      
      if (error.code === "CALL_EXCEPTION") {
        throw new Error("Contract call failed: " + (error.reason || error.message));
      }
      
      throw new Error("Failed to create will: " + (error.message || "Unknown error"));
    }
  }

  /**
   * Helper to prepare create will parameters from form data
   */
  prepareCreateWillParams(
    factoryAddress: string,
    ownerAddress: string,
    secondaryMembers: Array<{ address: string; power: number }>,
    minSecurityPeriodDays: number,
    maxSecurityPeriodDays: number
  ): CreateWillParams {
    return {
      factoryAddress,
      owner: ownerAddress,
      secondaryMembers: secondaryMembers.map((sm) => ({
        smAddress: sm.address,
        votePower: sm.power,
      })),
      securityPeriodConfig: {
        minSecurityPeriod: daysToSeconds(minSecurityPeriodDays),
        maxSecurityPeriod: daysToSeconds(maxSecurityPeriodDays),
      },
    };
  }
}

export const willService = new WillService();
