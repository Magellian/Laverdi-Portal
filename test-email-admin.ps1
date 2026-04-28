Write-Host "🧪 Testing Email Admin Endpoints" -ForegroundColor Cyan
Write-Host "════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$adminToken = "admin-token-change-me-in-production"

# Test 1: Get current settings
Write-Host "1️⃣  Getting current email settings..." -ForegroundColor Yellow
$response = curl -s -X GET "$baseUrl/api/admin/email-settings" `
  -H "Authorization: Bearer $adminToken" | ConvertFrom-Json

if ($response.success) {
  Write-Host "✅ Settings retrieved:" -ForegroundColor Green
  Write-Host "   Email Enabled: $($response.settings.emailEnabled)"
  Write-Host "   Provider: $($response.settings.provider)"
  Write-Host "   From: $($response.settings.fromEmail)"
  Write-Host "   Test Mode: $($response.settings.testMode)"
} else {
  Write-Host "❌ Failed: $($response.error)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Toggle email off
Write-Host "2️⃣  Disabling email..." -ForegroundColor Yellow
$response = curl -s -X POST "$baseUrl/api/admin/email-settings" `
  -H "Authorization: Bearer $adminToken" `
  -H "Content-Type: application/json" `
  -d '{"emailEnabled": false}' | ConvertFrom-Json

if ($response.success) {
  Write-Host "✅ Email disabled" -ForegroundColor Green
  Write-Host "   Email Enabled: $($response.settings.emailEnabled)"
} else {
  Write-Host "❌ Failed: $($response.error)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Send test email (should be disabled, so just logged)
Write-Host "3️⃣  Sending test email (with email disabled)..." -ForegroundColor Yellow
$response = curl -s -X POST "$baseUrl/api/admin/send-test-email" `
  -H "Authorization: Bearer $adminToken" `
  -H "Content-Type: application/json" `
  -d '{"to":"test@example.com"}' | ConvertFrom-Json

if ($response.success) {
  Write-Host "✅ $($response.message)" -ForegroundColor Green
} else {
  Write-Host "❌ Failed: $($response.error)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Toggle email back on
Write-Host "4️⃣  Re-enabling email..." -ForegroundColor Yellow
$response = curl -s -X POST "$baseUrl/api/admin/email-settings" `
  -H "Authorization: Bearer $adminToken" `
  -H "Content-Type: application/json" `
  -d '{"emailEnabled": true}' | ConvertFrom-Json

if ($response.success) {
  Write-Host "✅ Email enabled" -ForegroundColor Green
  Write-Host "   Email Enabled: $($response.settings.emailEnabled)"
} else {
  Write-Host "❌ Failed: $($response.error)" -ForegroundColor Red
}

Write-Host ""
Write-Host "════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ Email admin tests complete!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Admin Dashboard: http://localhost:3000/admin/email-test" -ForegroundColor Blue
