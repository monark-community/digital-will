import React from 'react';
import Header from '../components/ui/Header';
import DashboardView from '../components/dashboard-view';

/* Stub user for display - replace with real auth later */
const STUB_USER_EMAIL = 'john@example.com';

export default function DashboardPage() {
  return (
    <>
      <Header isAuthenticated={true} userEmail={STUB_USER_EMAIL} />
      <DashboardView />
    </>
  );
}
