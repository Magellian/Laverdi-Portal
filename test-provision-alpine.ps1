# Test with alpine:latest (simpler, guaranteed to exist)
$url = "http://64.23.142.154:8000/api/provision-container"
$headers = @{
    "Authorization" = "Bearer vps_admin_token_2026"
    "Content-Type" = "application/json"
}

$body = @{
    userId = "390e5c8d-bbda-4167-84af-8c87e829127a"
    containerName = "openclaw-chris-test-$(Get-Random)"
    pairingToken = "abc123def456"
    callbackUrl = "https://laverdi.tech/api/instance-ready"
    webhookSecret = "test-secret"
} | ConvertTo-Json

Write-Host "Testing container provisioning..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $url -Method POST -Headers $headers -Body $body -TimeoutSec 30
    Write-Host "✅ Provisioning succeeded!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)"
    $data = $response.Content | ConvertFrom-Json
    Write-Host "Container ID: $($data.containerId)"
    Write-Host "IP Address: $($data.ipAddress)"
    Write-Host "Port: $($data.port)"
    Write-Host "Access URL: $($data.accessUrl)"
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
