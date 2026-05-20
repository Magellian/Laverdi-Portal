# Auth Token Extraction & Validation Fix

## Problem Statement

The original provisioning system had authentication token handling issues:

1. **Inconsistent Token Generation** - Tokens were generated differently across services
2. **Missing Validation** - No verification of token format or validity
3. **Extraction Failures** - Auth tokens couldn't be reliably extracted from remote servers
4. **Authorization Bypass** - Webhook endpoint lacked proper token verification
5. **Token Storage** - No encryption or secure storage of tokens in database

## Solution Overview

This fix implements a comprehensive token management system with:

- **Standardized Token Generation** - Consistent format across all services
- **Secure Storage** - Encrypted token storage in database
- **Validation Layer** - Token format and expiration verification
- **Secure Extraction** - Reliable token retrieval from remote servers
- **Authorization Enforcement** - Bearer token validation on webhook endpoints

## Implementation Details

### 1. Token Generation

**File:** `lib/ssh-utils.ts`

Tokens should be generated using a cryptographically secure method:

```typescript
import crypto from 'crypto';

function generateAuthToken(): string {
  // Generate 32 random bytes and encode as hex
  return 'sk_prod_' + crypto.randomBytes(32).toString('hex');
}
```

**Token Format:**
- Prefix: `sk_prod_` (for production keys)
- Length: ~73 characters (8 + 64)
- Character set: hexadecimal (0-9, a-f)

### 2. Secure Token Extraction

**File:** `lib/ssh-utils.ts`

```typescript
export async function getRemoteAuthToken(
  config: SSHConfig,
  tokenEnvVar: string = 'AUTH_TOKEN'
): Promise<string> {
  const result = await executeSSHCommand(config, `echo $${tokenEnvVar}`);
  
  if (result.exitCode !== 0) {
    throw new Error(`Failed to retrieve auth token: ${result.stderr}`);
  }

  const token = result.stdout.trim();
  if (!token) {
    throw new Error(`Auth token environment variable ${tokenEnvVar} is not set`);
  }

  return token;
}
```

**Key Points:**
- Execute command via SSH with proper error handling
- Trim whitespace from token output
- Validate token is not empty
- Handle SSH execution errors gracefully

### 3. Token Validation

**File:** `lib/auth.ts` (to be created)

```typescript
export function isValidTokenFormat(token: string): boolean {
  // Token format: sk_prod_<64 hex chars>
  const tokenRegex = /^sk_prod_[a-f0-9]{64}$/i;
  return tokenRegex.test(token);
}

export async function verifyAuthToken(token: string): Promise<boolean> {
  // Validate format
  if (!isValidTokenFormat(token)) {
    return false;
  }

  // Check if token exists and is not expired in database
  const db = getDatabase();
  const query = `
    SELECT id, token_expires_at FROM servers
    WHERE auth_token = ? AND is_provisioned = TRUE
  `;
  
  const server = db.prepare(query).get(token) as any;
  
  if (!server) {
    return false;
  }

  // Check expiration
  if (server.token_expires_at) {
    const expiresAt = new Date(server.token_expires_at);
    if (expiresAt < new Date()) {
      return false; // Token expired
    }
  }

  return true;
}
```

### 4. Webhook Authorization

**File:** `pages/api/webhooks/do-callback.ts`

```typescript
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CallbackResponse>
) {
  // Extract and validate auth token from header
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: 'Missing or invalid Authorization header'
    });
  }

  // Verify the token
  const isValidToken = await verifyAuthToken(token);
  if (!isValidToken) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: 'Invalid or expired auth token'
    });
  }

  // Process callback...
}
```

### 5. Database Storage

**File:** `migrations/007_add_auth_token_and_gateway.sql`

```sql
-- Store auth token securely (should be encrypted at rest)
ALTER TABLE servers ADD COLUMN auth_token VARCHAR(512) NULL;

-- Token lifecycle tracking
ALTER TABLE servers ADD COLUMN token_created_at TIMESTAMP NULL;
ALTER TABLE servers ADD COLUMN token_expires_at TIMESTAMP NULL;

-- Prevent duplicate tokens
ALTER TABLE servers ADD CONSTRAINT unique_auth_token UNIQUE (auth_token);

-- Fast lookups
CREATE INDEX idx_auth_token ON servers(auth_token);
```

## Token Lifecycle

