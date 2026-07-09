import { prisma } from '@/lib/prisma'
import { getTierLimits } from '@/lib/stripe'
import crypto from 'crypto'

// Port range for user agent containers (avoid conflicts with system services)
const PORT_RANGE_START = 9000
const PORT_RANGE_END = 9999

/**
 * Allocate the next available port for a new agent container.
 * Checks existing instances in DB to avoid collisions.
 */
async function allocatePort(): Promise<number> {
  const usedPorts = await prisma.instance.findMany({
    where: { status: { in: ['provisioning', 'running', 'stopped'] } },
    select: { port: true },
  })

  const usedSet = new Set(usedPorts.map((i) => i.port).filter(Boolean))

  for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
    if (!usedSet.has(port)) return port
  }

  throw new Error('No available ports — maximum capacity reached')
}

/**
 * Generate a secure pairing token for OpenClaw device auto-approval.
 */
function generatePairingToken(): string {
  return crypto.randomBytes(24).toString('hex')
}

/**
 * Generate an API key for the user to access their agent externally.
 */
export function generateApiKey(): string {
  return `lv_${crypto.randomBytes(32).toString('hex')}`
}

/**
 * Get the model configuration for a given subscription tier.
 */
function getModelConfig(tier: string) {
  switch (tier) {
    case 'enterprise':
      return {
        primary: 'zai-org/GLM-5.1-FP8',
        fallback: 'moonshotai/Kimi-K2.6',
      }
    case 'pro':
      return {
        primary: 'moonshotai/Kimi-K2.6',
        fallback: 'deepseek-ai/DeepSeek-V4-Flash',
      }
    case 'starter':
    default:
      return {
        primary: 'deepseek-ai/DeepSeek-V4-Flash',
        fallback: 'deepseek-ai/DeepSeek-V4-Flash',
      }
  }
}

export interface ProvisionResult {
  instanceId: string
  port: number
  pairingToken: string
  apiKey: string
  status: 'provisioning' | 'error'
  error?: string
  errorType?: 'limit_reached' | 'no_ports' | 'unknown'
}

/**
 * Provision a new OpenClaw agent instance for a user.
 *
 * This creates the DB record and returns the config needed to
 * spin up the Docker container on the VPS. The actual Docker commands
 * run server-side via the deploy API or SSH.
 */
export async function provisionAgent(
  userId: string,
  tier: string,
  workspaceId?: string
): Promise<ProvisionResult> {
  // Check tier limits
  const limits = getTierLimits(tier)
  const currentCount = await prisma.instance.count({
    where: {
      ownerId: userId,
      status: { in: ['provisioning', 'running'] },
    },
  })

  if (limits.maxAgents > 0 && currentCount >= limits.maxAgents) {
    return {
      instanceId: '',
      port: 0,
      pairingToken: '',
      apiKey: '',
      status: 'error',
      errorType: 'limit_reached',
      error: `Agent limit reached (${currentCount}/${limits.maxAgents}). Upgrade your plan for more.`,
    }
  }

  const port = await allocatePort()
  const pairingToken = generatePairingToken()
  const apiKey = generateApiKey()
  const modelConfig = getModelConfig(tier)

  // Ensure user has a workspace + org (create default if needed)
  let targetWorkspaceId = workspaceId

  if (!targetWorkspaceId) {
    // Find or create default org + workspace
    let org = await prisma.organization.findFirst({
      where: { ownerId: userId },
    })

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: 'My Organization',
          ownerId: userId,
        },
      })
    }

    let workspace = await prisma.workspace.findFirst({
      where: { organizationId: org.id, ownerId: userId },
    })

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: 'Default',
          organizationId: org.id,
          ownerId: userId,
        },
      })
    }

    targetWorkspaceId = workspace.id
  }

  // Create the instance record
  const instance = await prisma.instance.create({
    data: {
      workspaceId: targetWorkspaceId,
      ownerId: userId,
      status: 'provisioning',
      port,
      pairingToken,
      apiKey,
      tier,
      modelPrimary: modelConfig.primary,
      modelFallback: modelConfig.fallback,
    },
  })

  return {
    instanceId: instance.id,
    port,
    pairingToken,
    apiKey,
    status: 'provisioning',
  }
}

