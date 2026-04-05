"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Header from "../components/ui/Header";
import DashboardView from "../components/dashboard-view";
import { useCurrentUser } from "@/lib/hooks";
import { authService } from "@/lib/services";

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, isPending } = useCurrentUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      const redirectTo =
        pathname !== "/" ? `?redirectTo=${encodeURIComponent(pathname)}` : "";
      router.push(`/login${redirectTo}`);
    }
  }, [router, pathname]);

  if (!mounted || isPending || !user) {
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
