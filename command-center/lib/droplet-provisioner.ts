/**
 * Droplet Provisioner
 * Main logic to orchestrate droplet creation for users
 */

import { createClient } from '@supabase/supabase-js';
import DigitalOceanAPI, { Droplet } from './digitalocean';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export type ProvisioningTier = 'starter' | 'pro' | 'enterprise';

export interface ProvisioningRequest {
  userId: string;
  tier: ProvisioningTier;
  region?: string;
  webhookUrl: string;
}

export interface ProvisioningResult {
  success: boolean;
  dropletId?: number;
  dropletName?: string;
  ipAddress?: string;
  pairingToken?: string;
  status?: string;
  error?: string;
  timestamp: string;
}

/**
 * Tier-to-size mapping
 */
const TIER_CONFIG: Record<ProvisioningTier, { size: string; name: string }> = {
  starter: {
    size: 's-1vcpu-1gb', // $4/mo
    name: 'Starter Agent',
  },
  pro: {
    size: 's-2vcpu-4gb', // $12/mo
    name: 'Pro Agent',
  },
  enterprise: {
    size: 's-4vcpu-8gb', // $32/mo
    name: 'Enterprise Agent',
  },
};

/**
 * Default region for droplet creation
 */
const DEFAULT_REGION = 'sfo3'; // San Francisco

/**
 * Image to use (Ubuntu 22.04 LTS)
 */
const DEFAULT_IMAGE = 'ubuntu-22-04-x64';

/**
 * Get bootstrap script with injected variables
 */
function getBootstrapScript(
  webhookUrl: string,
  userId: string,
  dropletId: number,
  pairingToken: string,
  region: string
): string {
  let script = fs.readFileSync(
    path.join(__dirname, 'user-data-template.sh'),
    'utf-8'
  );

  // Replace placeholders
  script = script
    .replace(/AGENT_WEBHOOK_URL/g, webhookUrl)
    .replace(/USER_ID/g, userId)
    .replace(/DROPLET_ID/g, String(dropletId))
    .replace(/PAIRING_TOKEN/g, pairingToken)
    .replace(/AGENT_REGION/g, region);

  return script;
}

/**
 * Generate a secure pairing token
 */
function generatePairingToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Main provisioner class
 */
export class DropletProvisioner {
  private doAPI: DigitalOceanAPI;
  private supabase: any;

