# Database Deployment on Render

This guide explains how to provision and configure the PostgreSQL database for the Willchain application using **Render's built-in database manager**.

---

## Overview

The application uses **PostgreSQL** as its relational database, managed via [Prisma ORM](https://www.prisma.io/). Render provides a fully managed database service (hosted, backed up, and maintained by Render), so you do not need to set up or maintain your own database server.

Migrations are applied **automatically** when the API server starts — you do not need to run them manually.

---

## Prerequisites

- A [Render](https://render.com) account.
- The API server deployed or in the process of being deployed (see [DEPLOY_SERVER.md](./DEPLOY_SERVER.md)).

---

## Deployment Steps

### 1. Create a PostgreSQL database on Render

1. Log in to your Render dashboard.
2. Click **New → PostgreSQL**.
3. Fill in the following details:

| Field             | Recommended Value                                                            |
| ----------------- | ---------------------------------------------------------------------------- |
| **Name**          | `willchain-db-dev`                                                           |
| **Database Name** | `willchain`                                                                  |
| **User**          | `willchain_user`                                                             |
| **Region**        | `Oregon (US West)` _(same region as the API server for optimal performance)_ |
| **Plan**          | Free (or higher based on needs)                                              |

4. Click **Create Database**.

Render provisions the database within a few seconds.

---

### 2. Retrieve the connection URL

Once the database is created, go to the **Info** tab of your Render database. You will find several connection strings there. Copy the **Internal Database URL** (if the API server is on the same Render account) or the **External Database URL** (if connecting from outside Render).

It looks like this:

```
postgresql://willchain_user:password@dpg-xxxxxxxx.oregon-postgres.render.com/willchain
```

---

### 3. Set the environment variable on the API server

In the Render Web Service settings (the API server), add the following environment variable:

| Variable       | Value                                          |
| -------------- | ---------------------------------------------- |
| `DATABASE_URL` | The connection URL copied in the previous step |

> **Important:** Use the **Internal Database URL** if your API and database are on the same Render account and in the same region. This avoids bandwidth costs and improves performance.

---

### 4. Database migrations

Migrations are managed automatically by **Prisma Migrate**.

Every time the API server Docker container starts, the following command is run automatically:

```
prisma migrate deploy
```

This applies all pending migrations without any data loss. You do **not need to do anything manually**.

---

## Important Notes

- **Render Free Plan**: The free database is automatically deleted after **90 days**. A paid plan is required for long-term or production use.
- **Backups**: On paid plans, Render performs automatic daily backups. On the free plan, there are no automatic backups — make sure to export your data regularly if needed.
- **Connections**: The free plan is limited to a maximum of 97 simultaneous connections. If you expect high traffic, consider upgrading or adding a connection pooler (e.g. PgBouncer).
- **Region**: Use the same region for both the database and the API server to minimize latency.
