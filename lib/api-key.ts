import { v4 as uuidv4 } from 'uuid'

export function generateApiKey(): string {
  // Generate a formatted API key: lav_<random>
  const random = uuidv4().replace(/-/g, '').substring(0, 32)
  return `lav_${random}`
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '*'.repeat(key.length)
  return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4)
}

export function validateApiKeyFormat(key: string): boolean {
  return /^lav_[a-zA-Z0-9]{32}$/.test(key)
}
