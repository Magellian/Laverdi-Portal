-- Bones for the local-companion delegation bridge (see
-- hermes-hybrid-companion-design.md). Adds companion pairing/status
-- tracking to Instance and a DelegatedJob audit trail table. Purely
-- additive: new nullable/defaulted columns and a new table, safe to
-- apply against a running app on the previous schema version.

-- AlterTable
ALTER TABLE "instance" ADD COLUMN     "companionStatus" TEXT NOT NULL DEFAULT 'unpaired',
ADD COLUMN     "companionLastSeen" TIMESTAMP(3),
ADD COLUMN     "delegationPolicy" TEXT NOT NULL DEFAULT 'ask';

-- CreateTable
CREATE TABLE "delegated_job" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "resultSummary" TEXT,

    CONSTRAINT "delegated_job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delegated_job_instanceId_idx" ON "delegated_job"("instanceId");

-- AddForeignKey
ALTER TABLE "delegated_job" ADD CONSTRAINT "delegated_job_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
