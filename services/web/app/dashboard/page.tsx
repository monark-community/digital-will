"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Header from "../components/ui/Header";
import DashboardView from "../components/dashboard-view";
import { useCurrentUser } from "@/lib/hooks";
import { authService } from "@/lib/services";
import type { User } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { mutate: getUser, isPending } = useCurrentUser();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      const redirectTo =
        pathname !== "/" ? `?redirectTo=${encodeURIComponent(pathname)}` : "";
      router.push(`/login${redirectTo}`);
      return;
    }

    const cached = authService.getUser();
    if (cached) {
      setUser(cached);
      setIsReady(true);
    } else {
      getUser(undefined, {
        onSuccess: (data) => {
          setUser(data);
          authService.setUser(data);
          setIsReady(true);
        },
        onError: () => {
          const redirectTo =
            pathname !== "/"
              ? `?redirectTo=${encodeURIComponent(pathname)}`
              : "";
          router.push(`/login${redirectTo}`);
        },
      });
    }
  }, [getUser, router]);

  if (!isReady || isPending || !user) {
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
