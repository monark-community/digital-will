# WillChain PostreSQL Database

## Description

PostgreSQL database for the WillChain backend, managed with Prisma ORM. Stores users, wallets, wills (both deployed and draft), secondary members, contacts, notifications, and protection period timers.

## Installation

The database is automatically built with the Docker Compose command at the project's root:

```bash
docker compose -f docker-compose.local.yml up --build -d
```

## Database Schema

```bash
// Prisma schema file for PostgreSQL

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum NotificationType {
  SIGNATURE_REQUEST
  WILL_ACTIVATED
  WILL_CANCELED
  WILL_CANCELED_ALL_SM_LEFT
  SM_ADDED
  SM_UPDATED
  SM_REMOVED
  SM_DESISTED
  SECURITY_PERIOD_UPDATED
  DEATH_DECLARED
  DEATH_CONFIRMED
  VETO_EXERCISED
  ASSETS_SWAPPED
  EXECUTE_WILL
  SM_SIGNATURE_REFUSED
  PROTECTION_PERIOD_REMINDER
}

model User {
  userId        String          @id @default(uuid())
  firstName     String
  lastName      String
  email         String          @unique
  phoneNo       String?
  passwordHash  String
  wantToReceiveMails Boolean    @default(false)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  wallets       Wallet[]
  contacts      Contact[]
  notifications Notifications[]

  @@map("users")
}

model Wallet {
  walletId         String            @id @default(uuid())
  address          String            @unique
  label            String?
  userId           String
  user             User              @relation(fields: [userId], references: [userId], onDelete: Cascade)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  wills            Will[]
  draftwills       DraftWill[]
  secondaryMembers SecondaryMember[]

  @@index([userId])
  @@map("wallets")
}

model Contact {
  contactId     String  @id @default(uuid())
  userId        String
  user          User    @relation(fields: [userId], references: [userId], onDelete: Cascade) // the user who owns the contact
  firstName     String
  lastName      String
  email         String
  phoneNumber   String?
  walletAddress String
  relationship  String?

  createdAt DateTime @default(now())

  @@map("contacts")
}

model Will {
  willId                      String            @id @default(uuid())
  walletAddress               String
  willName                    String
  contractAddressInBlockchain String
  chainId                     Int
  isDeletedByUser             Boolean           @default(false)   // when the user deletes/keeps the will as draft. Will not deleted for notifications.
  wallet                      Wallet            @relation(fields: [walletAddress], references: [address], onDelete: Cascade)
  secondaryMembers            SecondaryMember[]
  notifications               Notifications[]
  protectionPeriodTimer       ProtectionPeriodTimer?

  @@unique([chainId, contractAddressInBlockchain])
  @@map("wills")
}

model SecondaryMember {
  secondaryMemberId String  @id @default(uuid())
  firstName         String
  lastName          String
  email             String
  phoneNumber       String?
  tempWalletAddress String? // this is the address used before the SM creates a WillChain account
  walletAddress     String? // this is the address used when the SM has a WillChain account
  willId            String
  will              Will    @relation(fields: [willId], references: [willId], onDelete: Cascade)
  wallet            Wallet? @relation(fields: [walletAddress], references: [address], onDelete: Cascade)
  relationship      String?

  @@map("secondarymembers")
}

model DraftWill {
  draftWillId                 String            @id @default(uuid())
  walletAddress               String
  willName                    String
  minSecurityPeriod           Int
  maxSecurityPeriod           Int
  wallet                      Wallet            @relation(fields: [walletAddress], references: [address], onDelete: Cascade)
  draftsecondarymembers       draftSecondaryMember[]

  @@map("draftwills")
}


model draftSecondaryMember {
  secondaryMemberId String  @id @default(uuid())
  firstName         String
  lastName          String
  email             String
  phoneNumber       String?
  votingPower       Int
  walletAddress     String?
  draftWillId       String
  draftWill         DraftWill    @relation(fields: [draftWillId], references: [draftWillId], onDelete: Cascade)
  relationship      String?

  @@map("draftsecondarymembers")
}

model WillFactory {
  willFactoryId               String @id @default(uuid())
  contractAddressInBlockchain String
  chainId                     Int    @unique
  blockDeployed               Int    // the block where the willFactory contract has been deployed
  lastProcessedCursor         String // given by the stream

  @@map("willfactories")
}

model Notifications {
  notifId    String           @id @default(uuid())
  notifType  NotificationType @default(WILL_ACTIVATED)
  willId     String?
  userId     String
  smName     String?
  amount     Float?
  readStatus Boolean
  createdAt  DateTime         @default(now())
  will       Will?            @relation(fields: [willId], references: [willId], onDelete: SetNull)
  user       User             @relation(fields: [userId], references: [userId], onDelete: Cascade)

  @@map("notifications")
}

model ProtectionPeriodTimer {
  timerId           String    @id @default(uuid())
  willId            String    @unique
  expiresAt         DateTime
  fired             Boolean   @default(false)
  lastReminderAt    DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  will              Will      @relation(fields: [willId], references: [willId], onDelete: Cascade)

  @@index([fired, expiresAt])
  @@map("protectionperiodtimers")
}

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum NotificationType {
  SIGNATURE_REQUEST
  WILL_ACTIVATED
  WILL_CANCELED
  WILL_CANCELED_ALL_SM_LEFT
  SM_ADDED
  SM_UPDATED
  SM_REMOVED
  SM_DESISTED
  SECURITY_PERIOD_UPDATED
  DEATH_DECLARED
  DEATH_CONFIRMED
  VETO_EXERCISED
  ASSETS_SWAPPED
  EXECUTE_WILL
  SM_SIGNATURE_REFUSED
  PROTECTION_PERIOD_REMINDER
}

model User {
  userId        String          @id @default(uuid())
  firstName     String
  lastName      String
  email         String          @unique
  phoneNo       String?
  passwordHash  String
  wantToReceiveMails Boolean    @default(false)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  wallets       Wallet[]
  contacts      Contact[]
  notifications Notifications[]

  @@map("users")
}

model Wallet {
  walletId         String            @id @default(uuid())
  address          String            @unique
  label            String?
  userId           String
  user             User              @relation(fields: [userId], references: [userId], onDelete: Cascade)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  wills            Will[]
  draftwills       DraftWill[]
  secondaryMembers SecondaryMember[]

  @@index([userId])
  @@map("wallets")
}

model Contact {
  contactId     String  @id @default(uuid())
  userId        String
  user          User    @relation(fields: [userId], references: [userId], onDelete: Cascade) // the user who owns the contact
  firstName     String
  lastName      String
  email         String
  phoneNumber   String?
  walletAddress String
  relationship  String?

  createdAt DateTime @default(now())

  @@map("contacts")
}

model Will {
  willId                      String            @id @default(uuid())
  walletAddress               String
  willName                    String
  contractAddressInBlockchain String
  chainId                     Int
  isDeletedByUser             Boolean           @default(false)   // when the user deletes/keeps the will as draft. Will not deleted for notifications.
  wallet                      Wallet            @relation(fields: [walletAddress], references: [address], onDelete: Cascade)
  secondaryMembers            SecondaryMember[]
  notifications               Notifications[]
  protectionPeriodTimer       ProtectionPeriodTimer?

  @@unique([chainId, contractAddressInBlockchain])
  @@map("wills")
}

model SecondaryMember {
  secondaryMemberId String  @id @default(uuid())
  firstName         String
  lastName          String
  email             String
  phoneNumber       String?
  tempWalletAddress String? // this is the address used before the SM creates a WillChain account
  walletAddress     String? // this is the address used when the SM has a WillChain account
  willId            String
  will              Will    @relation(fields: [willId], references: [willId], onDelete: Cascade)
  wallet            Wallet? @relation(fields: [walletAddress], references: [address], onDelete: Cascade)
  relationship      String?

  @@map("secondarymembers")
}

model DraftWill {
  draftWillId                 String            @id @default(uuid())
  walletAddress               String
  willName                    String
  minSecurityPeriod           Int
  maxSecurityPeriod           Int
  wallet                      Wallet            @relation(fields: [walletAddress], references: [address], onDelete: Cascade)
  draftsecondarymembers       draftSecondaryMember[]

  @@map("draftwills")
}


model draftSecondaryMember {
  secondaryMemberId String  @id @default(uuid())
  firstName         String
  lastName          String
  email             String
  phoneNumber       String?
  votingPower       Int
  walletAddress     String?
  draftWillId       String
  draftWill         DraftWill    @relation(fields: [draftWillId], references: [draftWillId], onDelete: Cascade)
  relationship      String?

  @@map("draftsecondarymembers")
}

model WillFactory {
  willFactoryId               String @id @default(uuid())
  contractAddressInBlockchain String
  chainId                     Int    @unique
  blockDeployed               Int    // the block where the willFactory contract has been deployed
  lastProcessedCursor         String // given by the stream

  @@map("willfactories")
}

model Notifications {
  notifId    String           @id @default(uuid())
  notifType  NotificationType @default(WILL_ACTIVATED)
  willId     String?
  userId     String
  smName     String?
  amount     Float?
  readStatus Boolean
  createdAt  DateTime         @default(now())
  will       Will?            @relation(fields: [willId], references: [willId], onDelete: SetNull)
  user       User             @relation(fields: [userId], references: [userId], onDelete: Cascade)

  @@map("notifications")
}

model ProtectionPeriodTimer {
  timerId           String    @id @default(uuid())
  willId            String    @unique
  expiresAt         DateTime
  fired             Boolean   @default(false)
  lastReminderAt    DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  will              Will      @relation(fields: [willId], references: [willId], onDelete: Cascade)

  @@index([fired, expiresAt])
  @@map("protectionperiodtimers")
}
```

