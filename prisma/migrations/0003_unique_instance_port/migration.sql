-- Prevent two agent instances from ever being allocated the same host
-- port. The application already tries to avoid collisions in
-- lib/provisioning/engine.ts (allocatePort), but that check-then-create
-- is not atomic, so two concurrent provisioning requests could in theory
-- pick the same port before either row exists. A DB-level unique
-- constraint makes that impossible instead of merely unlikely.
-- (Multiple NULLs are allowed under a Postgres unique constraint, so
-- instances without a port yet are unaffected.)

DROP INDEX "instance_port_idx";

ALTER TABLE "instance" ADD CONSTRAINT "instance_port_key" UNIQUE ("port");
