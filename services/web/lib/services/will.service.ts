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
  willName: string;
  secondaryMembers?: SecondaryMemberInput[];
  minSecurityPeriod?: number;
  maxSecurityPeriod?: number;
}

export interface UpdateDraftWillParams {
  willName?: string;
  secondaryMembers?: SecondaryMemberInput[];
  minSecurityPeriod?: number;
  maxSecurityPeriod?: number;
}

export interface DeployWillParams {
  contractAddressInBlockchain: string;
  chainId: number;
}

export interface WillFromDB {
  willId: string;
  willName: string;
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

export interface AssociatedWill extends WillFromDB {
  myMembership: {
    secondaryMemberId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string | null;
    votingPower: number;
    state: 'PENDING' | 'VALIDATED' | 'DECLARED_DEATH';
    relationship?: string | null;
    walletAddress?: string | null;
    tempWalletAddress?: string | null;
  };
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
      const txOverrides: { value?: bigint } = {};
      if (params.fundEth && parseFloat(params.fundEth) > 0) {
        const amountWei = ethers.parseEther(params.fundEth);
        const gasBuffer = ethers.parseEther("0.005");
        const signerAddress = await signer.getAddress();
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const userBalance = await provider.getBalance(signerAddress);
        if (userBalance < amountWei + gasBuffer) {
          throw new Error(
            `Insufficient balance. You have ${parseFloat(ethers.formatEther(userBalance)).toFixed(4)} ETH but need at least ${parseFloat(ethers.formatEther(amountWei + gasBuffer)).toFixed(4)} ETH (funding + gas).`
          );
        }
        txOverrides.value = amountWei;
      }

      // Send the transaction
      const tx = await factoryContract.createWill(
        checksummedOwner,
        smList,
        securityConfig,
        txOverrides
      );
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
    /** Optional ETH amount to send with the createWill tx (e.g. "0.5") */
    initialFundEth?: string;
  }): Promise<WillFromDB> {
    try {
      // 1. Préparer les paramètres pour la blockchain
      const blockchainParams = this.prepareCreateWillParams(
        params.factoryAddress,
        params.ownerAddress,
        params.secondaryMembers.map(m => ({ 
          address: m.address, 
          power: m.power 
        })),
        params.minSecurityPeriodDays,
        params.maxSecurityPeriodDays,
        params.initialFundEth
      );

      // 2. Appeler la blockchain
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const network = await provider.getNetwork();
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
    maxSecurityPeriodDays: number,
    fundEth?: string
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
      fundEth,
    };
  }

  // ============================================
  // OFFCHAIN (BASE DE DONNÉES)
  // ============================================
  /**
   * Get all wills where the authenticated user is a secondary member
   */
  async getAssociatedWills(): Promise<AssociatedWill[]> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: AssociatedWill[];
      }>(API_ROUTES.WILLS.ASSOCIATED);
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching associated wills:", error);
      throw new Error("Failed to fetch associated wills: " + (error.response?.data?.message || error.message));
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
  
  /*
   * Create a new draft will (off-chain only)
   */
  async createDraftWill(params: CreateDraftWillParams): Promise<WillFromDB> {
    console.log(params.willName);
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
   * Revert a canceled on-chain will back to DRAFT in the DB
   */
  async cancelWill(willId: string): Promise<WillFromDB> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: WillFromDB;
      }>(API_ROUTES.WILLS.CANCEL(willId));
      return response.data.data;
    } catch (error: any) {
      console.error("Error canceling will:", error);
      throw new Error("Failed to cancel will: " + (error.response?.data?.message || error.message));
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

  /**
   * Update members and/or security periods of a deployed (INACTIVE/ACTIVE) will in the DB.
   * Call AFTER the blockchain updateWill tx succeeds (or alone if only names changed).
   */
  async updateDeployedWillMembers(willId: string, params: {
    updatedMembers?: Array<{ secondaryMemberId: string; firstName?: string; lastName?: string; email?: string; relationship?: string; walletAddress?: string; votingPower?: number; }>;
    addedMembers?: Array<{ walletAddress: string; votingPower: number; firstName?: string; lastName?: string; email?: string; relationship?: string; }>;
    deletedMemberIds?: string[];
    minSecurityPeriod?: number;
    maxSecurityPeriod?: number;
  }): Promise<WillFromDB> {
    try {
      const response = await apiClient.put<{ success: boolean; data: WillFromDB }>(
        API_ROUTES.WILLS.UPDATE_MEMBERS(willId),
        params
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Error updating deployed will members:", error);
      throw new Error("Failed to update will: " + (error.response?.data?.message || error.message));
    }
  
  }
  async addMemberToContacts(contactData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    walletAddress: string;
    relationship?: string;
  }): Promise<void> {
    try {
      await apiClient.post('/api/contacts', contactData);
    } catch (error: any) {
      console.error("Error adding contact:", error);
      throw new Error(error.response?.data?.message || "Failed to add contact");
    }
  }
}

export const willService = new WillService();
