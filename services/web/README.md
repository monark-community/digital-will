# WillChain — Frontend

The frontend is a modern single-page application that allows users to create, manage, and monitor digital wills on the Ethereum blockchain. It provides a full authentication flow, wallet management, contact management, will lifecycle management (draft with members → deploy → monitor), and real-time notifications.

---

## Tech Stack

| Category      | Technology                                   |
| ------------- | -------------------------------------------- |
| Framework     | **Next.js 16** (App Router)                  |
| Language      | **TypeScript 5**                             |
| UI            | **React 19** + **Tailwind CSS 4**            |
| Data Fetching | **TanStack React Query 5**                   |
| HTTP Client   | **Axios**                                    |
| Blockchain    | **ethers.js 6** (MetaMask interaction)       |
| Real-time     | **Socket.IO Client** (live notifications)    |
| Theming       | CSS custom properties with dark/light toggle |

---

## Architecture

The frontend follows a **feature-based modular architecture** built on the Next.js App Router. Business logic is separated from UI components through a dedicated `lib/` layer.

### Data Flow

```
Component → Hook (React Query) → Service (Axios / ethers.js) → Backend API / Blockchain
                                          ↑
                                   api-client.ts (JWT interceptors)
```

1. **Components** call hooks like `useWallets()`, `useAddContact()`, `useSignIn()`
2. **Hooks** use `useQuery` (cached reads) or `useMutation` (writes with cache invalidation)
3. **Services** make HTTP calls via `apiClient` (auto-attaches JWT) or direct ethers.js contract calls
4. **Notifications** use a separate path — `useNotifications` opens a Socket.IO connection for real-time push

---

## Modules

### `app/` — Pages & Layouts

The `app/` directory uses the **Next.js App Router** convention. Each folder maps to a URL route, and `page.tsx` files define the page content.

| Route               | Page                                    | Description                                                                   |
| ------------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| `/`                 | `page.tsx`                              | Root — redirects to `/dashboard` (authenticated) or `/landing` (guest)        |
| `/landing`          | `landing/page.tsx`                      | Marketing landing page                                                        |
| `/login`            | `(auth)/login/page.tsx`                 | Email/password sign-in                                                        |
| `/signup`           | `(auth)/signup/page.tsx`                | Email/password sign-up                                                        |
| `/signup/wallet`    | `(auth)/signup/wallet/page.tsx`         | Wallet-based account creation (MetaMask)                                      |
| `/dashboard`        | `dashboard/page.tsx`                    | Main dashboard — shows owned wills or associated wills depending on user role |
| `/wills`            | `(dashboard)/wills/page.tsx`            | List of user's own wills (draft & deployed)                                   |
| `/wills/associated` | `(dashboard)/wills/associated/page.tsx` | Wills where the user is a secondary member (executor)                         |
| `/contacts`         | `(dashboard)/contacts/page.tsx`         | User's contact address book                                                   |
| `/wallets`          | `(dashboard)/wallets/page.tsx`          | Linked Ethereum wallets                                                       |
| `/profile`          | `(dashboard)/profile/page.tsx`          | User profile settings                                                         |

> **Route groups** `(auth)` and `(dashboard)` organize code without affecting URL paths.

### `app/components/` — UI Components

Colocated components used by pages:

| Component                              | Description                                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `SessionManager.tsx`                   | JWT lifecycle manager — auto-refreshes tokens, shows inactivity warning modal, handles expiry logout |
| `landing-page.tsx`                     | Landing page hero section and features UI                                                            |
| `dashboard-view.tsx`                   | Dashboard shell — wraps content in `WalletProvider` context                                          |
| `dashboard/WalletContext.tsx`          | React Context providing the currently selected wallet across dashboard components                    |
| `dashboard/PrimaryMemberContent.tsx`   | Dashboard view for will owners (primary members)                                                     |
| `dashboard/SecondaryMemberContent.tsx` | Dashboard view for secondary members (will executors)                                                |
| `ui/Header.tsx`                        | App header with navigation                                                                           |
| `ui/Footer.tsx`                        | App footer                                                                                           |
| `ui/NotificationPanel.tsx`             | Notification dropdown panel                                                                          |
| `ui/ThemeToggle.tsx`                   | Dark/light mode toggle                                                                               |
| `ui/SecurityPeriodCountdown.tsx`       | Countdown timer displayed during the protection period                                               |

### `lib/` — Business Logic

The `lib/` directory contains all business logic, separated from UI components.

#### `lib/config.ts`

Central frontend configuration from `NEXT_PUBLIC_*` environment variables:

- API base URL, blockchain RPC URL, WillFactory contract address
- Environment detection (local / development / production)
- `API_ROUTES` — full map of every backend API endpoint

#### `lib/api-client.ts`

Axios instance with request/response interceptors:

- **Request**: auto-attaches `Authorization: Bearer <token>` from localStorage
- **Response**: on 401, clears token and redirects to `/login`

#### `lib/services/` — API Service Layer

Each service encapsulates API calls for a specific domain:

