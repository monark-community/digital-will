/**
 * Stub data for dashboard (replace with real auth/API later).
 */

export type MemberRole = 'primary' | 'secondary';

export const STUB_USER = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
} as const;

/** John Doe is primary member only. */
export const STUB_USER_ROLES: MemberRole[] = ['primary'];

export const STUB_METRICS = {
  totalAssetValue: 198500,
  activeWills: 1,
  beneficiaries: 3,
  lastActivity: '01/02/2026',
} as const;

export const STUB_WILL = {
  title: 'Primary Digital Will',
  status: 'Active' as const,
  beneficiariesCount: 3,
  assetsCount: 5,
  inactivityDaysRemaining: 290,
};

export const STUB_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', quantity: '2.5', value: 125000, initials: 'BT', iconBg: 'from-emerald-500 to-teal-600' },
  { symbol: 'ETH', name: 'Ethereum', quantity: '15.8', value: 48500, initials: 'ET', iconBg: 'from-blue-500 to-indigo-600' },
  { symbol: 'USDC', name: 'USD Coin', quantity: '25,000', value: 25000, initials: 'US', iconBg: 'from-blue-400 to-blue-600' },
] as const;

export const STUB_WILLS = [
  {
    id: 'will-1',
    title: 'Family Crypto Inheritance',
    status: 'Active' as const,
    createdAt: '2025-11-15',
    lastUpdated: '2026-02-01',
    secondaryMembers: [
      { name: 'Sarah Johnson', allocation: 50 },
      { name: 'Michael Johnson', allocation: 30 },
      { name: 'Emily Johnson', allocation: 20 },
    ],
    assets: ['BNB'],
    totalValue: 198500,
    inactivityPeriod: 365,
    walletAddress: '519841895sag7478g4sdf4as98f4sa5f4sa78fd1as4',
  },
  {
    id: 'will-2',
    title: 'Business Assets Will',
    status: 'Draft' as const,
    createdAt: '2026-01-20',
    lastUpdated: '2026-01-28',
    secondaryMembers: [
      { name: 'Robert Smith', allocation: 60 },
      { name: 'Jennifer Davis', allocation: 40 },
    ],
    assets: ['ETH'],
    totalValue: 73500,
    inactivityPeriod: 180,
    walletAddress: '7a9b3f2e1d8c4a5b6e9f0a1b2c3d4e5f6a7b8c9d',
  },
  {
    id: 'will-3',
    title: 'Emergency Fund Distribution',
    status: 'Inactive' as const,
    createdAt: '2025-08-10',
    lastUpdated: '2025-12-15',
    secondaryMembers: [
      { name: 'Alice Brown', allocation: 100 },
    ],
    assets: ['ETH'],
    totalValue: 25000,
    inactivityPeriod: 90,
    walletAddress: '519841895sag7478g4sdf4as98f4sa5f4sa78fd1as4',
  },
  {
    id: 'will-4',
    title: 'Retirement Savings Transfer',
    status: 'Active' as const,
    createdAt: '2025-12-05',
    lastUpdated: '2026-01-15',
    secondaryMembers: [
      { name: 'David Wilson', allocation: 70 },
      { name: 'Maria Garcia', allocation: 30 },
    ],
    assets: ['ETH'],
    totalValue: 150000,
    inactivityPeriod: 730,
    walletAddress: '519841895sag7478g4sdf4as98f4sa5f4sa78fd1as4',
  },
] as const;

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}
