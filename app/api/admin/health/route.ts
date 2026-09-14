import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function getDiskSpace(): Promise<string> {
  try {
    const { stdout } = await execAsync(
      "df -h / | tail -1 | awk '{print $3 \"/\" $2 \" (\" $5 \")\"}'"
    )
    return stdout.trim() || 'unknown'
  } catch {
    return 'unknown'
  }
}

async function getDockerStatus(): Promise<string> {
  try {
    const { stdout } = await execAsync(
      "docker ps --format '{{.Names}}: {{.Status}}' | head -10"
    )
    return stdout.trim() || 'no containers'
  } catch {
    return 'unknown'
  }
}

async function getSSLExpiry(): Promise<string> {
  try {
    const { stdout } = await execAsync(
      'openssl s_client -connect laverdi.tech:443 -servername laverdi.tech </dev/null 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2'
    )
    return stdout.trim() || 'unknown'
  } catch {
    return 'unknown'
  }
}

export async function GET() {
  const [disk, docker, ssl] = await Promise.all([
    getDiskSpace(),
    getDockerStatus(),
    getSSLExpiry(),
  ])

  return Response.json({ disk, docker, ssl })
}
