# WillChain

WillChain is a decentralized digital will management platform that allows users to create, deploy, and manage wills as smart contracts on the Ethereum blockchain. The platform provides a complete lifecycle — from drafting a will off-chain (with secondary members added during the draft phase), deploying it to the blockchain, to executing the will through a secure death-confirmation and protection-period process.

---

## User Guide

For users who want to understand how the WillChain application works and how to use its features, see the complete **[User Guide](docs/USER_GUIDE.md)**.

The guide covers:

- Getting started and signing in
- Creating and managing wallets
- Understanding wills and secondary members
- The full will lifecycle
- Real-time notifications
- Account settings and security

---

## Tech Stack

### Frontend

| Technology              | Purpose                                 |
| ----------------------- | --------------------------------------- |
| Next.js 16 (App Router) | React framework                         |
| React 19                | UI library                              |
| TypeScript 5            | Type-safe development                   |
| Tailwind CSS 4          | Styling                                 |
| TanStack React Query 5  | Data fetching & caching                 |
| Axios                   | HTTP client                             |
| ethers.js 6             | Blockchain interaction                  |
| MetaMask                | Wallet management & transaction signing |
| Socket.IO Client        | Real-time notifications                 |

> For more details, see the [Frontend README](services/web/README.md).

### Backend

| Technology   | Purpose                          |
| ------------ | -------------------------------- |
| Node.js 20   | Runtime                          |
| Express 4    | HTTP framework                   |
| TypeScript 5 | Type-safe development            |
| Prisma 5     | ORM                              |
| Socket.IO 4  | WebSocket gateway                |
| ethers.js 6  | Blockchain reads                 |
| Substreams   | Blockchain event indexing (gRPC) |
| Resend       | Transactional emails             |
| JWT + bcrypt | Authentication                   |

> For more details, see the [Backend README](services/api/src/README.md).

### Database

| Technology     | Purpose             |
| -------------- | ------------------- |
| PostgreSQL 16  | Relational database |
| Prisma Migrate | Schema migrations   |

> For more details, see the [Database README](services/api/prisma/README.md).

### Smart Contracts

| Technology | Purpose                         |
| ---------- | ------------------------------- |
| Solidity   | Smart contract language         |
| Foundry    | Development framework & testing |

> For more details, see the [Smart Contracts README](packages/smart-contracts/README.md).

---

## Project Structure

```
digital-will/
├── services/
│   ├── api/                 ← Backend (Express + TypeScript)
│   └── web/                 ← Frontend (Next.js + React)
├── packages/
│   ├── smart-contracts/     ← Solidity contracts (Foundry)
│   ├── substreams/          ← Substream Package
│   ├── common/              ← Shared contracts & helpers
│   ├── shared/              ← Shared types & utilities
│   └── components/          ← Shared UI components
├── docs/                    ← Deployment & Docker documentation
├── docker-compose.local.yml ← Local development with Docker
├── render.yaml              ← Render deployment configuration
└── package.json             ← Monorepo root (npm workspaces)
```

---

## Local Development Setup

### Prerequisites

- **Node.js** >= 18
- **Docker** & **Docker Compose**

### 1. Clone the repository

```bash
git clone <repository-url>
cd digital-will
```

### 2. Create the environment files

The project has three `.env` files to configure. Copy each example template and fill in your values:

```bash
# Root (Docker Compose — PostgreSQL credentials + public blockchain config)
cp .env.example .env

# Backend API
cp services/api/.env.example services/api/.env

# Frontend
cp services/web/.env.example services/web/.env
```

> The Substreams service also has its own env file at `services/api/src/substreams/.env`. Copy the example if you need to configure blockchain indexing:
>
> ```bash
> cp services/api/src/substreams/.env.example services/api/src/substreams/.env
> ```

Each `.env.example` file is fully documented with comments. Below are all required variables for each file:

#### Root (`.env`)

| Variable                           | Purpose                                                       |
| ---------------------------------- | ------------------------------------------------------------- |
| `NODE_ENV`                         | Application environment: `local`, `development`, `production` |
| `POSTGRES_USER`                    | PostgreSQL container user                                     |
| `POSTGRES_PASSWORD`                | PostgreSQL container password (set a strong value)            |
| `POSTGRES_DB`                      | PostgreSQL database name                                      |
| `NEXT_PUBLIC_RPC_URL`              | Ethereum RPC endpoint (Sepolia testnet)                       |
| `NEXT_PUBLIC_WILL_FACTORY_ADDRESS` | Deployed WillFactory contract address (0x...)                 |

