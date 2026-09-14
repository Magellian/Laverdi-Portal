// Simple embedded-secret cookie auth for admin panel.
// Separate from user NextAuth — admin is a single-operator concept.
//
// The cookie carries `timestamp.signature` where signature is an
// HMAC-SHA256 of the timestamp keyed by ADMIN_PASSWORD. The admin
// password itself never appears in the token, so a leaked cookie
// (XSS, logs, browser history) cannot be decoded back into the
// password the way a naive "encode the secret" scheme would allow.

import crypto from 'crypto'

const COOKIE_NAME = 'laverdi_admin_token'
const TOKEN_TTL = 24 * 60 * 60 // 24 hours

function getSecret(): string {
  return process.env.ADMIN_PASSWORD || ''
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url')
}

export function signAdminToken(): string {
  const ts = Math.floor(Date.now() / 1000).toString()
  return `${ts}.${sign(ts)}`
}

export function verifyAdminToken(token: string): boolean {
  try {
    if (!getSecret()) return false

    const dotIdx = token.lastIndexOf('.')
    if (dotIdx === -1) return false
    const ts = token.slice(0, dotIdx)
    const sig = token.slice(dotIdx + 1)

    const expected = sign(ts)
    const sigBuf = Buffer.from(sig)
    const expectedBuf = Buffer.from(expected)
    if (sigBuf.length !== expectedBuf.length) return false
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false

    const tsNum = parseInt(ts, 10)
    if (isNaN(tsNum)) return false
    return Math.floor(Date.now() / 1000) - tsNum <= TOKEN_TTL
  } catch {
    return false
  }
}

export { COOKIE_NAME, TOKEN_TTL }
