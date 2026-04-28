/**
 * Type definitions for Laverdi Portal
 */

export interface User {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'starter' | 'pro';
  created_at: string;
  updated_at: string;
}

export interface Droplet {
  id: string;
  user_id: string;
  droplet_id: number;
  public_ip: string | null;
  private_ip?: string | null;
  region: string;
  tier: 'free' | 'starter' | 'pro';
  status: 'provisioning' | 'ready' | 'error';
  pairing_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface DropletStatusResponse {
  droplet?: Droplet;
  error?: string;
}

export interface HealthCheckResponse {
  healthy: boolean;
  version?: string;
  message?: string;
  timestamp?: string;
}

export interface StripePlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  tier: 'free' | 'starter' | 'pro';
  features: string[];
  priceId: string; // Stripe price ID
}

export interface ProvisioningJob {
  id: string;
  user_id: string;
  droplet_id: number | null;
  status: 'pending' | 'creating' | 'bootstrapping' | 'ready' | 'failed';
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface PairingToken {
  token: string;
  droplet_id: number;
  user_id: string;
  expires_at: string;
  used_at?: string;
}

export interface Agent {
  id: string;
  user_id: string;
  droplet_id: number;
  name: string;
  public_ip: string;
  status: 'running' | 'stopped' | 'error';
  created_at: string;
  updated_at: string;
}

export interface Integration {
  id: string;
  user_id: string;
  type: 'telegram' | 'discord' | 'whatsapp' | 'slack' | 'email';
  token_encrypted: string;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DropletError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
}
