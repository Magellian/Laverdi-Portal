# CARRYOVER: Laverdi.tech SaaS Implementation
**Date:** 2026-04-10

## Current State
We are transitioning `laverdi.tech` from a landing page into a fully functional SaaS that provisions OpenClaw VPS instances for users.

### Completed Today
1. **Homepage 3D Integration:** 
   - Converted the Molty 3D/GSAP concept into a Next.js component (`src/laverdi-portal/components/MoltyScene.tsx`).
   - Rebuilt `pages/index.tsx` with dark theme, scroll-triggered animations, and a highly-converting "VPS Value Prop" pitch.
2. **Provisioning Architecture Defined:**
   - Free trial via Stripe -> API call to DigitalOcean -> Cloud-init script provisions OpenClaw -> Webhook returns IP to user.
   - Inference strategy: BYOK (Bring Your Own Key) to avoid token liability.
3. **DO Provisioning Script:** 
   - Wrote `scripts/do-provision.sh`. This cloud-init script installs Docker, writes the `docker-compose.yml`, injects the `USER_ID` and `PAIRING_TOKEN`, starts OpenClaw, and pings the callback URL.
4. **Provisioning API Route:** 
   - Wrote `pages/api/provision.ts`. Receives the user request, generates a secure pairing token, injects variables into the bash script, and calls the DigitalOcean API to spin up the Droplet.

## Next Immediate Steps (For the New Session)
1. **Build the Callback Webhook:** Write `pages/api/webhooks/do-callback.ts` to catch the ping from the newly booted Droplet. This endpoint will receive the `droplet_ip` and `user_id`, update the Supabase database to mark the instance as `ready`, and make the IP/Token visible on the user's dashboard.
2. **Supabase Database Updates:** Ensure the `users` (or new `instances`) table in Supabase has the columns to store `droplet_id`, `droplet_ip`, `pairing_token`, and `status`.
3. **Stripe Integration:** Wire up the actual Stripe checkout webhook to trigger the `/api/provision` endpoint automatically on a successful trial signup.

## Target Directory
`C:\Users\chris\.openclaw\workspace\src\laverdi-portal`