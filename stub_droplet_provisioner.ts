// STUB: droplet-provisioner.ts
// Placeholder while transitioning to Vultr-only infrastructure
// TODO: Remove this file after updating imports in:
//   - pages/api/webhooks/stripe.ts
//   - pages/api/agents/provision.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function createDroplet(config: any) {
  // Stub implementation - delegates to Vultr provisioning
  // This function is deprecated and should not be called
  console.warn('[DEPRECATED] createDroplet called - use Vultr API directly');
  return { dropletId: 'stub', ipAddress: '0.0.0.0', status: 'error' };
}

export async function deleteDroplet(dropletId: string) {
  // Stub implementation
  console.warn('[DEPRECATED] deleteDroplet called - use Vultr API directly');
  return { success: false };
}

export async function storeDropletInfo(userId: string, dropletId: string, ipAddress: string, tier: string) {
  // Stub implementation
  console.warn('[DEPRECATED] storeDropletInfo called - store to instances table directly');
  return { success: false };
}

export async function getDropletInfo(userId: string) {
  // Stub implementation
  const { data } = await supabase
    .from('instances')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .single();
  return data;
}
