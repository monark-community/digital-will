import { redirect } from 'next/navigation';
import React from "react";

export default function Home() {
  // TODO: Replace this with actual authentication check
  const isAuthenticated = false; // This should come from your auth system
  
  if (isAuthenticated) {
    // Redirect authenticated users to dashboard
    redirect('/dashboard');
  } else {
    // Redirect unauthenticated users to landing page
    redirect('/landing');
  }
}
