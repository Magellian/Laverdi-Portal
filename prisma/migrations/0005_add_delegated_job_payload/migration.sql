-- Adds a payload column to delegated_job so a job can carry its actual
-- request details (e.g. the shell command or package name being
-- delegated), not just its kind/status. Purely additive and nullable.

-- AlterTable
ALTER TABLE "delegated_job" ADD COLUMN "payload" TEXT;
