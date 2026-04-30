/**
 * lib/droplet-provisioner.ts
 * Provisions new OpenClaw instances on DigitalOcean droplets
 * Triggered by Stripe webhook when user upgrades subscription
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface DropletConfig {
  userId: string;
  tier: "starter" | "pro";
  email: string;
  apiKey: string;
}

interface DropletResponse {
  droplet: {
    id: number;
    name: string;
    memory: number;
    vcpus: number;
    status: string;
    networks: {
      v4: Array<{
        ip_address: string;
        netmask: string;
        gateway: string;
        type: string;
      }>;
    };
  };
}

/**
 * Generate user data script for droplet initialization
 * Injects OpenClaw config and starts the agent
 */
function generateUserDataScript(config: DropletConfig): string {
  const opencrawlConfig = {
    agent: {
      name: `laverdi-${config.userId.slice(0, 8)}`,
    },
    gateway: {
      port: 18789,
      bind: "0.0.0.0",
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    model: {
      primary:
        config.tier === "pro"
          ? "anthropic/claude-opus-4-6"
          : "anthropic/claude-sonnet-4-6",
    },
  };

  return `#!/bin/bash
set -e

# Update system
apt-get update
apt-get upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install OpenClaw
npm install -g openclaw

# Create openclaw config directory
mkdir -p /root/.openclaw

# Write openclaw.json
cat > /root/.openclaw/openclaw.json << 'EOF'
${JSON.stringify(opencrawlConfig, null, 2)}
EOF

# Write environment file
cat > /root/.openclaw/.env << 'EOF'
SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL}
SUPABASE_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY}
USER_ID=${config.userId}
USER_EMAIL=${config.email}
TIER=${config.tier}
API_KEY=${config.apiKey}
EOF

# Start OpenClaw gateway
openclaw gateway --port 18789 &

# Health check
sleep 10
curl -f http://localhost:18789/status || exit 1

echo "OpenClaw provisioned successfully for user ${config.userId}"
`;
}

/**
 * Create a new droplet on DigitalOcean
 */
export async function createUserDroplet(config: DropletConfig): Promise<{
  dropletId: number;
  ipAddress: string;
  status: string;
}> {
  const doToken = process.env.DIGITALOCEAN_API_KEY;
  if (!doToken) {
    throw new Error("DIGITALOCEAN_API_KEY not set");
  }

  // Determine droplet size based on tier
  const size = config.tier === "pro" ? "s-2vcpu-4gb" : "s-1vcpu-2gb"; // Starter: 2GB, Pro: 4GB
  const name = `openclaw-${config.userId.slice(0, 8)}-${Date.now()}`;

  const dropletPayload = {
    name,
    region: "sfo3", // San Francisco region
    size,
    image: "ubuntu-22-04-x64", // Ubuntu 22.04
    user_data: generateUserDataScript(config),
    backups: false,
    ipv6: true,
    monitoring: true,
    tags: ["laverdi", `tier-${config.tier}`, `user-${config.userId}`],
  };

  const response = await fetch("https://api.digitalocean.com/v2/droplets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${doToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dropletPayload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Failed to create droplet: ${error.message || response.statusText}`
    );
  }

  const data = (await response.json()) as DropletResponse;
  const ipAddress = data.droplet.networks.v4.find(
    (net) => net.type === "public"
  )?.ip_address;

  if (!ipAddress) {
    throw new Error("No public IP assigned to droplet");
  }

  return {
    dropletId: data.droplet.id,
    ipAddress,
    status: data.droplet.status,
  };
}

/**
 * Delete a user's droplet when subscription is cancelled
 */
export async function deleteUserDroplet(dropletId: number): Promise<void> {
  const doToken = process.env.DIGITALOCEAN_API_KEY;
  if (!doToken) {
    throw new Error("DIGITALOCEAN_API_KEY not set");
  }

  const response = await fetch(
    `https://api.digitalocean.com/v2/droplets/${dropletId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${doToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.json();
    throw new Error(
      `Failed to delete droplet: ${error.message || response.statusText}`
    );
  }
}

/**
 * Get droplet status
 */
export async function getDropletStatus(dropletId: number): Promise<{
  status: string;
  ipAddress: string;
}> {
  const doToken = process.env.DIGITALOCEAN_API_KEY;
  if (!doToken) {
    throw new Error("DIGITALOCEAN_API_KEY not set");
  }

  const response = await fetch(
    `https://api.digitalocean.com/v2/droplets/${dropletId}`,
    {
      headers: {
        Authorization: `Bearer ${doToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get droplet status: ${response.statusText}`);
  }

  const data = (await response.json()) as DropletResponse;
  const ipAddress = data.droplet.networks.v4.find(
    (net) => net.type === "public"
  )?.ip_address;

  return {
    status: data.droplet.status,
    ipAddress: ipAddress || "",
  };
}

/**
 * Store droplet info in database
 */
export async function storeDropletInfo(
  userId: string,
  dropletId: number,
  ipAddress: string,
  tier: "starter" | "pro"
): Promise<void> {
  const { error } = await supabase.from("user_droplets").insert({
    user_id: userId,
    droplet_id: dropletId,
    ip_address: ipAddress,
    tier,
    status: "provisioning",
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to store droplet info: ${error.message}`);
  }
}

/**
 * Update droplet status
 */
export async function updateDropletStatus(
  dropletId: number,
  status: "provisioning" | "active" | "error",
  errorMessage?: string
): Promise<void> {
  const { error } = await supabase
    .from("user_droplets")
    .update({
      status,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("droplet_id", dropletId);

  if (error) {
    throw new Error(`Failed to update droplet status: ${error.message}`);
  }
}

/**
 * Get user's droplet info
 */
export async function getUserDroplet(userId: string): Promise<{
  dropletId: number;
  ipAddress: string;
  status: string;
} | null> {
  const { data, error } = await supabase
    .from("user_droplets")
    .select("droplet_id, ip_address, status")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found
    throw new Error(`Failed to get droplet: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    dropletId: data.droplet_id,
    ipAddress: data.ip_address,
    status: data.status,
  };
}
