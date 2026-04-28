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

try {
    $response = Invoke-WebRequest -Uri $url -Method POST -Headers $headers -Body $body -TimeoutSec 30 -UseBasicParsing
    Write-Host "Success! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Error Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $fullError = $reader.ReadToEnd()
        Write-Host "Response Body:"
        Write-Host $fullError
        $reader.Close()
    } catch {
        Write-Host "Could not read error body"
    }
}
