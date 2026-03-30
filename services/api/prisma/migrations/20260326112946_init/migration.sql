-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SIGNATURE_REQUEST', 'WILL_ACTIVATED', 'WILL_CANCELED', 'WILL_CANCELED_ALL_SM_LEFT', 'SM_ADDED', 'SM_UPDATED', 'SM_REMOVED', 'SM_DESISTED', 'SECURITY_PERIOD_UPDATED', 'DEATH_DECLARED', 'DEATH_CONFIRMED', 'VETO_EXERCISED', 'ASSETS_SWAPPED', 'EXECUTE_WILL');

-- CreateTable
CREATE TABLE "users" (
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNo" TEXT,
    "passwordHash" TEXT NOT NULL,
    "wantToReceiveMails" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "wallets" (
    "walletId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "label" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("walletId")
);

-- CreateTable
CREATE TABLE "contacts" (
    "contactId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "walletAddress" TEXT NOT NULL,
    "relationship" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("contactId")
);

-- CreateTable
CREATE TABLE "wills" (
    "willId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "willName" TEXT NOT NULL,
    "contractAddressInBlockchain" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "isDeletedByUser" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "wills_pkey" PRIMARY KEY ("willId")
);

-- CreateTable
CREATE TABLE "secondarymembers" (
    "secondaryMemberId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "tempWalletAddress" TEXT,
    "walletAddress" TEXT,
    "willId" TEXT NOT NULL,
    "relationship" TEXT,

    CONSTRAINT "secondarymembers_pkey" PRIMARY KEY ("secondaryMemberId")
);

-- CreateTable
CREATE TABLE "draftwills" (
    "draftWillId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "willName" TEXT NOT NULL,
    "minSecurityPeriod" INTEGER NOT NULL,
    "maxSecurityPeriod" INTEGER NOT NULL,

    CONSTRAINT "draftwills_pkey" PRIMARY KEY ("draftWillId")
);

-- CreateTable
CREATE TABLE "draftsecondarymembers" (
    "secondaryMemberId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "votingPower" INTEGER NOT NULL,
    "walletAddress" TEXT,
    "draftWillId" TEXT NOT NULL,
    "relationship" TEXT,

    CONSTRAINT "draftsecondarymembers_pkey" PRIMARY KEY ("secondaryMemberId")
);

-- CreateTable
CREATE TABLE "willfactories" (
    "willFactoryId" TEXT NOT NULL,
    "contractAddressInBlockchain" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "blockDeployed" INTEGER NOT NULL,
    "lastProcessedCursor" TEXT NOT NULL,

    CONSTRAINT "willfactories_pkey" PRIMARY KEY ("willFactoryId")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notifId" TEXT NOT NULL,
    "notifType" "NotificationType" NOT NULL DEFAULT 'WILL_ACTIVATED',
    "willId" TEXT,
    "userId" TEXT NOT NULL,
    "smName" TEXT,
    "readStatus" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notifId")
);

-- CreateTable
CREATE TABLE "protectionperiodtimers" (
    "timerId" TEXT NOT NULL,
    "willId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "fired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protectionperiodtimers_pkey" PRIMARY KEY ("timerId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_address_key" ON "wallets"("address");

-- CreateIndex
CREATE INDEX "wallets_userId_idx" ON "wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wills_chainId_contractAddressInBlockchain_key" ON "wills"("chainId", "contractAddressInBlockchain");

-- CreateIndex
CREATE UNIQUE INDEX "willfactories_chainId_key" ON "willfactories"("chainId");

-- CreateIndex
CREATE UNIQUE INDEX "protectionperiodtimers_willId_key" ON "protectionperiodtimers"("willId");

-- CreateIndex
CREATE INDEX "protectionperiodtimers_fired_expiresAt_idx" ON "protectionperiodtimers"("fired", "expiresAt");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wills" ADD CONSTRAINT "wills_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "wallets"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondarymembers" ADD CONSTRAINT "secondarymembers_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("willId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secondarymembers" ADD CONSTRAINT "secondarymembers_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "wallets"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draftwills" ADD CONSTRAINT "draftwills_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "wallets"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draftsecondarymembers" ADD CONSTRAINT "draftsecondarymembers_draftWillId_fkey" FOREIGN KEY ("draftWillId") REFERENCES "draftwills"("draftWillId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("willId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protectionperiodtimers" ADD CONSTRAINT "protectionperiodtimers_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("willId") ON DELETE CASCADE ON UPDATE CASCADE;
