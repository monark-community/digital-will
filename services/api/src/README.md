# WillChain — API Server

The API server is the backend layer of the WillChain application. It provides a RESTful API for managing users, wallets, contacts, wills (draft and deployed), and notifications. It also runs a real-time blockchain indexer and pushes live notifications to connected clients via WebSocket.

---

## Tech Stack

| Category         | Technology                                                            |
| ---------------- | --------------------------------------------------------------------- |
| Runtime          | **Node.js 20**                                                        |
| Language         | **TypeScript 5**                                                      |
| Framework        | **Express 4**                                                         |
| ORM / Database   | **Prisma 5** + **PostgreSQL 16**                                      |
| Authentication   | **JWT** (jsonwebtoken) + wallet signature verification (ethers.js)    |
| Real-time        | **Socket.IO 4** (WebSocket gateway)                                   |
| Blockchain       | **ethers.js 6** (RPC reads), **Substreams** (event indexing via gRPC) |
| Email            | **Resend** (transactional emails)                                     |
| Password Hashing | **bcrypt**                                                            |
| Build / Dev      | **tsx** (dev), **tsc** (build), **Docker** (deployment)               |
| API Docs         | **Swagger UI** (`swagger-jsdoc` + `swagger-ui-express`)               |

---

## API Documentation

The API is fully documented with **Swagger / OpenAPI 3.0**. When the server is running locally, the interactive Swagger UI is available at:

```
http://localhost:4000/api/docs
```

The specification is generated from JSDoc annotations in the route files and from the schema definitions in `config/swagger.ts`.

---

## Architecture

The server follows a **layered / service-oriented architecture** with clear separation of concerns. Each layer has a specific responsibility and communicates only with adjacent layers.

### Request Flow

```
HTTP Request
  → Express (CORS, JSON parsing)
    → Routes (routes/)
      → Auth Middleware (verifyToken)
        → Authorization Middleware (resource ownership check)
          → Controller (controllers/)
            → Service (services/)
              → Prisma → PostgreSQL
              → ethers.js → Ethereum RPC
            ← JSON Response
```

### Blockchain Event Flow

```
Substreams gRPC Stream (substreams/)
  → Dispatcher (routes events to handlers)
    → Event/Call Handlers (map raw data → domain models)
      → Notification Handler (handlers/)
        → notificationService → PostgreSQL
        → emailService → Resend API
        → WebSocket gateway → connected clients
```

### WebSocket Flow

```
Client ↔ Socket.IO (gateways/)
  → JWT authentication on connect
  → Real-time notification push
  → Fetch notification history
```

---

## Modules

### `config/`

Application configuration and environment management.

- **config.ts** — Central typed configuration object (server, database, JWT, CORS, blockchain, email settings). All values come from environment variables with local defaults.
- **env.ts** — Loads `.env.local` → `.env` → root `.env` with fallback chain. Validates that required variables are present at startup.
- **swagger.ts** — Swagger/OpenAPI 3.0 specification setup using `swagger-jsdoc`. Defines server info, bearer auth security scheme, and all reusable request/response schemas. The generated spec is served at `http://localhost:4000/api/docs`.

### `routes/`

HTTP route definitions. A central router mounts all sub-routers under `/api`:

- `authRoutes` — signup, signin, wallet-based auth, token refresh
- `walletRoutes` — wallet CRUD
- `contactRoutes` — contact CRUD
- `willRoutes` — draft will and deployed will management
- `userRoutes` — user profile operations
- `notificationRoutes` — notification read/delete

All routes except auth are protected by JWT middleware.

### `controllers/`

Thin request handlers. Each controller parses the request (params, body), delegates to the appropriate service, and returns a JSON response. Controllers do not contain business logic.

### `services/`

Core business logic layer. Each service manages a specific domain:

- **authService** — signup (bcrypt hashing), signin (JWT generation), wallet-based authentication (signature verification)
- **willService** — CRUD for draft wills and deployed wills via Prisma
- **chainStateService** — enriches database will records with live on-chain state (contract calls via ethers.js)
- **contactsService** — contact CRUD for a user's address book
- **walletService** — wallet linking/management per user
- **userService** — user profile operations
- **notificationService** — in-app notification CRUD stored in PostgreSQL
- **emailService** — sends transactional emails via Resend API with rate limiting
- **secondaryMemberService** — manages secondary members (will executors); links temporary addresses to real accounts
- **protectionPeriodService** — background pollers that check death-confirmation countdown timers and send execution/reminder notifications
- **substreamService** — manages WillFactory database records and cursor persistence for Substreams resumption

### `middlewares/`

Express middleware functions:

- **authMiddleware** — verifies JWT tokens and attaches user info to the request
- **authorizationMiddleware** — resource-level ownership checks (e.g. only the will owner can update their will)
- **validationMiddleware** — request body validation (field presence, email format, password strength)
- **errorMiddleware** — global error handler with structured JSON error responses

