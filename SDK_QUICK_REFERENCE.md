# Laverdi SDK - Quick Reference

## 🚀 Installation & Setup

```bash
# Install from npm
npm install @laverdi/api-sdk

# Import in your code
import { LaverdiClient } from '@laverdi/api-sdk'

# Initialize client
const client = new LaverdiClient({
  baseURL: 'https://api.laverdi.tech',
  token: 'your-jwt-token'
})
```

## 📍 API Methods at a Glance

### Authentication
```typescript
// OAuth callback (no token needed)
await client.auth.callback({ email, user_id })

// Create new user profile (no token needed)
const profile = await client.auth.createProfile({ userId, email })
// Returns: { success, apiKey?, message? }
```

### Admin - API Keys
```typescript
// Create new API key
const key = await client.admin.createApiKey({ user_id, name })
// Returns: { id, user_id, name, key, status, created_at }
```

### Admin - Billing
```typescript
// Get billing stats
const stats = await client.admin.getBillingStats()
// Returns: { total_paid_ytd, next_billing_date, invoices[] }
```

### Admin - Stats
```typescript
// Get dashboard statistics
const stats = await client.admin.getStats()
// Returns: { totalUsers, activeSubscriptions, estimatedMRR, totalRequests, avgRequestsPerDay }

// Get all users
const users = await client.admin.getUsers()
// Returns: User[]
```

### Admin - Account
```typescript
// Update settings (email, preferences, etc)
await client.admin.updateSettings({
  action: 'update_email' | 'verify_email' | 'update_preferences',
  new_email?: string,
  code?: string,
  preferences?: object
})

// Delete account (requires password)
await client.admin.deleteAccount({ password })
// Returns: { message }
```

### Stripe
```typescript
// Create checkout session
const session = await client.stripe.createCheckoutSession({ planId })
// Returns: { sessionId, url }
// Redirect user: window.location.href = session.url
```

### Webhooks
```typescript
// Handle DigitalOcean callback
await client.webhooks.handleDoCallback({ user_id, droplet_ip, status }, secret)
// Returns: { success, message }
```

## ⚙️ Configuration

```typescript
const client = new LaverdiClient({
  baseURL: 'https://api.laverdi.tech',    // Required
  token: 'jwt-token',                      // Optional
  timeout: 30000,                          // Optional (ms)
  debug: false                             // Optional
})

// Update token
client.setToken('new-token')

// Remove token
client.clearToken()

// Check if token is set
if (client.hasToken()) { /* ... */ }
```

## 🔐 Authentication

```typescript
// With Bearer token
const client = new LaverdiClient({
  baseURL: 'https://api.laverdi.tech',
  token: 'jwt-or-api-key'
})

// Set token after initialization
client.setToken(jwtToken)

// For public endpoints (no token needed)
const stats = await client.admin.getStats()
```

## ❌ Error Handling

```typescript
import { LaverdiError } from '@laverdi/api-sdk'

try {
  await client.admin.createApiKey({ user_id, name })
} catch (error) {
  if (error instanceof LaverdiError) {
    console.log(`HTTP ${error.statusCode}: ${error.errorResponse.error}`)
    
    if (error.statusCode === 401) console.log('Unauthorized')
    if (error.statusCode === 429) console.log('Rate limited')
    if (error.statusCode >= 500) console.log('Server error')
  }
}
```

## 📊 Common Patterns

### Get User's Billing Info
```typescript
const stats = await client.admin.getBillingStats()
console.log(`Paid YTD: $${(stats.total_paid_ytd / 100).toFixed(2)}`)
console.log(`Next Billing: ${stats.next_billing_date}`)
stats.invoices.forEach(inv => {
  console.log(`${inv.number}: $${(inv.amount / 100).toFixed(2)}`)
})
```

### Create Multiple API Keys
```typescript
const keys = await Promise.all([
  client.admin.createApiKey({ user_id, name: 'Production' }),
  client.admin.createApiKey({ user_id, name: 'Staging' }),
  client.admin.createApiKey({ user_id, name: 'Development' })
])

keys.forEach(key => {
  console.log(`${key.name}: ${key.key}`)
})
```

### Start Subscription
```typescript
// Create checkout session
const session = await client.stripe.createCheckoutSession({
  planId: 'price_pro_monthly'
})

// Redirect to Stripe
window.location.href = session.url
```

### Update User Email
```typescript
// Request email change
await client.admin.updateSettings({
  action: 'update_email',
  new_email: 'newemail@example.com'
})

// User receives verification email
// They use code to verify:
await client.admin.updateSettings({
  action: 'verify_email',
  code: '123456'
})
```

## 🔄 Retry Logic

SDK automatically retries transient failures:

```typescript
// Configure retry behavior
const options = {
  retries: 5,         // Max attempts (default: 3)
  retryDelay: 2000,   // Initial delay (default: 1000ms)
  timeout: 60000      // Request timeout (default: 30000ms)
}

// Retries apply to:
// ✅ Network errors
// ✅ 5xx server errors
// ✅ Timeouts
// ❌ 4xx client errors (not retried)
```

## 📱 Rate Limiting

```typescript
// Check remaining calls from response
const remaining = response.headers['X-RateLimit-Remaining']

// If rate limited:
if (error.statusCode === 429) {
  console.log('Rate limit exceeded')
  // Wait and retry after delay
  await delay(5000)
  // Try again
}
```

## 🧪 Testing

```bash
# Build TypeScript
npm run build

# Check for type errors
npx tsc --noEmit

# Lint code
npm run lint

# Run tests
npm test
```

## 📦 Publishing

```bash
# Update version in package.json
# "version": "1.0.1"

# Build
npm run build

# Test
npm test

# Publish
npm publish
```

## 📚 Documentation

- **Full Guide**: `README.md`
- **API Reference**: `openapi.json`
- **Development**: `CONTRIBUTING.md`
- **Examples**: `examples/` folder
  - `example-signup.ts` - OAuth flow
  - `example-api-keys.ts` - Key management
  - `example-billing.ts` - Billing flow

## 🆘 Common Issues

### 401 Unauthorized
- ❌ Token missing or invalid
- ✅ Set token: `client.setToken(jwtToken)`

### 429 Rate Limited
- ❌ Too many requests
- ✅ Wait and retry with exponential backoff

### 500 Server Error
- ❌ Server issue (temporary)
- ✅ SDK auto-retries with backoff

### TypeScript Errors
```bash
# Check for errors
npx tsc --noEmit

# Fix issues
npm run lint -- --fix
```

## 🔗 Resources

- GitHub: `https://github.com/laverdi/portal`
- npm: `@laverdi/api-sdk`
- Support: `support@laverdi.tech`

---

**Version**: 1.0.0 | **Updated**: 2024-04-17