| Service             | Responsibility                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.service.ts`   | Sign up, sign in, logout, token refresh, wallet authentication, localStorage token/user management                                      |
| `wallet.service.ts` | Wallet CRUD, check removal eligibility (deployed wills block removal)                                                                   |
| `contactService.ts` | Contact CRUD (address book for will members)                                                                                            |
| `userService.ts`    | Update email preferences, check/execute account deletion                                                                                |
| `will.service.ts`   | Draft will CRUD, deploy wills to blockchain (via MetaMask), fetch owned & associated wills, cancel, update members, read on-chain state |

#### `lib/hooks/` — React Query Hooks

Custom hooks that wrap services with TanStack React Query for caching, loading states, and cache invalidation:

| Hook File             | Hooks Provided                                                                                                             | Description                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `useAuth.ts`          | `useSignIn`, `useSignUp`, `useLogout`, `useCurrentUser`, `useCheckWallet`, `useWalletSignIn`, `useCreateAccountWithWallet` | Authentication hooks — mutations for actions, queries for cached user data                             |
| `useWallets.ts`       | `useWallets`, `useAddWallet`, `useRemoveWallet`, `useUpdateWalletLabel`                                                    | Wallet management — mutations invalidate `["wallets"]` query key                                       |
| `useContacts.ts`      | `useContacts`, `useAddContact`, `useRemoveContact`, `useUpdateContact`                                                     | Contact management — mutations invalidate `["contacts"]` query key                                     |
| `useNotifications.ts` | `useNotifications`                                                                                                         | Real-time notifications via Socket.IO — live push from server, with REST fallback for mark-read/delete |

#### `lib/types/` — TypeScript Interfaces

| File              | Contents                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `auth.ts`         | `User`, `Wallet`, `Contact`, `SignUpRequest`, `SignInRequest`, `AuthResponse`, `WalletAuthRequest` |
| `contracts.ts`    | `CreateWillParams`, `CreateWillResult`, `SMPartialInfo`, `SecurityPeriodConfig`                    |
| `notification.ts` | `AppNotification`, `HistoryNotification`                                                           |

#### `lib/utils/` — Utility Functions

| File            | Purpose                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------- |
| `blockchain.ts` | `getSigner()` (MetaMask with address validation & wallet-switch prompts), time conversion helpers  |
| `wallet.ts`     | `connectWallet()` (MetaMask permission flow + signature), `signMessage()`, `isMetaMaskInstalled()` |

#### `lib/contracts/` — Smart Contract ABIs

Contains `WillABI.ts` and `WillFactoryABI.ts` — the ABIs for interacting with the on-chain Will and WillFactory smart contracts via ethers.js.

#### `lib/contract-errors.ts`

Maps Solidity 4-byte error selectors to user-friendly messages, categorized by type (permission, secondary-member, lifecycle, assets, timing).

---

## Limitations / Known Constraints

This frontend is intentionally focused on a pragmatic MVP for managing wills on an EVM chain. The main constraints are:

### Wallet + chain support

- **MetaMask-first**: wallet flows rely on `window.ethereum` and are designed primarily for MetaMask. Other wallets (e.g. WalletConnect) are not a first-class target.
- **Single-environment configuration**: chain RPC, WillFactory address, and API base URL are taken from `NEXT_PUBLIC_*` configuration. Switching networks is supported only insofar as the configured contracts exist on that network.

### Blockchain realities

- **User pays gas**: deployments and on-chain updates require the connected wallet to have enough funds; transactions can fail due to insufficient balance, gas spikes, or RPC/provider issues.
- **Finality is probabilistic**: the UI can track submitted transactions, but confirmation time and finality depend on the network. Reorgs and dropped/replaced transactions are outside the app’s control.
- **Immutability**: once a will is deployed, behavior is constrained by the smart contract. The frontend cannot “fix” or override on-chain state beyond the contract’s allowed methods.

### Real-time notifications

- **Best-effort delivery**: Socket.IO notifications depend on an active connection and browser background behavior. When disconnected, updates may be delayed until reconnection or a manual refresh.

### Session + security tradeoffs

- **JWT storage**: auth tokens are stored in browser storage for convenience. This means the overall security posture depends heavily on preventing XSS (CSP, safe rendering, dependency hygiene).

### Scope limitations

- **Not legal advice**: the app helps manage a digital workflow around wills, but it does not guarantee legal enforceability in any jurisdiction.

---

## Improvements / Future Work

Potential improvements for `services/web` as the project evolves:

### Structure & reuse

- **Refactor pages into reusable feature modules**: reduce duplication across route groups by extracting shared “feature shells” (list + detail + empty/loading states).
- **Reusable domain models**: introduce shared form/value models (e.g. `WillDraftForm`, `ContactForm`) and map them to API payloads in one place.
- **Shared UI primitives**: standardize buttons, modals, toasts, tables, and form controls to keep behavior consistent across pages.

### Data fetching & state

- **Query key factory + consistent cache invalidation**: centralize React Query keys and invalidation rules per domain (auth/wallets/contacts/wills).
- **Optimistic updates where safe**: improve perceived latency for simple CRUD actions (labels, contacts) with rollback on failure.
- **Schema validation at boundaries**: validate API responses/payloads (e.g. with Zod) to fail fast on contract drift.

### Web3 UX

- **Better transaction lifecycle UX**: unified “pending / confirmed / failed” UI with links to explorers, retries, and clear error messages.
- **Broader wallet support**: add WalletConnect or additional injected wallets (while keeping MetaMask as the default path).

### Reliability, quality, and accessibility

- **E2E tests for critical flows**: Playwright tests for sign-in/sign-up, will creation, deploy flow, and notification handling.
- **Component-driven development**: optionally add Storybook to iterate on UI states without running the whole app.
