"use client";

import React from "react";
import { PrimaryMemberContent } from "./dashboard";
import type { User } from "@/lib/types";

interface DashboardViewProps {
  user: User;
}

export default function DashboardView({ user }: DashboardViewProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
            Welcome back, {user.firstName} {user.lastName}
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Manage your digital inheritance and secure your legacy
          </p>
        </div>

        <PrimaryMemberContent />
      </div>
    </div>
  );
}
