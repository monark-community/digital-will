import { apiClient } from "@/lib/api-client";
import { authService } from "@/lib/services";
import { API_ROUTES } from "../config";
import { User } from "../types";

export interface DeleteEligibilityResponse {
  canDelete: boolean;
  obstacles: {
    ownedDeployedWills: string[];
    secondaryMemberWills: string[];
  };
}

class UserService {
  /**
   * Update email notification preference
   */
  async updateEmailNotifications(wantToReceiveMails: boolean): Promise<User> {
    try {
      const response = await apiClient.patch<{
        success: boolean;
        data: User;
      }>(API_ROUTES.USERS.RECEIVE_EMAILS, { wantToReceiveMails });
      return response.data.data;
    } catch (error: any) {
      console.error("Error updating email notifications:", error);
      throw new Error(
        error.response?.data?.message ||
          "Failed to update email notification preference",
      );
    }
  }

  /**
   * Check if current user can delete their account
   */
  async checkDeleteEligibility(): Promise<DeleteEligibilityResponse> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: DeleteEligibilityResponse;
      }>(API_ROUTES.USERS.DELETE_ELIGIBILITY);
      return response.data.data;
    } catch (error: any) {
      console.error("Error checking delete eligibility:", error);
      throw new Error(
        error.response?.data?.message || "Failed to check delete eligibility",
      );
    }
  }

  /**
   * Delete current user account
   */
  async deleteAccount(): Promise<void> {
    try {
      await apiClient.delete(API_ROUTES.USERS.DELETE);
    } catch (error: any) {
      console.error("Error deleting account:", error);
      throw new Error(
        error.response?.data?.message || "Failed to delete account",
      );
    }
  }
}

export const userService = new UserService();
