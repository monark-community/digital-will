# API Server Deployment on Render

This guide explains how to deploy the Willchain API server on [Render](https://render.com). The server is a Node.js/Express application compiled in TypeScript and deployed via **Docker**.

---

## Overview

The server runs on Render as a **Docker Web Service**. This means Render builds the Docker image directly from the `Dockerfile` in the repository and launches the container automatically. You do not need to install Node.js or configure a server yourself — Render handles everything.

On startup, the container:

1. Automatically applies the database migrations (Prisma).
2. Starts the API server on port `4000`.

---

## Prerequisites

- A [Render](https://render.com) account (**Free** plan or higher).
- Access to the project's Git repository (GitHub, GitLab, etc.).
- A PostgreSQL database already provisioned (see [DEPLOY_DATABASE.md](./DEPLOY_DATABASE.md)).

---

## Deployment Steps

### 1. Create a new Web Service on Render

1. Log in to your Render dashboard.
2. Click **New → Web Service**.
3. Connect your Git repository and select the project.

### 2. Configure the service

In the Web Service settings, fill in the following fields:

| Field                 | Value                           |
| --------------------- | ------------------------------- |
| **Name**              | `willchain-api-dev`             |
| **Runtime**           | `Docker`                        |
| **Dockerfile Path**   | `./services/api/Dockerfile`     |
| **Docker Context**    | `.` (root of the repository)    |
| **Docker Target**     | `development`                   |
| **Region**            | `Oregon (US West)`              |
| **Health Check Path** | `/health`                       |
| **Plan**              | Free (or higher based on needs) |

> **Why Docker?** The project uses native dependencies (OpenSSL for Prisma, Substreams modules) that require a controlled environment. Docker ensures the server runs in an identical environment regardless of the machine.

### 3. Configure environment variables

This is the most important step. In the **Environment** tab of your Render service, add all the variables listed below.

---

## Environment Variables

### Server

| Variable    | Description                                                       | Example                                  |
| ----------- | ----------------------------------------------------------------- | ---------------------------------------- |
| `NODE_ENV`  | Runtime environment                                               | `development`                            |
| `PORT`      | Internal server port                                              | `4000`                                   |
| `HOSTNAME`  | Server listening address                                          | `0.0.0.0`                                |
| `API_URL`   | Public URL of this API server (provided by Render after creation) | `https://willchain-api-dev.onrender.com` |
| `LOG_LEVEL` | Log verbosity level                                               | `info`                                   |

### Database

When you create a PostgreSQL database on Render, you must add **all 6 of the following variables** to your Web Service:

| Variable            | Description                                                        | Example                                                               |
| ------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `POSTGRES_HOST`     | PostgreSQL server hostname (provided by Render)                    | `dpg-xxxxxxxx...`                                                     |
| `POSTGRES_PORT`     | PostgreSQL server port (provided by Render)                        | `5432`                                                                |
| `POSTGRES_USER`     | PostgreSQL username (provided by Render)                           | `willchain_user`                                                      |
| `POSTGRES_PASSWORD` | PostgreSQL password (provided by Render)                           | `your-password-here`                                                  |
| `POSTGRES_DB`       | PostgreSQL database name (provided by Render)                      | `willchain`                                                           |
| `DATABASE_URL`      | Full PostgreSQL connection URL (constructed from the 5 vars above) | `postgresql://willchain_user:password@dpg-xxx.onrender.com/willchain` |

> **All 6 variables are REQUIRED.** Copy these values from your Render PostgreSQL database **Info** tab when you create the database (see [DEPLOY_DATABASE.md](./DEPLOY_DATABASE.md)). The first 5 are used by your application config, and `DATABASE_URL` is used by Prisma ORM for migrations.

### Authentication (JWT)

| Variable         | Description                                                            | Example                      |
| ---------------- | ---------------------------------------------------------------------- | ---------------------------- |
| `JWT_SECRET`     | Secret key used to sign JWT tokens — **must be a long, random string** | _(auto-generated by Render)_ |
| `JWT_EXPIRES_IN` | Token validity duration                                                | `15m`                        |

> Render can auto-generate the value of `JWT_SECRET`. It is strongly recommended to use this feature.

### CORS (Cross-Origin Resource Sharing)

| Variable      | Description                          | Example                            |
| ------------- | ------------------------------------ | ---------------------------------- |
| `CORS_ORIGIN` | Frontend URL allowed to call the API | `https://willchain-app.vercel.app` |

### WebSocket

| Variable                | Description                                    | Example                            |
| ----------------------- | ---------------------------------------------- | ---------------------------------- |
| `WEBSOCKET_PORT`        | WebSocket server port                          | `4001`                             |
| `WEBSOCKET_CORS_ORIGIN` | Frontend URL allowed for WebSocket connections | `https://willchain-app.vercel.app` |

### Frontend

| Variable  | Description                | Example                            |
| --------- | -------------------------- | ---------------------------------- |
| `WEB_URL` | Public URL of the frontend | `https://willchain-app.vercel.app` |

### Email (Resend)

| Variable         | Description                                                | Example                  |
| ---------------- | ---------------------------------------------------------- | ------------------------ |
| `RESEND_API_KEY` | API key for the [Resend](https://resend.com) email service | `re_xxxxxxxxxxxx`        |
| `EMAIL_FROM`     | Sender email address                                       | `noreply@yourdomain.com` |

### Blockchain

| Variable   | Description                                  | Example                                     |
| ---------- | -------------------------------------------- | ------------------------------------------- |
| `RPC_URL`  | Ethereum RPC node URL (e.g. Alchemy, Infura) | `https://sepolia.infura.io/v3/YOUR_API_KEY` |
| `CHAIN_ID` | Ethereum chain identifier                    | `11155111` (Sepolia testnet)                |

### Substreams (blockchain indexing)

| Variable               | Description                                                    | Example                                        |
| ---------------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| `MANIFEST`             | Path to the Substreams configuration file inside the container | `/app/spkg/willchain-events-v0.1.0.spkg`       |
| `SUBSTREAMS_URL`       | Substreams endpoint URL                                        | `https://sepolia.substreams.pinax.network:443` |
| `SUBSTREAMS_API_KEY`   | Substreams API key (Pinax or The Graph)                        | `0e2f828f...`                                  |
| `SUBSTREAMS_MODULE`    | Substreams module to run                                       | `map_events_calls`                             |
| `WILL_FACTORY_ADDRESS` | Deployed WillFactory smart contract address                    | `0x05a61f96958b8c2b8decbc33b5676b6b780dcc28`   |
| `BLOCK_DEPLOYED`       | Ethereum block number at which the contract was deployed       | `10585804`                                     |

---

## Automatic Deployments

Once the service is configured, Render will automatically redeploy the server on every **push** to your main branch (`main` or `master`). You can also trigger a manual deployment from the Render dashboard.

---

## Verifying the Deployment

After deployment, you can verify that the server is running correctly by hitting:

```
GET https://<your-service>.onrender.com/health
```

The expected response is an HTTP `200 OK` status.

---

## Important Notes

- **Render Free Plan**: The service may go to sleep after 15 minutes of inactivity. The first request after an idle period can take 30 to 60 seconds. A paid plan is recommended for production use.
- **Automatic migrations**: Prisma migrations are applied automatically when the container starts. Make sure the `DATABASE_URL` variable is correctly configured before the first deployment.
- **Logs**: Server logs are accessible directly from the **Logs** tab of your service on the Render dashboard.