  constructor(
    doApiToken?: string,
    supabaseUrl?: string,
    supabaseServiceKey?: string
  ) {
    this.doAPI = new DigitalOceanAPI(doApiToken);

    const url = supabaseUrl || process.env.SUPABASE_URL;
    const key = supabaseServiceKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
      );
    }

    this.supabase = createClient(url, key);
  }

  /**
   * Provision a droplet for a user
   * Main orchestration method
   */
  async provision(request: ProvisioningRequest): Promise<ProvisioningResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      console.log(
        `[Provisioner] Starting provisioning for user ${request.userId}, tier ${request.tier}`
      );

      // 1. Validate tier
      if (!TIER_CONFIG[request.tier]) {
        throw new Error(`Invalid tier: ${request.tier}`);
      }

      // 2. Check if user already has an active droplet for this tier
      const existing = await this.getActiveDropletForUser(
        request.userId,
        request.tier
      );
      if (existing) {
        return {
          success: false,
          error: `User already has an active ${request.tier} droplet (${existing.droplet_id})`,
          timestamp,
        };
      }

      // 3. Generate pairing token
      const pairingToken = generatePairingToken();

      // 4. Create droplet record in Supabase (to reserve ID early)
      const dbRecord = await this.createDropletRecord(request.userId, request.tier);
      const recordId = dbRecord.id;

      console.log(`[Provisioner] Created DB record: ${recordId}`);

      // 5. Prepare droplet config
      const tierConfig = TIER_CONFIG[request.tier];
      const region = request.region || DEFAULT_REGION;
      const dropletName = `${tierConfig.name}-${request.userId.substring(0, 8)}-${Date.now()}`;

      // 6. Generate bootstrap script with injected vars
      // Note: dropletId will be set after creation, use placeholder for now
      const bootstrapScript = getBootstrapScript(
        request.webhookUrl,
        request.userId,
        0, // placeholder
        pairingToken,
        region
      );

      // 7. Create the droplet
      console.log(
        `[Provisioner] Creating droplet: ${dropletName} in ${region}`
      );

      const createdDroplet = await this.doAPI.createDroplet({
        name: dropletName,
        region: region,
        size: tierConfig.size,
        image: DEFAULT_IMAGE,
        user_data: bootstrapScript,
        enable_ipv6: true,
        enable_monitoring: true,
        tags: [
          `user:${request.userId.substring(0, 8)}`,
          `tier:${request.tier}`,
          'openclaw',
        ],
      });

      const dropletId = createdDroplet.id;
      console.log(
        `[Provisioner] Droplet created successfully: ${dropletId}`
      );

      // 8. Update DB record with droplet ID
      await this.updateDropletRecord(recordId, {
        droplet_id: dropletId,
        name: dropletName,
        region: region,
        size: tierConfig.size,
        pairing_token: pairingToken,
        status: 'provisioning',
      });

      // 9. Wait for droplet to be active
      console.log(
        `[Provisioner] Waiting for droplet ${dropletId} to become active...`
      );

      let activeDroplet: Droplet;
      try {
        activeDroplet = await this.doAPI.waitForDropletActive(dropletId, 60, 5000);
      } catch (error) {
        // Droplet failed to start - mark as failed and clean up
        await this.markDropletFailed(recordId, error instanceof Error ? error.message : String(error));
        await this.doAPI.destroyDroplet(dropletId);
        throw error;
      }

      const ipAddress = this.doAPI.getIPv4Address(activeDroplet);
      if (!ipAddress) {
        throw new Error('Droplet active but no IP address assigned');
      }

      console.log(
        `[Provisioner] Droplet active. IP: ${ipAddress}, Status: initializing`
      );

      // 10. Update record with IP (but keep status=initializing until agent calls webhook)
      await this.updateDropletRecord(recordId, {
        ip_address: ipAddress,
        status: 'initializing',
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(
        `[Provisioner] Provisioning complete in ${duration}s. Waiting for agent bootstrap...`
      );

      return {
        success: true,
        dropletId: dropletId,
        dropletName: dropletName,
        ipAddress: ipAddress,
        pairingToken: pairingToken,
        status: 'initializing',
        timestamp,
      };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : String(error);
      console.error(`[Provisioner] Provisioning failed: ${errorMsg}`);

      return {
        success: false,
        error: errorMsg,
        timestamp,
      };
    }
  }

  /**
   * Check if user has an active droplet for a given tier
   */
  private async getActiveDropletForUser(
    userId: string,
    tier: ProvisioningTier
  ): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('user_droplets')
      .select('*')
      .eq('user_id', userId)
      .eq('tier', tier)
      .in('status', ['provisioning', 'initializing', 'ready'])
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      throw error;
    }

    return data || null;
  }

  /**
   * Create initial droplet record in DB
   */
  private async createDropletRecord(userId: string, tier: ProvisioningTier) {
    const { data, error } = await this.supabase
      .from('user_droplets')
      .insert([
        {
          user_id: userId,
          tier: tier,
          status: 'provisioning',
          droplet_id: 0, // placeholder
          name: 'initializing',
          region: DEFAULT_REGION,
          size: TIER_CONFIG[tier].size,
        },
      ])
      .select('id')
      .single();

    if (error) {
      throw new Error(`DB error creating record: ${error.message}`);
    }

    return data;
  }

  /**
   * Update droplet record
   */
  private async updateDropletRecord(
    recordId: string,
    updates: Record<string, any>
  ) {
    const { error } = await this.supabase
      .from('user_droplets')
      .update(updates)
      .eq('id', recordId);

    if (error) {
      throw new Error(`DB error updating record: ${error.message}`);
    }
  }

  /**
   * Mark droplet as failed
   */
  private async markDropletFailed(recordId: string, reason: string) {
    await this.updateDropletRecord(recordId, {
      status: 'failed',
      bootstrap_completed_at: new Date().toISOString(),
    });
  }

  /**
   * Get droplet status
   */
  async getDropletStatus(userId: string, tier: ProvisioningTier) {
    const { data, error } = await this.supabase
      .from('user_droplets')
      .select('*')
      .eq('user_id', userId)
      .eq('tier', tier)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * Mark droplet as ready (called from DO callback webhook)
   */
  async markDropletReady(
    userId: string,
    dropletId: number,
    ipAddress: string
  ) {
    const { error } = await this.supabase
      .from('user_droplets')
      .update({
        status: 'ready',
        ip_address: ipAddress,
        bootstrap_completed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('droplet_id', dropletId);

    if (error) {
      throw new Error(`Failed to mark droplet ready: ${error.message}`);
    }
  }

  /**
   * List user's droplets
   */
  async getUserDroplets(userId: string) {
    const { data, error } = await this.supabase
      .from('user_droplets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch droplets: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Destroy a droplet (cleanup)
   */
  async destroyDroplet(userId: string, dropletId: number) {
    try {
      // Mark as deleted in DB
      const { error } = await this.supabase
        .from('user_droplets')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('droplet_id', dropletId);

      if (error) {
        throw error;
      }

      // Destroy on DO
      await this.doAPI.destroyDroplet(dropletId);

      console.log(
        `[Provisioner] Droplet ${dropletId} destroyed for user ${userId}`
      );
    } catch (error) {
      console.error(
        `[Provisioner] Error destroying droplet ${dropletId}: ${error}`
      );
      throw error;
    }
  }
}

export default DropletProvisioner;
