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
  walletAddress?: string;
  tempWalletAddress?: string;    // Pour les membres sans compte
  votingPower?: number;
}

export interface CreateDraftWillParams {
  walletAddress: string;
  secondaryMembers?: SecondaryMemberInput[];
  minSecurityPeriod?: number;
  maxSecurityPeriod?: number;
}

export interface UpdateDraftWillParams {
  secondaryMembers?: SecondaryMemberInput[];
  minSecurityPeriod?: number;
  maxSecurityPeriod?: number;
}

export interface DeployWillParams {
  contractAddressInBlockchain: string;
  chainId: number;
}

/* export interface SaveWillToDBParams {
  walletAddress: string;
  contractAddressInBlockchain: string;
  chainId: number;
  secondaryMembers: SecondaryMemberInput[];
} */

export interface WillFromDB {
  willId: string;
  walletAddress: string;
  contractAddressInBlockchain?: string | null;  // Optionnel
  chainId?: number | null;                      // Optionnel
  minSecurityPeriod: number;
  maxSecurityPeriod: number;
  state: 'DRAFT' | 'INACTIVE' | 'ACTIVE' | 'CANCELED' | 'EXECUTED';
  secondaryMembers: Array<{
    secondaryMemberId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string | null;
    walletAddress?: string | null;
    tempWalletAddress?: string | null;
    votingPower: number;
    state: 'PENDING' | 'VALIDATED' | 'DECLARED_DEATH';
    relationship?: string | null;
  }>;
}

class WillService {
  // ============================================
  // BLOCKCHAIN
  // ============================================
  /**
   * Create a new will by calling the WillFactory contract
   */
  async createWillOnBlockchain(params: CreateWillParams): Promise<CreateWillResult> {
    try {
      console.log("12 - Création du testament sur la blockchain avec les paramètres suivants :", params);
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
console.log("13 - Juste avant la transaction");
      // Send the transaction
      const tx = await factoryContract.createWill(
        checksummedOwner,
        smList,
        securityConfig
      );
console.log("14 - Transaction envoyée, hash :", tx.hash);
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error("Transaction failed: no receipt received");
      }

      let willAddress = "";

      for (const log of receipt.logs) {
        try {
          const parsed = factoryContract.interface.parseLog(log);
          if (parsed && parsed.name === "EVT_WillChain_WillCreated") {
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
   * Deploy a draft will (blockchain + update DB)
   */
  async deployWill(willId: string, params: {
    factoryAddress: string;
    ownerAddress: string;
    secondaryMembers: Array<{ address: string; power: number }>;
    minSecurityPeriodDays: number;
    maxSecurityPeriodDays: number;
  }): Promise<WillFromDB> {
    try {
      console.log("9 - on voudra utiliser ", params.secondaryMembers);
      // 1. Préparer les paramètres pour la blockchain
      const blockchainParams = this.prepareCreateWillParams(
        params.factoryAddress,
        params.ownerAddress,
        params.secondaryMembers.map(m => ({ 
          address: m.address, 
          power: m.power 
        })),
        params.minSecurityPeriodDays,
        params.maxSecurityPeriodDays
      );
      console.log("10 - Paramètres préparés pour la blockchain", blockchainParams);

      // 2. Appeler la blockchain
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const network = await provider.getNetwork();
      console.log("11 - Réseau détecté", network);
      const blockchainResult = await this.createWillOnBlockchain(blockchainParams);

      // 3. Mettre à jour la DB via la route de déploiement
      const response = await apiClient.post<{
        success: boolean;
        data: WillFromDB;
      }>(API_ROUTES.WILLS.DEPLOY(willId), {
        contractAddressInBlockchain: blockchainResult.willAddress,
        chainId: Number(network.chainId)
      });

      return response.data.data;
    } catch (error: any) {
      console.error("Error deploying will:", error);
      throw error;
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

  /* async saveWillToDB(params: SaveWillToDBParams): Promise<WillFromDB> {
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
  } */

  // ============================================
  // OFFCHAIN (BASE DE DONNÉES)
  // ============================================
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
  
  /*
   * Create a new draft will (off-chain only)
   */
  async createDraftWill(params: CreateDraftWillParams): Promise<WillFromDB> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: WillFromDB;
      }>(API_ROUTES.WILLS.DRAFT, params);
      return response.data.data;
    } catch (error: any) {
      console.error("Error creating draft will:", error);
      throw new Error("Failed to create draft will: " + (error.response?.data?.message || error.message));
    }
  }
/**
   * Update an existing draft will
   */
  async updateDraftWill(willId: string, params: UpdateDraftWillParams): Promise<WillFromDB> {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: WillFromDB;
      }>(`${API_ROUTES.WILLS.DRAFT}/${willId}`, params);
      return response.data.data;
    } catch (error: any) {
      console.error("Error updating draft will:", error);
      throw new Error("Failed to update draft will: " + (error.response?.data?.message || error.message));
    }
  }
  
  /**
   * Delete a draft will
   */
  async deleteDraftWill(willId: string): Promise<void> {
    try {
      await apiClient.delete(`${API_ROUTES.WILLS.DRAFT}/${willId}`);
    } catch (error: any) {
      console.error("Error deleting draft will:", error);
      throw new Error("Failed to delete draft will: " + (error.response?.data?.message || error.message));
    }
  }
}

export const willService = new WillService();