/**
 * Generate the docker run command for a provisioned instance.
 * This is what runs on the VPS to actually start the container.
 */
export function generateDockerCommand(instance: {
  id: string
  port: number
  pairingToken: string
  modelPrimary: string
  modelFallback: string
  tier: string
}): string {
  const containerName = `openclaw-${instance.id}`
  const volumeName = `openclaw-data-${instance.id}`

  return [
    'docker run -d',
    `--name ${containerName}`,
    `--restart unless-stopped`,
    `-p 127.0.0.1:${instance.port}:18789`,
    `-v ${volumeName}:/root/.openclaw`,
    `-e OPENCLAW_MODEL_PRIMARY="${instance.modelPrimary}"`,
    `-e OPENCLAW_MODEL_FALLBACK="${instance.modelFallback}"`,
    `-e OPENCLAW_PAIRING_TOKEN="${instance.pairingToken}"`,
    `-e OPENCLAW_TIER="${instance.tier}"`,
    `laverdi/openclaw:latest`,
  ].join(' \\\n  ')
}

/**
 * Generate nginx location block for an instance.
 * Used when setting up per-instance routing.
 */
export function generateNginxConfig(instanceId: string, port: number): string {
  return `
# Agent instance: ${instanceId}
location /agent/${instanceId}/ {
    proxy_pass http://127.0.0.1:${port}/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
}
`.trim()
}

/**
 * Call the provisioner service to spin up the Hermes instance.
 * The provisioner runs on the same host at 127.0.0.1:9090.
 */
export async function callProvisioner(instance: {
  id: string
  port: number
  tier: string
  pairingToken: string
}) {
  const provisionerUrl = process.env.PROVISIONER_URL || 'http://127.0.0.1:9090'
  const secret = process.env.PROVISION_CALLBACK_SECRET || 'laverdi-callback-xK9m-2026'

  try {
    const res = await fetch(`${provisionerUrl}/provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
      },
      body: JSON.stringify({
        instanceId: instance.id,
        port: instance.port,
        tier: instance.tier,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error(`Provisioner error: ${JSON.stringify(err)}`)
      // Mark instance as error so user can retry
      await prisma.instance.update({
        where: { id: instance.id },
        data: { status: 'error' },
      })
      return false
    }

    const result = await res.json()
    console.log(`Provisioner result: ${JSON.stringify(result)}`)

    // Update instance with dashboard credentials
    await prisma.instance.update({
      where: { id: instance.id },
      data: {
        status: 'running',
        hermesAgentId: result.profile || null,
      },
    })

    return result
  } catch (err) {
    console.error(`Failed to call provisioner: ${err}`)
    // Mark instance as error instead of leaving it stuck in provisioning forever
    await prisma.instance.update({
      where: { id: instance.id },
      data: { status: 'error' },
    })
    return false
  }
}

/**
 * Mark an instance as running (called after Docker container is confirmed up).
 */
export async function markInstanceRunning(instanceId: string, containerId?: string) {
  await prisma.instance.update({
    where: { id: instanceId },
    data: {
      status: 'running',
      hermesAgentId: containerId || null,
    },
  })
}

/**
 * Mark an instance as stopped/error.
 */
export async function updateInstanceStatus(
  instanceId: string,
  status: 'stopped' | 'error',
  error?: string
) {
  await prisma.instance.update({
    where: { id: instanceId },
    data: { status },
  })
}

/**
 * Tear down an instance (mark for cleanup).
 */
export async function teardownInstance(instanceId: string) {
  await prisma.instance.update({
    where: { id: instanceId },
    data: { status: 'stopped' },
  })

  // Return the container name for Docker cleanup
  return `openclaw-${instanceId}`
}
