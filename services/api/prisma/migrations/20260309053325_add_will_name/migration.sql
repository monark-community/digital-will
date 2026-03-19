-- CreateEnum
CREATE TYPE "WillState" AS ENUM ('DRAFT', 'CANCELED', 'INACTIVE', 'ACTIVE', 'EXECUTED');

-- CreateEnum
CREATE TYPE "SMState" AS ENUM ('PENDING', 'VALIDATED', 'DECLARED_DEATH');

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
    "contractAddressInBlockchain" TEXT,
    "chainId" INTEGER,
    "minSecurityPeriod" INTEGER NOT NULL,
    "maxSecurityPeriod" INTEGER NOT NULL,
    "state" "WillState" NOT NULL,

    CONSTRAINT "wills_pkey" PRIMARY KEY ("willId")
);

-- CreateTable
CREATE TABLE "secondarymembers" (
    "secondaryMemberId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "votingPower" INTEGER NOT NULL,
    "state" "SMState" NOT NULL,
    "tempWalletAddress" TEXT,
    "walletAddress" TEXT,
    "willId" TEXT NOT NULL,
    "relationship" TEXT,

    CONSTRAINT "secondarymembers_pkey" PRIMARY KEY ("secondaryMemberId")
);

-- CreateTable
CREATE TABLE "willfactories" (
    "willFactoryId" TEXT NOT NULL,
    "contractAddressInBlockchain" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,

    CONSTRAINT "willfactories_pkey" PRIMARY KEY ("willFactoryId")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notifId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "willId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readStatus" BOOLEAN NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notifId")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_address_key" ON "wallets"("address");

-- CreateIndex
CREATE INDEX "wallets_userId_idx" ON "wallets"("userId");

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
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_willId_fkey" FOREIGN KEY ("willId") REFERENCES "wills"("willId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
