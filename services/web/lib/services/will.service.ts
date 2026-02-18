/**
 * Will service for creating and managing wills
 */

import { ethers } from "ethers";
import { config, API_ROUTES } from "@/lib/config";
import { apiClient } from "@/lib/api-client";
import { WILL_FACTORY_ABI } from "@/lib/contracts/WillFactoryABI";
import { getSigner, daysToSeconds, waitForTransaction } from "@/lib/utils/blockchain";
import type { CreateWillParams, CreateWillResult, SMPartialInfo, SecurityPeriodConfig } from "@/lib/types/contracts";

export interface SecondaryMemberInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  walletAddress: string;
}

export interface SaveWillToDBParams {
  walletAddress: string;
  contractAddressInBlockchain: string;
  chainId: number;
  secondaryMembers: SecondaryMemberInput[];
}

export interface WillFromDB {
  willId: string;
  walletAddress: string;
  contractAddressInBlockchain: string;
  chainId: number;
  secondaryMembers: Array<{
    secondaryMemberId: string;
    FirstName: string;
    LastName: string;
    Email: string;
    PhoneNumber?: string | null;
    walletAddress: string;
  }>;
}

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
          if (parsed && parsed.name === "EVT_WillCreated") {
            willAddress = parsed.args.willAddress;
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
      
      if (error.code === 4001 || error.code === "ACTION_REJECTED" || error.reason === "rejected") {
        const rejectionError: any = new Error("User rejected the transaction");
        rejectionError.code = error.code || "ACTION_REJECTED";
        rejectionError.reason = "rejected";
        throw rejectionError;
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

  async saveWillToDB(params: SaveWillToDBParams): Promise<WillFromDB> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: WillFromDB;
      }>(API_ROUTES.WILLS.BASE, {
        will: {
          walletAddress: params.walletAddress,
          contractAddressInBlockchain: params.contractAddressInBlockchain,
          chainId: params.chainId,
        },
        secondaryMembers: params.secondaryMembers,
      });
      return response.data.data;
    } catch (error: any) {
      console.error("Error saving will to database:", error);
      throw new Error("Failed to save will to database: " + (error.response?.data?.message || error.message));
    }
  }

  async getWillsByWallet(walletAddress: string): Promise<WillFromDB[]> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: WillFromDB[];
      }>(API_ROUTES.WILLS.BY_WALLET(walletAddress));
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching wills:", error);
      throw new Error("Failed to fetch wills: " + (error.response?.data?.message || error.message));
    }
  }
}

export const willService = new WillService();
