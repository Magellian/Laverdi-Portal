$url = "http://64.23.142.154:8000/api/provision-container"
$headers = @{
    "Authorization" = "Bearer vps_admin_token_2026"
    "Content-Type" = "application/json"
}

$body = @{
    userId = "390e5c8d-bbda-4167-84af-8c87e829127a"
    containerName = "openclaw-chris-1"
    pairingToken = "abc123def456"
    callbackUrl = "https://laverdi.tech/api/instance-ready"
    webhookSecret = "test-secret"
} | ConvertTo-Json

Write-Host "Sending provision request..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Gray
Write-Host "Body: $body" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri $url -Method POST -Headers $headers -Body $body -TimeoutSec 30
    Write-Host "Success! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Response: $($reader.ReadToEnd())" -ForegroundColor Red
    }
}
