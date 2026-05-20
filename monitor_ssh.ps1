# Monitor SSH connection and deploy Telegram when available
param(
    [int]$CheckInterval = 30,
    [int]$MaxAttempts = 120
)

$attempt = 0
$maxAttempts = $MaxAttempts
$checkInterval = $CheckInterval
$sshHost = "66.42.70.66"
$sshUser = "root"

Write-Host "🔍 Monitoring SSH connection to $sshUser@$sshHost"
Write-Host "Check interval: ${checkInterval}s | Max attempts: $maxAttempts"
Write-Host ""

while ($attempt -lt $maxAttempts) {
    $attempt++
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    Write-Host "[$timestamp] Attempt $attempt/$maxAttempts: Testing SSH connection..." -ForegroundColor Yellow
    
    try {
        # Test SSH connection with timeout
        $testCmd = @"
`$proc = Start-Process -FilePath ssh `
  -ArgumentList "-o StrictHostKeyChecking=no -o ConnectTimeout=5 $sshUser@$sshHost 'echo SSH_OK'" `
  -NoNewWindow -RedirectStandardOutput output.txt -PassThru -Wait -TimeoutSec 10

Get-Content output.txt -ErrorAction SilentlyContinue | Select-String "SSH_OK"
"@
        
        $result = powershell.exe -NoProfile -Command $testCmd -ErrorAction SilentlyContinue
        
        if ($result -match "SSH_OK") {
            Write-Host "[$timestamp] ✅ SSH CONNECTION STABLE!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🚀 ENGAGING DEPLOYMENT" -ForegroundColor Green
            Write-Host "=================================================="
            Write-Host ""
            
            # SSH is stable, now deploy
            & "C:\Users\chris\.openclaw\workspace\deploy_telegram_via_ssh.ps1"
            
            exit 0
        }
    }
    catch {
        # Connection failed, continue monitoring
    }
    
    Write-Host "[$timestamp] ⏳ Connection unavailable. Retrying in ${checkInterval}s..." -ForegroundColor Gray
    
    Start-Sleep -Seconds $checkInterval
}

Write-Host ""
Write-Host "❌ SSH connection never became stable after $maxAttempts attempts" -ForegroundColor Red
Write-Host "Manual deployment required. Files are ready in: C:\Users\chris\.openclaw\workspace\""