#### Backend API (`services/api/.env`)

| Variable                | Purpose                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| `NODE_ENV`              | Application environment: `local`, `development`, `production`            |
| `PORT`                  | API server port (default: `4000`)                                        |
| `HOSTNAME`              | Server hostname (default: `0.0.0.0`)                                     |
| `POSTGRES_HOST`         | PostgreSQL hostname (`postgres` for Docker, `localhost` for local setup) |
| `POSTGRES_PORT`         | PostgreSQL port (default: `5432`)                                        |
| `POSTGRES_USER`         | PostgreSQL username                                                      |
| `POSTGRES_PASSWORD`     | PostgreSQL password (same as root `.env`)                                |
| `POSTGRES_DB`           | PostgreSQL database name (same as root `.env`)                           |
| `DATABASE_URL`          | Full Prisma connection string                                            |
| `LOG_LEVEL`             | Logging level: `debug`, `info`, `warn`, `error`                          |
| `API_URL`               | Public API URL (used in emails)                                          |
| `CORS_ORIGIN`           | CORS origin (typically frontend URL)                                     |
| `JWT_SECRET`            | JWT signing secret (min 32 characters, use `openssl rand -base64 32`)    |
| `JWT_EXPIRES_IN`        | JWT token expiration (e.g., `15m`, `7d`)                                 |
| `WEBSOCKET_PORT`        | WebSocket server port (default: `4001`)                                  |
| `WEBSOCKET_CORS_ORIGIN` | WebSocket CORS origin (typically frontend URL)                           |
| `WEB_URL`               | Web app URL (used in email links)                                        |
| `RESEND_API_KEY`        | Email service API key (get from https://resend.com)                      |
| `EMAIL_FROM`            | Sender email address for transactional emails                            |
| `RPC_URL`               | Blockchain RPC endpoint (Sepolia testnet)                                |
| `CHAIN_ID`              | Blockchain chain ID (`11155111` for Sepolia)                             |

#### Frontend (`services/web/.env`)

| Variable                           | Purpose                                                       |
| ---------------------------------- | ------------------------------------------------------------- |
| `NODE_ENV`                         | Application environment: `local`, `development`, `production` |
| `NEXT_PUBLIC_APP_ENV`              | Frontend app environment (displayed in UI)                    |
| `NEXT_PUBLIC_API_URL`              | Backend API URL (must be reachable from browser)              |
| `NEXT_PUBLIC_RPC_URL`              | Blockchain RPC endpoint (for on-chain reads)                  |
| `NEXT_PUBLIC_WILL_FACTORY_ADDRESS` | Deployed WillFactory contract address (0x...)                 |

#### Substreams Indexer (`services/api/src/substreams/.env`)

| Variable               | Purpose                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| `MANIFEST`             | Path to `.spkg` file (default: `/app/spkg/willchain-events-v0.1.0.spkg`) |
| `SUBSTREAMS_URL`       | Substreams gRPC endpoint (network-specific, e.g., Sepolia)               |
| `SUBSTREAMS_API_KEY`   | API key for Substreams provider (Pinax or The Graph)                     |
| `SUBSTREAMS_MODULE`    | Module name within the `.spkg` to run                                    |
| `CHAIN_ID`             | Blockchain chain ID (`11155111` for Sepolia)                             |
| `WILL_FACTORY_ADDRESS` | Deployed WillFactory contract address (0x...)                            |
| `BLOCK_DEPLOYED`       | Block number where WillFactory was deployed (Substreams start point)     |

---

### 3. Docker Configuration

The project uses Docker to containerize all services with optimized multi-stage builds. Each service has its own Dockerfile designed for efficient builds and lean production images:

- **Backend API** (`services/api/Dockerfile`) — Multi-stage build with Node.js base, dependencies layer, and production-optimized Express server
- **Frontend** (`services/web/Dockerfile`) — Multi-stage build leveraging Next.js standalone output for minimal final image size

For detailed information about each Docker stage, optimization strategies, and build order, see:

| Service                | Documentation                            |
| ---------------------- | ---------------------------------------- |
| Backend Docker stages  | [docs/DOCKER_API.md](docs/DOCKER_API.md) |
| Frontend Docker stages | [docs/DOCKER_WEB.md](docs/DOCKER_WEB.md) |

### 4. Run with Docker Compose

Start all services (PostgreSQL + Backend + Frontend) in a single command:

```bash
docker compose -f docker-compose.local.yml up --build
```

This will start:

- **PostgreSQL** on port `5432`
- **Backend API** on port `4000` (with hot reload)
- **Frontend** on port `3000` (with hot reload)

The backend will automatically generate the Prisma client and push the schema to the database on startup.

### 5. Access the application

| Service      | URL                                                          |
| ------------ | ------------------------------------------------------------ |
| Frontend     | [http://localhost:3000](http://localhost:3000)               |
| Backend API  | [http://localhost:4000](http://localhost:4000)               |
| Health Check | [http://localhost:4000/health](http://localhost:4000/health) |

### MetaMask (wallet) configuration

MetaMask is a **browser extension** (and mobile app) that acts as the user-controlled Ethereum wallet. It’s used by the frontend for:

- **Authentication (wallet signup / sign-in)**: the app can ask MetaMask to **sign a message** to prove wallet ownership.
- **On-chain actions**: deploying a will and any contract state changes are sent as **transactions signed by MetaMask** (the user pays gas).

Notes:

- This project targets the **Sepolia testnet** by default (chain id `11155111`). Your MetaMask network should be set to Sepolia.
- MetaMask must be connected to the **same network** where `NEXT_PUBLIC_WILL_FACTORY_ADDRESS` is deployed.
- `NEXT_PUBLIC_RPC_URL` is used for **read-only on-chain reads** in the UI; transaction signing still happens via MetaMask.
- For Sepolia you’ll need **test ETH** in the connected MetaMask account to deploy/update wills.

### 6. Stopping the services

```bash
docker compose -f docker-compose.local.yml down
```

To also remove the database volume (reset data):

```bash
docker compose -f docker-compose.local.yml down -v
```

---

## Deployment

The application is deployed on [Render](https://render.com) using Docker. Each component has its own deployment guide:

| Component             | Guide                                              |
| --------------------- | -------------------------------------------------- |
| API Server            | [docs/DEPLOY_SERVER.md](docs/DEPLOY_SERVER.md)     |
| Frontend              | [docs/DEPLOY_WEB.md](docs/DEPLOY_WEB.md)           |
| Database (PostgreSQL) | [docs/DEPLOY_DATABASE.md](docs/DEPLOY_DATABASE.md) |

For Docker stage documentation:

| Service                | Guide                                    |
| ---------------------- | ---------------------------------------- |
| Backend Docker stages  | [docs/DOCKER_API.md](docs/DOCKER_API.md) |
| Frontend Docker stages | [docs/DOCKER_WEB.md](docs/DOCKER_WEB.md) |

---

## Smart Contract Redeployment

If changes are made to `Will.sol`, the WillFactory contract must also be redeployed. When redeploying the WillFactory, you must perform the following steps:

### 1. Update the WillFactory contract address in environment files

Update the new contract address in all `.env` files that reference it:

- `services/web/.env` (`NEXT_PUBLIC_WILL_FACTORY_ADDRESS`)
- `.env` at project root (`NEXT_PUBLIC_WILL_FACTORY_ADDRESS`)
- `services/api/src/substreams/.env` (`WILL_FACTORY_ADDRESS`)

### 2. Rebuild and redeploy the Substreams package

When the WillFactory contract changes, the Substreams indexer must be updated to match the new contract ABI:

```bash
# Navigate to the Substreams package
cd packages/substreams/willchain_events

# Rebuild the Substreams package (.spkg file)
make build
```

After rebuilding, update the following in `services/api/src/substreams/.env`:

- **`MANIFEST`** — Path to the rebuilt `.spkg` file (if the version changed)
- **`BLOCK_DEPLOYED`** — Block number where the new WillFactory contract was deployed on the blockchain

This ensures the blockchain event indexing stays synchronized with the new contract deployment.
