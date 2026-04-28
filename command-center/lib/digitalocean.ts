/**
 * DigitalOcean API Wrapper
 * Provides type-safe wrappers for DO API calls
 */

import axios, { AxiosInstance } from 'axios';

const DO_API_BASE = 'https://api.digitalocean.com/v2';

export interface DropletCreateRequest {
  name: string;
  region: string;
  size: string;
  image: string;
  user_data?: string;
  enable_ipv6?: boolean;
  enable_monitoring?: boolean;
  tags?: string[];
  enable_backups?: boolean;
}

export interface Droplet {
  id: number;
  name: string;
  memory: number;
  vcpus: number;
  disk: number;
  locked: boolean;
  status: 'new' | 'active' | 'off' | 'archive';
  kernel: any;
  created_at: string;
  features: string[];
  backup_ids: number[];
  snapshot_ids: number[];
  image: any;
  size: any;
  size_slug: string;
  networks: {
    v4: Array<{
      ip_address: string;
      netmask: string;
      gateway: string;
      type: string;
    }>;
    v6: Array<{
      ip_address: string;
      netmask: number;
      gateway: string;
      type: string;
    }>;
  };
  region: any;
  tags: string[];
  vpc_uuid?: string;
}

export interface CreateDropletResponse {
  droplet: Droplet;
  links: any;
}

export interface GetDropletResponse {
  droplet: Droplet;
}

export interface ListDropletsResponse {
  droplets: Droplet[];
  meta: any;
  links: any;
}

export interface DestroyDropletResponse {
  // Empty on success
}

export class DigitalOceanAPI {
  private client: AxiosInstance;
  private apiToken: string;

  constructor(apiToken?: string) {
    this.apiToken = apiToken || process.env.DO_API_TOKEN || '';
    
    if (!this.apiToken) {
      throw new Error('DO_API_TOKEN is required (set via env or constructor)');
    }

    this.client = axios.create({
      baseURL: DO_API_BASE,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`,
      },
      timeout: 30000,
    });
  }

  /**
   * Create a new droplet
   */
  async createDroplet(request: DropletCreateRequest): Promise<Droplet> {
    try {
      const response = await this.client.post<CreateDropletResponse>(
        '/droplets',
        {
          name: request.name,
          region: request.region,
          size: request.size,
          image: request.image,
          user_data: request.user_data,
          enable_ipv6: request.enable_ipv6 ?? true,
          enable_monitoring: request.enable_monitoring ?? true,
          tags: request.tags || [],
          enable_backups: request.enable_backups ?? false,
        }
      );

      return response.data.droplet;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to create droplet: ${message}`);
    }
  }

  /**
   * Get a specific droplet by ID
   */
  async getDroplet(dropletId: number): Promise<Droplet> {
    try {
      const response = await this.client.get<GetDropletResponse>(
        `/droplets/${dropletId}`
      );

      return response.data.droplet;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Droplet ${dropletId} not found`);
      }
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to get droplet: ${message}`);
    }
  }

  /**
   * List all droplets for this account
   */
  async listDroplets(): Promise<Droplet[]> {
    try {
      const response = await this.client.get<ListDropletsResponse>('/droplets');
      return response.data.droplets;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to list droplets: ${message}`);
    }
  }

  /**
   * Destroy a droplet by ID
   */
  async destroyDroplet(dropletId: number): Promise<void> {
    try {
      await this.client.delete(`/droplets/${dropletId}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Already deleted, no error
        return;
      }
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to destroy droplet: ${message}`);
    }
  }

  /**
   * Get droplet's IPv4 address
   */
  getIPv4Address(droplet: Droplet): string | null {
    const v4Networks = droplet.networks.v4.find(n => n.type === 'public');
    return v4Networks?.ip_address || null;
  }

  /**
   * Get droplet's IPv6 address
   */
  getIPv6Address(droplet: Droplet): string | null {
    const v6Networks = droplet.networks.v6[0];
    return v6Networks?.ip_address || null;
  }

  /**
   * Wait for droplet to be active (polling)
   */
  async waitForDropletActive(
    dropletId: number,
    maxRetries: number = 60,
    delayMs: number = 5000
  ): Promise<Droplet> {
    let retries = 0;
    while (retries < maxRetries) {
      const droplet = await this.getDroplet(dropletId);
      
      if (droplet.status === 'active') {
        return droplet;
      }

      if (droplet.status === 'off' || droplet.status === 'archive') {
        throw new Error(`Droplet entered invalid state: ${droplet.status}`);
      }

      retries++;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    throw new Error(`Timeout waiting for droplet ${dropletId} to become active`);
  }

  /**
   * Get size information (for validation)
   */
  async getAvailableSizes(): Promise<any[]> {
    try {
      const response = await this.client.get('/sizes');
      return response.data.sizes || [];
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to get sizes: ${message}`);
    }
  }

  /**
   * Get region information (for validation)
   */
  async getAvailableRegions(): Promise<any[]> {
    try {
      const response = await this.client.get('/regions');
      return response.data.regions || [];
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to get regions: ${message}`);
    }
  }
}

/**
 * Singleton instance
 */
let doInstance: DigitalOceanAPI | null = null;

export function getDigitalOceanAPI(apiToken?: string): DigitalOceanAPI {
  if (!doInstance) {
    doInstance = new DigitalOceanAPI(apiToken);
  }
  return doInstance;
}

export default DigitalOceanAPI;
