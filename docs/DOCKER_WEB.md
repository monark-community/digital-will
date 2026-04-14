# Frontend — Docker Stages

This document explains the multi-stage Docker build used for the frontend (`services/web/Dockerfile`).

The build context is set to the **`services/web/` directory**, as all frontend files are self-contained within that folder.

---

## Overview

The Dockerfile is organized into **5 stages**. Each stage has a specific purpose, and only the relevant assets from previous stages are carried over to keep the final image small and secure.

```
base → deps → local
                 ↘
              development
           deps ↗
              builder → production
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

- Installs `libc6-compat`, a system package required for native Node.js modules on Alpine.
- Copies only the lock files (`package.json`, `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`) so Docker can cache this layer and skip reinstalling if dependencies haven't changed.
- Detects and uses the appropriate package manager (`npm`, `yarn`, or `pnpm`) automatically.

---

### `local`

**From:** `base`  
**Target:** `local`

Used for **local development** (via `docker-compose.local.yml`). This stage:

- Copies `node_modules` from the `deps` stage.
- Copies the full source code.
- Creates the `.next` directory with open permissions to allow Next.js to write build cache during development.
- Starts the Next.js dev server with **hot reload** on `0.0.0.0` (accessible from the host machine).
- Disables Next.js telemetry (`NEXT_TELEMETRY_DISABLED=1`).

> Use this target when running locally with Docker Compose.

---

### `development`

**From:** `base`  
**Target:** `development`

Functionally identical to the `local` stage, but with `NODE_ENV=development`. This stage:

- Copies `node_modules` from the `deps` stage.
- Copies the full source code.
- Starts the Next.js dev server with hot reload.

> Use this target for a remote development environment (e.g. a dev server or Render preview environment).

---

### `builder`

**From:** `base`

A **build-only** stage used as an intermediate step for the `production` target. This stage:

- Copies `node_modules` from the `deps` stage.
- Copies the full source code.
- Runs `npm run build` to produce an optimized Next.js production build (output goes to `.next/`).
- Disables Next.js telemetry during the build.

This stage is **never deployed directly** — it only produces compiled artifacts for the `production` stage.

---

### `production`

**From:** `base`  
**Target:** `production`

Used for **production deployments**. This stage:

- Sets `NODE_ENV=production` and disables Next.js telemetry.
- Creates a dedicated non-root system user (`nextjs`) and group (`nodejs`) so the server does not run as root.
- Copies only the **necessary output** from the `builder` stage:
  - `public/` — static assets
  - `.next/standalone/` — the minimal self-contained server (Next.js standalone output mode)
  - `.next/static/` — compiled CSS, JS, and other static files
- Starts the server via `node server.js` (Next.js standalone server entrypoint).

> The standalone output mode produces the smallest possible image — only the files needed to run the app are included, without the full `node_modules`.

---

## Summary Table

| Stage         | Purpose                             | Used where                        |
| ------------- | ----------------------------------- | --------------------------------- |
| `base`        | Shared Node.js 20 Alpine foundation | All other stages                  |
| `deps`        | Install npm dependencies            | `local`, `development`, `builder` |
| `local`       | Dev server with hot reload          | `docker-compose.local.yml`        |
| `development` | Dev server with hot reload (remote) | Remote dev environments           |
| `builder`     | Compile Next.js production build    | `production`                      |
| `production`  | Optimized server + non-root user    | Production deployments            |
