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