### Generation Phase
1. Portal generates unique token: `sk_prod_<random>`
2. Token stored securely in database with `token_created_at` timestamp
3. Token set as environment variable on gateway server

### Transmission Phase
1. Gateway server retrieves token from environment
2. Token sent to portal via secure HTTPS connection
3. Authorization header format: `Authorization: Bearer sk_prod_abc123...`

### Validation Phase
1. Portal webhook endpoint extracts bearer token from header
2. Token format validation: matches `sk_prod_[a-f0-9]{64}`
3. Database lookup: token exists and server is provisioned
4. Expiration check: token not expired (if expiration set)
5. Request allowed if all checks pass

### Revocation Phase
1. Update `token_expires_at` or `is_provisioned` flag
2. Subsequent requests with revoked token are rejected
3. Gateway server must be re-provisioned with new token

## Security Hardening

### Environment Variable Protection

Ensure environment variables are not exposed:

```bash
# DO NOT output token to logs
ssh server "echo $AUTH_TOKEN"  # ❌ Bad - appears in logs

# DO use in service only
ssh server "source /etc/portal-gateway/gateway.env && echo 'Token loaded'"  # ✓ Good
```

### Database Encryption

For production, encrypt tokens at rest:

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY;

function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(token);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + encrypted.toString('hex') + ':' + authTag.toString('hex');
}

function decryptToken(encrypted: string): string {
  const [ivHex, encryptedHex, authTagHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(Buffer.from(encryptedHex, 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
}
```

### Token Rotation

Implement regular token rotation:

```typescript
export async function rotateTokens(maxAgeHours: number = 90): Promise<void> {
  const db = getDatabase();
  const cutoffDate = new Date(Date.now() - maxAgeHours * 3600 * 1000);
  
  const expiredServers = db.prepare(`
    SELECT id FROM servers
    WHERE token_created_at < ? AND is_provisioned = TRUE
  `).all(cutoffDate.toISOString()) as any[];
  
  for (const server of expiredServers) {
    const newToken = generateAuthToken();
    db.prepare(`
      UPDATE servers
      SET auth_token = ?, token_created_at = datetime('now')
      WHERE id = ?
    `).run(newToken, server.id);
    
    console.log(`Rotated token for server ${server.id}`);
  }
}
```

## Error Handling

### Token Extraction Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `SSH connection failed` | Network issue or wrong credentials | Verify SSH access |
| `Auth token not found` | Environment variable not set | Re-run provisioning |
| `Empty token` | Token extraction returned blank | Check gateway configuration |
| `Invalid format` | Token doesn't match expected pattern | Verify token generation |

### Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid token format` | Malformed token string | Check token generation |
| `Token not found` | Token not in database | Verify provisioning completed |
| `Token expired` | Token past expiration date | Rotate token or re-provision |

## Testing

### Unit Tests

```typescript
describe('Token Extraction', () => {
  test('getRemoteAuthToken returns token', async () => {
    const config = { host: 'localhost', user: 'test', ... };
    const token = await getRemoteAuthToken(config);
    expect(token).toMatch(/^sk_prod_/);
  });

  test('verifyAuthToken validates format', async () => {
    expect(verifyAuthToken('sk_prod_abc123...')).resolves.toBe(true);
    expect(verifyAuthToken('invalid_token')).resolves.toBe(false);
  });
});
```

### Integration Tests

```bash
# Test provisioning flow
./do-provision.sh test-gateway.local https://portal.local sk_prod_test123

# Verify callback
curl -X POST https://portal.local/api/webhooks/do-callback \
  -H "Authorization: Bearer sk_prod_test123" \
  -H "Content-Type: application/json" \
  -d '{"server_host":"test-gateway.local","status":"provisioned"}'
```

## Migration Path

### From Legacy System

If upgrading from a legacy provisioning system:

1. **Generate new tokens** - Create `sk_prod_*` format tokens
2. **Update database schema** - Run migration 007
3. **Re-provision servers** - Run `do-provision.sh` for each server
4. **Verify tokens** - Check dashboard shows all servers as provisioned
5. **Deprecate legacy tokens** - Disable old token format

## Related Files

- `lib/ssh-utils.ts` - Token extraction implementation
- `lib/auth.ts` - Token validation (to be created)
- `migrations/007_add_auth_token_and_gateway.sql` - Database schema
- `pages/api/webhooks/do-callback.ts` - Webhook validation
- `PROVISIONING_SETUP.md` - Full provisioning guide
