-- CreateTable
CREATE TABLE "Escrow" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "payer" TEXT NOT NULL,
    "payee" TEXT NOT NULL,
    "arbiter" TEXT,
    "arbitrationAdapter" TEXT,
    "factoryAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Escrow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "escrowAddress" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "amount" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "deliverableHash" TEXT,
    "disputeId" TEXT,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "escrowAddress" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "args" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "escrowAddress" TEXT NOT NULL,
    "milestoneIndex" INTEGER NOT NULL,
    "disputeIdOnChain" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Escrow_address_key" ON "Escrow"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_escrowAddress_index_key" ON "Milestone"("escrowAddress", "index");

-- CreateIndex
CREATE INDEX "Event_escrowAddress_idx" ON "Event"("escrowAddress");

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_escrowAddress_fkey" FOREIGN KEY ("escrowAddress") REFERENCES "Escrow"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_escrowAddress_fkey" FOREIGN KEY ("escrowAddress") REFERENCES "Escrow"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_escrowAddress_fkey" FOREIGN KEY ("escrowAddress") REFERENCES "Escrow"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
