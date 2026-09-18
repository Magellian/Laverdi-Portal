CREATE TABLE "system_setting" (
    "id" TEXT NOT NULL,
    "delegationKillSwitch" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    CONSTRAINT "system_setting_pkey" PRIMARY KEY ("id")
);

INSERT INTO "system_setting" ("id", "delegationKillSwitch", "updatedAt")
VALUES ('global', false, now());