### Prisma commands

```bash
npx prisma generate                     # Generate Prisma client
npx prisma studio                       # Open GUI (http://localhost:5555)
npx prisma migrate dev --name <name>    # Create a migration
npx prisma db push --accept-data-loss   # Push schema directly (no migration)
npx prisma migrate reset                # Reset database
```

## Access / Inspection

### Via Docker

```bash
docker exec -it postgres psql -U willchain_local -d willchain_local_db
```

### Via Prisma Studio

```bash
npx prisma studio
```

## Schema Modification

1. Edit schema.prisma file.
2. ` npx prisma generate`
3. ` npx prisma db push --accept-data-loss`
4. ` docker compose -f docker-compose.local.yml down -v`
5. ` docker compose -f docker-compose.local.yml up --build -d`

## Database Reset

### Reset via Docker

Use Docker to reset the database:

```bash
docker exec -it postgres psql -U <postgres_user> -d <database_name>
DROP DATABASE <database_name>;
CREATE DATABASE <database_name>;
```

Then apply migrations:

```bash
npx prisma migrate deploy
```

### Reset via Prisma

Use Prisma directly with your database connection string:

```bash
DATABASE_URL="postgresql://username:password@dpg-xxxxx.postgres.render.com/database_name?sslmode=require" npx prisma migrate reset
```

> Replace `username`, `password`, `dpg-xxxxx`, and `database_name` with your actual database credentials.
