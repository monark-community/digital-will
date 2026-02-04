"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/ui/Header";
import DashboardView from "../components/dashboard-view";
import { useCurrentUser } from "@/lib/hooks";
import { authService } from "@/lib/services";
import type { User } from "@/lib/types";

export default function DashboardPage() {
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
    <>
      <Header isAuthenticated={true} user={user} />
      <DashboardView user={user} />
    </>
  );
}
