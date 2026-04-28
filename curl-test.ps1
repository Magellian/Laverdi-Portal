# Laverdi Portal API Test using curl
# Test the admin upgrade endpoint

Write-Host "🧪 Laverdi Portal API Test" -ForegroundColor Cyan
Write-Host "═" * 50 -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$adminToken = "admin-token-change-me-in-production"
$testEmail = "test-$(Get-Date -UFormat %s)@laverdi-test.com"

Write-Host "`n📧 Test email: $testEmail" -ForegroundColor Blue
Write-Host "🔐 Admin token: (using default)" -ForegroundColor Blue

# Test 1: Health check
Write-Host "`n1️⃣  Testing portal health..." -ForegroundColor Yellow
$response = curl -s -X POST "$baseUrl/api/admin/upgrade-user" `
  -H "Authorization: Bearer invalid-token" `
  -H "Content-Type: application/json" `
  -d "{`"email`":`"test@example.com`",`"tier`":`"starter`"}"

$json = $response | ConvertFrom-Json
if ($json.error) {
  Write-Host "✅ Portal is responding correctly" -ForegroundColor Green
  Write-Host "   Error (expected): $($json.error)" -ForegroundColor Gray
} else {
  Write-Host "❌ Unexpected response" -ForegroundColor Red
  Write-Host $response
}

# Test 2: Token validation
Write-Host "`n2️⃣  Testing token validation..." -ForegroundColor Yellow
$response = curl -s -X POST "$baseUrl/api/admin/upgrade-user" `
  -H "Content-Type: application/json" `
  -d "{`"email`":`"$testEmail`",`"tier`":`"starter`"}"

$json = $response | ConvertFrom-Json
if ($json.error -and $json.error.Contains("Missing authorization")) {
  Write-Host "✅ Token validation working" -ForegroundColor Green
  Write-Host "   Response: $($json.error)" -ForegroundColor Gray
}

# Test 3: Valid token with non-existent user
Write-Host "`n3️⃣  Testing with valid token (non-existent user)..." -ForegroundColor Yellow
$response = curl -s -X POST "$baseUrl/api/admin/upgrade-user" `
  -H "Authorization: Bearer $adminToken" `
  -H "Content-Type: application/json" `
  -d "{`"email`":`"$testEmail`",`"tier`":`"starter`"}`

$json = $response | ConvertFrom-Json
if ($json.error -and $json.error.Contains("User not found")) {
  Write-Host "✅ Admin endpoint validating user existence" -ForegroundColor Green
  Write-Host "   Response: $($json.error)" -ForegroundColor Gray
} else {
  Write-Host "⚠️  Unexpected response" -ForegroundColor Yellow
  Write-Host $response | ConvertFrom-Json | Format-List
}

Write-Host "`n✨ Tests completed!" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Blue
Write-Host "1. Create a user via signup: http://localhost:3000/signup" -ForegroundColor Gray
Write-Host "2. Once user exists, run admin upgrade with their email:" -ForegroundColor Gray
Write-Host "3. curl -X POST http://localhost:3000/api/admin/upgrade-user \" -ForegroundColor Gray
Write-Host "     -H 'Authorization: Bearer admin-token-change-me-in-production' \" -ForegroundColor Gray
Write-Host "     -H 'Content-Type: application/json' \" -ForegroundColor Gray
Write-Host "     -d '{`"email`":`"USER_EMAIL`",`"tier`":`"starter`"}'" -ForegroundColor Gray
