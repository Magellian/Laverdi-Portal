# Test minimal insert
$url = "https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/instances"
$headers = @{
    "apikey" = "REDACTED_SUPABASE_SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    user_id = "390e5c8d-bbda-4167-84af-8c87e829127a"
    droplet_id = 12345
    status = "ready"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $url -Method POST -Headers $headers -Body $body -UseBasicParsing
    Write-Host "Success:" $response.StatusCode
    Write-Host $response.Content
} catch {
    Write-Host "Error Status:" $_.Exception.Response.StatusCode
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $content = $reader.ReadToEnd()
        Write-Host "Response:"
        Write-Host $content
        $reader.Close()
    } catch {
        Write-Host "Could not read response"
    }
}
