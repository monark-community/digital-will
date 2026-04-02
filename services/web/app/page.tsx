"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/services";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.replace("/dashboard");
    } else {
      router.replace("/landing");
    }
  }, [router]);

  return null;
}
