# API Server — Docker Stages

This document explains the multi-stage Docker build used for the API server (`services/api/Dockerfile`).

The build context is set to the **root of the repository** (`.`) because the Dockerfile also needs to copy files from `packages/` (e.g. the Substreams `.spkg` file).

---

## Overview

The Dockerfile is organized into **5 stages**. Each stage has a specific purpose and only the relevant assets from previous stages are carried over. This keeps the final image as lean as possible.

```
base → deps → local
                 ↘
              builder → development
                     ↘
                      production
```

---

## Stages

### `base`

**From:** `node:20-alpine`

The foundation for all other stages. Sets the working directory to `/app` and provides a minimal Node.js 20 environment based on Alpine Linux (lightweight).

---

### `deps`

**From:** `base`

Installs all Node.js dependencies. This stage:

- Installs system packages required for native modules: `libc6-compat` and `openssl` (needed by Prisma).
- Copies only the `package.json` and `package-lock.json` files (not the source code), so Docker can cache this layer and skip reinstalling dependencies if those files haven't changed.
- Runs `npm ci` to install exact dependency versions.
- Applies **compatibility patches** for `@substreams/node`:
  - Creates a symlink from the old package name (`@bufbuild/connect-node`) to the new one (`@connectrpc/connect-node`).
  - Patches `@substreams/manifest` CJS files that incorrectly use `import.meta.url` (an ESM feature) so they work in CommonJS mode.

---

### `local`

**From:** `base`  
**Target:** `local`

Used for **local development** (via `docker-compose.local.yml`). This stage:

- Copies `node_modules` from the `deps` stage.
- Copies the full API source code.
- Runs `prisma generate` to generate the Prisma client, then `prisma db push` to sync the schema directly to the local database (no migration history).
- Starts the server in **watch/dev mode** with hot reload (`npm run dev`).

> Use this target when running locally with Docker Compose.

---

### `builder`

**From:** `base`

A **build-only** stage used as an intermediate step for the `development` and `production` targets. This stage:

- Copies `node_modules` from the `deps` stage.
- Copies the full API source code.
- Copies the Substreams `.spkg` package file from `packages/substreams/`.
- Runs `prisma generate` to generate the Prisma client.
- Compiles the TypeScript source code to JavaScript via `npm run build` (output goes to `dist/`).

This stage is **never deployed directly** — it only produces compiled artifacts that are used by the next stages.

---

### `development`

**From:** `base`  
**Target:** `development`

Used for **deployment on Render** (current setup). This stage:

- Reuses the compiled output (`dist/`), `node_modules`, Prisma schema, and the Substreams `.spkg` from the `builder` stage.
- On startup, runs `prisma migrate deploy` to apply any pending database migrations.
- Starts the compiled server with `node dist/index.js`.

> This is the target configured in `render.yaml` and used for the Render Web Service deployment.

---

### `production`

**From:** `base`  
**Target:** `production`

Intended for **hardened production deployments**. Identical to `development` in terms of compiled output, but with additional security measures:

- Creates a dedicated non-root system user (`expressjs`) and group (`nodejs`) to run the process.
- The server runs as a **non-root user**, reducing the blast radius if the container is ever compromised.
- Migrations are also applied at startup via `prisma migrate deploy`.

> Use this target for a production-grade deployment where security hardening is required.

---

## Summary Table

| Stage         | Purpose                             | Used where                        |
| ------------- | ----------------------------------- | --------------------------------- |
| `base`        | Shared Node.js 20 Alpine foundation | All other stages                  |
| `deps`        | Install & patch npm dependencies    | `local`, `builder`                |
| `local`       | Local dev with hot reload           | `docker-compose.local.yml`        |
| `builder`     | Compile TypeScript, generate Prisma | `development`, `production`       |
| `development` | Compiled server + auto migrations   | Render deployment (`render.yaml`) |
| `production`  | Same as development + non-root user | Hardened production environments  |
