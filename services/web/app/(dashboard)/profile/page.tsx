"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks";
import { authService } from "@/lib/services";
import { userService } from "@/lib/services";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(authService.getUser());
  const [mounted, setMounted] = useState(false);
  const { mutate: getUser, isPending } = useCurrentUser();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEligibility, setDeleteEligibility] = useState<{
    canDelete: boolean;
    obstacles: { ownedDeployedWills: string[]; secondaryMemberWills: string[] };
  } | null>(null);
  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Only fetch from API if we don't have cached user data
    if (!user) {
      getUser(undefined, {
        onSuccess: (data) => {
          setUser(data);
          authService.setUser(data);
        },
        onError: () => {
          router.push("/login");
        },
      });
    }
  }, [getUser, router, user]);

const handleToggleEmailNotifications = async () => {
  if (!user) return;
  
  setIsUpdatingPreferences(true);
  try {
    const updatedUser = await userService.updateEmailNotifications(!user.wantToReceiveMails);
    setUser(updatedUser);
    authService.setUser(updatedUser);
  } catch (error: any) {
    setDeleteError(error.message);
  } finally {
    setIsUpdatingPreferences(false);
  }
};

  const handleCheckDeleteEligibility = async () => {
    setIsLoading(true);
    setDeleteError(null);
    try {
      const result = await userService.checkDeleteEligibility();
      setDeleteEligibility(result);
      setShowDeleteModal(true);
    } catch (error: any) {
      setDeleteError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      setDeleteError('Please type "DELETE" to confirm');
      return;
    }
    
    setIsLoading(true);
    try {
      await userService.deleteAccount();
      router.push("/");
    } catch (error: any) {
      setDeleteError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || isPending || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
        <div className="text-[var(--text-primary)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-lg p-8 shadow-lg">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-20 h-20 bg-[var(--accent)] rounded-full flex items-center justify-center">
              <span className="text-white text-3xl font-bold">
                {user?.firstName?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-[var(--text-muted)]">{user.email}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Profile Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>First Name</span>
                      </div>
                    </label>
                    <div className="px-4 py-3 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)]">
                      {user.firstName}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>Last Name</span>
                      </div>
                    </label>
                    <div className="px-4 py-3 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)]">
                      {user.lastName}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                        <path d="M22 6l-10 7-10-7"></path>
                      </svg>
                      <span>Email Address</span>
                    </div>
                  </label>
                  <div className="px-4 py-3 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)]">
                    {user.email}
                  </div>
                </div>

                {user.phoneNo && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
                      <div className="flex items-center gap-2">
                          <svg 
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            viewBox="0 0 24 24"
                            >
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                            <line x1="12" y1="18" x2="12.01" y2="18"></line>
                          </svg>
                        <span>Phone Number</span>
                      </div>
                    </label>
                    <div className="px-4 py-3 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)]">
                      {user.phoneNo}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
                    User ID
                  </label>
                  <div className="px-4 py-3 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-muted)] text-sm font-mono">
                    {user.userId}
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-[var(--border-section)]">
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
                Preferences
              </h2>
              
              <div className="flex items-center justify-between p-4 bg-[var(--bg-section)] rounded-lg">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">Email Notifications</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Receive email updates about your wills and secondary member status
                  </p>
                </div>
                <button
                  onClick={handleToggleEmailNotifications}
                  disabled={isUpdatingPreferences}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 ${
                    user?.wantToReceiveMails ? 'bg-[var(--accent)]' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      user?.wantToReceiveMails ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {isUpdatingPreferences && (
                <p className="text-sm text-[var(--text-muted)] mt-2">Updating...</p>
              )}
            </div>
            <div className="pt-6 border-t border-[var(--border-section)]">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleCheckDeleteEligibility}
                  disabled={isLoading}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? "Checking..." : "Delete Account"}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-6 py-3 bg-[var(--accent)] hover:opacity-90 text-white rounded-lg font-semibold transition-opacity flex items-center gap-2"
                >
                  Back to Dashboard
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && deleteEligibility && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-section)] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-section)] px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                {deleteEligibility.canDelete ? "Delete Account" : "Cannot Delete Account"}
              </h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-[var(--text-muted-alt)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!deleteEligibility.canDelete ? (
                <>
                  <p className="text-[var(--text-primary)]">
                    Before deleting your account, you must:
                  </p>
                  
                  {deleteEligibility.obstacles.secondaryMemberWills.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                      <p className="font-semibold text-yellow-500 mb-2">
                        Withdraw from wills where you are a secondary member:
                      </p>
                      <ul className="list-disc list-inside text-yellow-500/80 text-sm space-y-1">
                        {deleteEligibility.obstacles.secondaryMemberWills.map((name, idx) => (
                          <li key={idx}>"{name}"</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {deleteEligibility.obstacles.ownedDeployedWills.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                      <p className="font-semibold text-yellow-500 mb-2">
                        Cancel wills you have deployed:
                      </p>
                      <ul className="list-disc list-inside text-yellow-500/80 text-sm space-y-1">
                        {deleteEligibility.obstacles.ownedDeployedWills.map((name, idx) => (
                          <li key={idx}>"{name}"</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <p className="text-[var(--text-muted)] text-sm mt-4">
                    After completing these actions on the blockchain, return here to delete your account.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-red-500 font-semibold">
                    This action is PERMANENT and IRREVERSIBLE.
                  </p>
                  
                  <p className="text-[var(--text-primary)]">
                    Deleting your account will:
                  </p>
                  <ul className="list-disc list-inside text-[var(--text-muted)] space-y-1">
                    <li>Remove all your contacts</li>
                    <li>Delete all draft wills</li>
                    <li>Remove your wallets from our records</li>
                  </ul>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Type <span className="font-mono font-bold">DELETE</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="w-full px-4 py-2 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  
                  {deleteError && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-500 text-sm">
                      {deleteError}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-[var(--border-section)] px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-[var(--border-section)] text-[var(--text-primary)] rounded-lg font-medium hover:bg-[var(--bg-section)] transition-colors"
              >
                Back
              </button>
              {deleteEligibility.canDelete && (
                <button
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Deleting..." : "Delete Account"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}