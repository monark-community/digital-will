"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks";
import { authService } from "@/lib/services";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(authService.getUser());
  const { mutate: getUser, isPending } = useCurrentUser();

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

  if (isPending || !user) {
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
                      First Name
                    </label>
                    <div className="px-4 py-3 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)]">
                      {user.firstName}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
                      Last Name
                    </label>
                    <div className="px-4 py-3 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)]">
                      {user.lastName}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
                    Email Address
                  </label>
                  <div className="px-4 py-3 bg-[var(--bg-section)] border border-[var(--border-section)] rounded-lg text-[var(--text-primary)]">
                    {user.email}
                  </div>
                </div>

                {user.phoneNo && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
                      Phone Number
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
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full sm:w-auto px-6 py-3 bg-[var(--accent)] hover:opacity-90 text-white rounded-lg font-semibold transition-opacity"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
