/**
 * Test utilities and mocks for dashboard testing
 */

import { Droplet } from './types';

/**
 * Mock droplet data for different scenarios
 */
export const mockDroplets = {
  provisioning: {
    id: '1',
    user_id: 'user-provisioning',
    droplet_id: 456789,
    public_ip: null,
    private_ip: null,
    region: 'sfo3',
    status: 'provisioning' as const,
    pairing_token: null,
    tier: 'starter' as const,
    created_at: new Date(Date.now() - 30000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  ready: {
    id: '1',
    user_id: 'user-ready',
    droplet_id: 123456,
    public_ip: '192.0.2.42',
    private_ip: '10.132.0.2',
    region: 'sfo3',
    status: 'ready' as const,
    pairing_token: 'pair_abcd1234efgh5678ijkl9012mnop3456',
    tier: 'starter' as const,
    created_at: new Date(Date.now() - 300000).toISOString(),
    updated_at: new Date(Date.now() - 60000).toISOString(),
  },
  error: {
    id: '1',
    user_id: 'user-error',
    droplet_id: 789012,
    public_ip: null,
    private_ip: null,
    region: 'sfo3',
    status: 'error' as const,
    pairing_token: null,
    tier: 'starter' as const,
    created_at: new Date(Date.now() - 600000).toISOString(),
    updated_at: new Date(Date.now() - 300000).toISOString(),
  },
};

/**
 * Mock API response handler
 */
export function mockApiResponse(url: string, options: any = {}) {
  // Parse user ID from headers
  const userId = options.headers?.['x-user-id'] || 'unknown';

  if (url === '/api/droplets/status') {
    switch (userId) {
      case 'user-provisioning':
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ droplet: mockDroplets.provisioning }),
        });
      case 'user-ready':
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ droplet: mockDroplets.ready }),
        });
      case 'user-error':
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ droplet: mockDroplets.error }),
        });
      default:
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            error: 'No agent provisioned yet',
          }),
        });
    }
  }

  return Promise.reject(new Error(`Unexpected URL: ${url}`));
}

/**
 * Wait for async operations in tests
 */
export function wait(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format droplet status for display
 */
export function formatDropletStatus(status: string): string {
  switch (status) {
    case 'provisioning':
      return '⏳ Provisioning...';
    case 'ready':
      return '✅ Ready to use';
    case 'error':
      return '❌ Error';
    default:
      return '❓ Unknown';
  }
}

/**
 * Format IP address for display
 */
export function formatIp(ip: string | null): string {
  if (!ip) return 'Waiting for IP...';
  return ip;
}

/**
 * Format timestamp
 */
export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Validate IP address format
 */
export function isValidIp(ip: string): boolean {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) return false;

  const parts = ip.split('.').map(Number);
  return parts.every(part => part >= 0 && part <= 255);
}

/**
 * Mock fetch with timeout support
 */
export async function fetchWithTimeout(
  url: string,
  options: any = {},
  timeout: number = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Retry logic for failed operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await wait(delayMs * (i + 1)); // Exponential backoff
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

/**
 * Test data builders
 */
export function buildDroplet(overrides: Partial<Droplet> = {}): Droplet {
  return {
    ...mockDroplets.ready,
    ...overrides,
  };
}

/**
 * Stripe test data
 */
export const stripeTestData = {
  testCard: {
    number: '4242424242424242',
    exp_month: 12,
    exp_year: 2025,
    cvc: '123',
  },
  validCards: [
    '4242424242424242', // Visa
    '5555555555554444', // Mastercard
    '378282246310005', // American Express
  ],
  declineCard: '4000000000000002',
  authenticationRequiredCard: '4000002500003155',
};

/**
 * Environment variables for testing
 */
export const testEnv = {
  API_BASE_URL: 'http://localhost:3000',
  AGENT_BASE_URL: 'http://localhost:5000',
  SUPABASE_URL: 'https://test.supabase.co',
  STRIPE_PUBLIC_KEY: 'pk_test_...',
};

/**
 * Create a test user
 */
export function createTestUser(overrides: any = {}) {
  return {
    id: 'user-test-' + Math.random().toString(36).slice(2, 9),
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    tier: 'starter' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Wait for condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await wait(interval);
  }
}
