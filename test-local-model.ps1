# Test LM Studio connectivity and model availability
Write-Host "Testing LM Studio at 192.168.50.151:11434..."

# Test health
try {
    $health = Invoke-WebRequest -Uri "http://192.168.50.151:11434/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Health check: $($health.StatusCode)"
} catch {
    Write-Host "✗ Health check failed: $_"
    exit 1
}

# Test models list
try {
    $models = Invoke-WebRequest -Uri "http://192.168.50.151:11434/v1/models" -UseBasicParsing -TimeoutSec 5 | ConvertFrom-Json
    Write-Host "✓ Available models:"
    $models.data | ForEach-Object { Write-Host "  - $($_.id)" }
} catch {
    Write-Host "✗ Models list failed: $_"
    exit 1
}

# Test simple completion (no streaming, timeout 60s)
try {
    Write-Host "`nTesting chat completion..."
    $body = @{
        model = "google/gemma-4-26b-a4b"
        messages = @(@{role="user"; content="respond with 'hello world' only"})
        max_tokens = 5
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "http://192.168.50.151:11434/v1/chat/completions" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -UseBasicParsing `
        -TimeoutSec 120 | ConvertFrom-Json
    
    $message = $response.choices[0].message.content
    Write-Host "✓ Chat response: '$message'"
} catch {
    Write-Host "✗ Chat completion failed: $_"
    exit 1
}

Write-Host "`n✓ All tests passed! LM Studio is ready."
