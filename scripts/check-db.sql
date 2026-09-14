SELECT id, email, "stripeCustomerId" FROM "user";
SELECT id, "userId", tier, status, "stripeSubscriptionId" FROM subscription;
SELECT id, "ownerId", status, port, tier FROM instance;
