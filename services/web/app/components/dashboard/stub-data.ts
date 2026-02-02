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

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}
