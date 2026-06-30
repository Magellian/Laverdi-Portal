INSERT INTO subscription (id, "userId", "stripeCustomerId", "stripeSubscriptionId", "stripePriceId", tier, status, "cancelAtPeriodEnd", "createdAt", "updatedAt")
VALUES (
  'manual-fix-001',
  'cmqwx6k090000qv0iy99h25a0',
  'cus_Umdod4AjUJpb3f',
  'sub_1Tn5gBPgT412N4djzRlb2gWd',
  'price_1TeTlyPgT412N4dj2Uv4ue41',
  'starter',
  'active',
  false,
  NOW(),
  NOW()
)
ON CONFLICT ("stripeSubscriptionId") DO UPDATE SET status = 'active', "updatedAt" = NOW();
