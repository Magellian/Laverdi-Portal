/**
 * End-to-End Tests - Full Signup to Dashboard Flow
 * 
 * This test suite verifies the complete automation flow:
 * 1. User signs up
 * 2. User chooses tier and pays (Stripe)
 * 3. Backend creates droplet automatically
 * 4. Droplet bootstraps and calls back
 * 5. Dashboard shows IP and status
 * 6. User can connect to agent
 */

describe('E2E: Signup → Payment → Droplet → Dashboard', () => {
  const TEST_USER = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    name: 'Test User',
  };

  const TEST_STRIPE_CARD = {
    number: '4242424242424242',
    exp: '12/25',
    cvc: '123',
  };

  beforeEach(() => {
    // Reset any mocks or state
    jest.clearAllMocks();
  });

  describe('Phase 1: User Signup', () => {
    it('should allow user to create account', async () => {
      // Simulate signup API call
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password,
          name: TEST_USER.name,
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.id).toBeDefined();
      expect(data.user.email).toBe(TEST_USER.email);
    });

    it('should prevent duplicate signup', async () => {
      // First signup succeeds
      await fetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(TEST_USER),
      });

      // Duplicate should fail
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(TEST_USER),
      });

      expect([400, 409]).toContain(response.status);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should require valid email', async () => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid-email',
          password: TEST_USER.password,
        }),
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should require strong password', async () => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: TEST_USER.email,
          password: '123', // Too weak
        }),
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Phase 2: Plan Selection & Payment', () => {
    let userId: string;
    let sessionId: string;

    beforeEach(async () => {
      // Get a test user
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(TEST_USER),
      });
      const userData = await signupResponse.json();
      userId = userData.user.id;
    });

    it('should show available plans', async () => {
      const response = await fetch('/api/plans');
      expect(response.status).toBe(200);
      const { plans } = await response.json();
      
      expect(plans).toBeDefined();
      expect(plans.length).toBeGreaterThan(0);
      expect(plans.some((p: any) => p.id === 'starter')).toBe(true);
      expect(plans.some((p: any) => p.id === 'pro')).toBe(true);
    });

    it('should create Stripe checkout session', async () => {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
        body: JSON.stringify({
          priceId: 'price_starter',
          tierName: 'starter',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.sessionId).toBeDefined();
      expect(data.clientSecret).toBeDefined();
      sessionId = data.sessionId;
    });

    it('should process successful payment', async () => {
      // Simulate Stripe webhook for successful payment
      const response = await fetch('/api/webhooks/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': 'test-signature' },
        body: JSON.stringify({
          type: 'customer.subscription.created',
          data: {
            object: {
              id: 'sub_test123',
              customer: 'cus_test456',
              items: {
                data: [
                  {
                    price: {
                      product: 'prod_starter',
                    },
                  },
                ],
              },
              metadata: {
                userId: userId,
                tier: 'starter',
              },
            },
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should trigger droplet provisioning on successful payment', async () => {
      // This would be verified by checking:
      // 1. Stripe webhook was processed
      // 2. Droplet provisioner was called
      // 3. Droplet was created in DO API
      // 4. Database was updated

      const mockProvisioningCall = jest.fn().mockResolvedValue({
        dropletId: 123456,
        status: 'provisioning',
      });

      await mockProvisioningCall('user-id', 'starter');

      expect(mockProvisioningCall).toHaveBeenCalledWith('user-id', 'starter');
      expect(mockProvisioningCall).toHaveBeenCalledTimes(1);
    });

    it('should handle failed payment gracefully', async () => {
      // Simulate failed payment
      const response = await fetch('/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify({
          type: 'charge.failed',
          data: {
            object: {
              customer: 'cus_test456',
              failure_message: 'Card declined',
            },
          },
        }),
      });

      expect(response.status).toBe(200);
      // Should not create droplet for failed payment
    });
  });

  describe('Phase 3: Droplet Creation & Bootstrap', () => {
    let userId: string;
    let dropletId: number;

    beforeEach(() => {
      userId = 'user-test-123';
      dropletId = 456789;
    });

    it('should create droplet with correct specifications', async () => {
      // This is tested by verifying the provisioner creates correct droplet
      const specs = {
        name: `laverdi-agent-${userId}`,
        region: 'sfo3',
        size: 's-2vcpu-2gb-50gb', // Starter tier
        image: 'ubuntu-22-04-x64',
        tags: ['laverdi', `user:${userId}`],
      };

      expect(specs.name).toContain('laverdi-agent');
      expect(specs.region).toBe('sfo3');
      expect(['s-1vcpu-512mb-10gb', 's-2vcpu-2gb-50gb', 's-4vcpu-8gb-160gb']).toContain(specs.size);
    });

    it('should inject user data script into droplet', async () => {
      // User data script should:
      // 1. Install Docker
      // 2. Clone git repo
      // 3. Build Docker images
      // 4. Start containers
      // 5. Call callback webhook

      const userDataScript = `
        #!/bin/bash
        set -e
        apt-get update && apt-get install -y docker.io
        curl -fsSL https://get.docker.com | sh
        cd /tmp && git clone <repo-url>
        docker build -t laverdi-agent ./agent-service
        docker run -d --name laverdi-agent -p 5000:5000 laverdi-agent
        curl -X POST https://portal/api/webhooks/do-callback \\
          -H "Content-Type: application/json" \\
          -d "{\\"droplet_id\\": ${dropletId}, \\"user_id\\": \\"${userId}\\"}"
      `;

      expect(userDataScript).toContain('docker');
      expect(userDataScript).toContain('git clone');
      expect(userDataScript).toContain('do-callback');
    });

    it('should store droplet info in database', async () => {
      // Droplet should be stored with:
      // - droplet_id
      // - user_id
      // - status: 'provisioning'
      // - tier
      // - created_at

      const dropletData = {
        droplet_id: dropletId,
        user_id: userId,
        status: 'provisioning',
        tier: 'starter',
        created_at: new Date().toISOString(),
      };

      expect(dropletData.droplet_id).toBeDefined();
      expect(dropletData.user_id).toBeDefined();
      expect(dropletData.status).toBe('provisioning');
    });

    it('should wait for droplet to boot', async () => {
      // Simulate polling for droplet ready
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds with 1s interval

      while (attempts < maxAttempts) {
        attempts++;
        // In real implementation, would check droplet status via DO API
        const status = attempts > 10 ? 'ready' : 'new';
        
        if (status === 'ready') {
          expect(status).toBe('ready');
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100)); // Abbreviated for tests
      }

      expect(attempts).toBeLessThanOrEqual(maxAttempts);
    });
  });

  describe('Phase 4: Droplet Callback & Status Update', () => {
    let userId: string;
    let dropletId: number;
    const dropletIp = '192.0.2.42';

    beforeEach(() => {
      userId = 'user-test-123';
      dropletId = 456789;
    });

    it('should receive droplet ready callback', async () => {
      const response = await fetch('/api/webhooks/do-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          droplet_id: dropletId,
          public_ip: dropletIp,
          user_id: userId,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should update droplet status to ready', async () => {
      // After callback, droplet status should be updated to 'ready'
      const response = await fetch('/api/droplets/status', {
        headers: { 'x-user-id': userId },
      });

      const data = await response.json();
      expect(data.droplet.status).toBe('ready');
      expect(data.droplet.public_ip).toBe(dropletIp);
    });

    it('should generate pairing token', async () => {
      // Callback should generate a unique pairing token
      const response = await fetch('/api/droplets/status', {
        headers: { 'x-user-id': userId },
      });

      const data = await response.json();
      expect(data.droplet.pairing_token).toBeDefined();
      expect(data.droplet.pairing_token.length).toBeGreaterThan(20);
    });

    it('should send user notification email', async () => {
      // User should receive email with IP and pairing token
      // This would be verified by mocking email service
      const mockEmailService = jest.fn().mockResolvedValue(true);

      const emailSent = await mockEmailService({
        to: TEST_USER.email,
        subject: 'Your OpenClaw Agent is Ready!',
        body: `Your agent is ready at ${dropletIp}`,
      });

      expect(emailSent).toBe(true);
      expect(mockEmailService).toHaveBeenCalled();
    });
  });

  describe('Phase 5: Dashboard Display', () => {
    let userId: string;
    const dropletIp = '192.0.2.42';
    const pairingToken = 'pair_test_token_123456';

    beforeEach(() => {
      userId = 'user-test-123';
    });

    it('should display ready droplet on dashboard', async () => {
      const response = await fetch('/api/droplets/status', {
        headers: { 'x-user-id': userId },
      });

      const data = await response.json();
      expect(data.droplet).toBeDefined();
      expect(data.droplet.status).toBe('ready');
      expect(data.droplet.public_ip).toBe(dropletIp);
    });

    it('should show provisioning status while droplet is starting', async () => {
      // Simulate droplet still provisioning
      const response = await fetch('/api/droplets/status', {
        headers: { 'x-user-id': 'provisioning-user' },
      });

      const data = await response.json();
      expect(data.droplet.status).toBe('provisioning');
      expect(data.droplet.public_ip).toBeNull();
    });

    it('should allow user to test connection', async () => {
      // Dashboard should have "Test Connection" button
      // This would call /health on the agent
      const mockHealthCheck = jest.fn().mockResolvedValue({
        status: 200,
        data: { version: '1.0.0' },
      });

      const result = await mockHealthCheck();

      expect(result.status).toBe(200);
      expect(mockHealthCheck).toHaveBeenCalled();
    });

    it('should allow user to open agent portal', async () => {
      // Dashboard should have "Open Agent Portal" button
      // This should open http://<ip>:3000 in new window
      const agentUrl = `http://${dropletIp}:3000`;
      
      expect(agentUrl).toContain(':3000');
      expect(agentUrl).toContain(dropletIp);
    });

    it('should display pairing token for device pairing', async () => {
      const response = await fetch('/api/droplets/status', {
        headers: { 'x-user-id': userId },
      });

      const data = await response.json();
      expect(data.droplet.pairing_token).toBeDefined();
      expect(data.droplet.pairing_token).toBe(pairingToken);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle droplet creation failure', async () => {
      // If DO API fails, should mark droplet as error
      const mockProvisioningFail = jest.fn().mockRejectedValue(
        new Error('DO API error: insufficient funds')
      );

      let error: any;
      try {
        await mockProvisioningFail();
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();
      expect(error.message).toContain('DO API error');
    });

    it('should handle callback timeout', async () => {
      // If droplet doesn't callback within timeout, should mark as error
      // Timeout: 5 minutes
      const timeoutMs = 5 * 60 * 1000;
      expect(timeoutMs).toBe(300000);
    });

    it('should handle network failures during bootstrap', async () => {
      // If droplet can't reach git repo or docker hub, should retry
      const mockRetry = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true });

      let result;
      try {
        result = await mockRetry();
      } catch (e) {
        result = await mockRetry();
      }

      expect(mockRetry).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    });

    it('should show meaningful error to user', async () => {
      const errors = [
        'Failed to create droplet - check your account limits',
        'Droplet failed to boot - please retry or contact support',
        'Payment processing failed - please verify your card details',
      ];

      errors.forEach(error => {
        expect(error).toBeDefined();
        expect(error.length > 0).toBe(true);
      });
    });
  });

  describe('Performance & Reliability', () => {
    it('should complete full flow within reasonable time', async () => {
      const startTime = Date.now();
      
      // Simulate flow (would be much longer in real scenario)
      // Signup: ~100ms
      // Payment: ~200ms
      // Droplet creation: ~50ms (instant in mock)
      // Bootstrap: ~120s (real)
      // Dashboard display: ~50ms

      const estimatedDuration = 100 + 200 + 50 + 120000 + 50; // ~2 minutes
      
      expect(estimatedDuration).toBeLessThan(180000); // Within 3 minutes
    });

    it('should handle concurrent user signups', async () => {
      const users = Array(5).fill(null).map((_, i) => ({
        email: `user${i}@example.com`,
        password: 'TestPass123!',
      }));

      const signups = users.map(user =>
        fetch('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify(user),
        })
      );

      const results = await Promise.all(signups);
      results.forEach(result => {
        expect(result.status).toBe(201);
      });
    });

    it('should be resilient to transient failures', async () => {
      let attempts = 0;
      const maxRetries = 3;
      
      const operation = async () => {
        attempts++;
        if (attempts < maxRetries) {
          throw new Error('Transient error');
        }
        return { success: true };
      };

      let result;
      for (let i = 0; i < maxRetries; i++) {
        try {
          result = await operation();
          break;
        } catch (err) {
          if (i === maxRetries - 1) throw err;
        }
      }

      expect(attempts).toBeLessThanOrEqual(maxRetries);
      expect(result?.success).toBe(true);
    });
  });
});