### `handlers/`

Notification orchestration. When a blockchain event is processed, the notification handler:

1. Looks up the will and its members from the database
2. Creates in-app notifications
3. Sends emails
4. Pushes real-time WebSocket notifications

### `gateways/`

WebSocket real-time gateway using Socket.IO:

- JWT-authenticated connections
- Multi-device support (tracks all sockets per user)
- Real-time notification push via `emitUserNotification()`
- Notification history fetch via `get_notifications` event

### `substreams/`

Blockchain event indexing pipeline. Continuously streams on-chain events from the WillFactory and Will contracts via Substreams (gRPC):

- **substreams.ts** — main listener loop with automatic reconnection and exponential backoff; persists cursor for resumable streaming
- **substreams_dispatcher.ts** — routes each block's events/calls to specific handlers
- **handlers/** — event and call handlers that map raw protobuf data to domain models, then trigger notifications and timer management
- **interfaces/** — raw (protobuf) and cleaned (domain) TypeScript interfaces

### `models/`

Data layer is entirely managed by Prisma ORM. Models are defined in the `prisma/schema.prisma` file, not as TypeScript classes.

### `lib/`

Shared library module:

- **prisma.ts** — singleton Prisma client instance used across all services

### `utils/`

Utility functions and shared constants:

- **errors.ts** — custom error classes (BadRequest, Unauthorized, Forbidden, NotFound, Conflict, Validation, InternalServer)
- **constants.ts** — route paths, regex patterns, retry delays, protection period intervals
- **blockchain.ts** — singleton ethers.js provider, balance fetching, address validation, unit conversions
- **crypto.ts** — wallet signature verification, timestamp validation (5-min replay protection)
- **emailGenerator.ts** — HTML email templates for each notification type
- **userNotificationGenerator.ts** — in-app notification text generation per type and role
- **willValidation.ts** — validates will deployment readiness (minimum members, valid addresses, voting power)
- **helpers.ts** — sleep and retry-with-backoff utilities

---

## Known Limitations & Future Improvements

### 1. Multi-Network Support

The architecture was designed to support multiple blockchain networks, but the current implementation has only been tested and validated on **Sepolia** (testnet). Supporting additional networks in the future may require revisiting and potentially refactoring parts of the architecture if issues arise.

### 2. Race Condition Between gRPC and Substreams (Pinax Dependency)

The server depends on **Pinax** via two services: a gRPC service and a Substreams indexer. A known concurrency issue exists between these two: the Substreams indexer can receive and process blockchain events **before** the database has been updated following a user action, leading to inconsistent state.

The current workaround uses `await` calls with incremental time delays to allow the user's action to fully complete before the Substreams handler processes the corresponding event. This is a fragile solution. The long-term fix is to **centralize all action processing through the server** so that the chronological order of operations is controlled in a single place, eliminating the race condition entirely.

### 3. Notification Data Integrity

Notification content is generated dynamically at construction time using a generator utility that pulls data from multiple related objects (will, user, secondary members, etc.). This data is not stored directly in the notification object itself.

If any of these dependent objects is deleted, the notification may be built with incomplete or missing information. A safeguard exists that prevents deletion of objects that have associated active notifications, but this is a fragile approach. A more robust solution — such as snapshotting relevant data directly into the notification at creation time — should be considered in a future phase.

### 4. Service Circular Dependencies

Some services access data by calling other services, which creates circular dependency chains across the service layer. This should be refactored in a future pass by introducing a cleaner separation of concerns (e.g., dedicated data-access layers or repositories) to avoid tight coupling between services.

### 5. Overloaded Controllers

Several controllers contain too much business logic that should instead be handled by middlewares or validation layers. Refactoring these controllers to be thinner and delegating validation and business rules to dedicated middlewares would improve maintainability and testability.

### 6. Deprecated Substreams Package / Docker Build Workaround

The `@substreams/node` package (v0.7.x) depends on `@bufbuild/connect-node`, which has since been renamed to `@connectrpc/connect-node`. Additionally, the `@substreams/manifest` package ships CommonJS files that incorrectly use ES module syntax (`import.meta.url`), which breaks the build.

Since this is the latest available version of the package, the issues are worked around directly in the `Dockerfile` during the `deps` stage:

- The `@connectrpc/connect-node` directory is copied into `node_modules/@bufbuild/connect-node` to satisfy the old import path
- A `{"type":"commonjs"}` `package.json` is injected into the CJS output of `@substreams/manifest`
- Two files are patched via `sed` to replace `import.meta.url` with `__filename` or `url.pathToFileURL(__filename)` for CommonJS compatibility

This is a temporary workaround. The proper fix depends on the upstream package maintainers releasing a corrected version.
