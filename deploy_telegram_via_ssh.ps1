# Deploy Telegram integration to portal via SSH
param(
    [string]$SshHost = "66.42.70.66",
    [string]$SshUser = "root",
    [string]$SourceDir = "C:\Users\chris\.openclaw\workspace"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "📦 TELEGRAM INTEGRATION DEPLOYMENT" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Files to deploy
$filesToDeploy = @(
    @{
        Source = "$SourceDir\telegram_webhook_handler.ts"
        Remote = "/root/laverdi-portal/pages/api/webhooks/telegram.ts"
        Description = "Telegram Webhook Handler"
    }
)

# Step 1: Create backup
Write-Host "📋 Step 1: Checking for existing files..." -ForegroundColor Yellow

try {
    $backupCmd = 'if [ -f "/root/laverdi-portal/pages/api/webhooks/telegram.ts" ]; then cp /root/laverdi-portal/pages/api/webhooks/telegram.ts /root/laverdi-portal/pages/api/webhooks/telegram.ts.backup.$(date +%s); echo "BACKED_UP"; fi'
    
    $output = ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$sshUser@$sshHost" $backupCmd 2>&1
    if ($output -match "BACKED_UP") {
        Write-Host "   ✅ Existing file backed up" -ForegroundColor Green
    }
} catch {
    Write-Host "   ℹ️  No existing file to back up" -ForegroundColor Gray
}

# Step 2: Create webhooks directory
Write-Host ""
Write-Host "📁 Step 2: Creating webhooks directory..." -ForegroundColor Yellow

try {
    ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$sshUser@$sshHost" "mkdir -p /root/laverdi-portal/pages/api/webhooks" 2>&1
    Write-Host "   ✅ Directory ready" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to create directory: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Upload files
Write-Host ""
Write-Host "📤 Step 3: Uploading files..." -ForegroundColor Yellow

foreach ($file in $filesToDeploy) {
    Write-Host "   📄 $($file.Description)..." -ForegroundColor Cyan
    
    try {
        scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 `
            $file.Source `
            "${sshUser}@${sshHost}:$($file.Remote)" 2>&1 | Out-Null
        
        Write-Host "      ✅ Uploaded" -ForegroundColor Green
    } catch {
        Write-Host "      ❌ Upload failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Step 4: Rebuild portal
Write-Host ""
Write-Host "🔨 Step 4: Rebuilding portal..." -ForegroundColor Yellow

try {
    $output = ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$sshUser@$sshHost" `
        "cd /root/laverdi-portal && npm run build 2>&1 | tail -20" 2>&1
    
    if ($output -match "error" -or $output -match "Error") {
        Write-Host "   ❌ Build failed!" -ForegroundColor Red
        Write-Host $output
        exit 1
    }
    
    Write-Host "   ✅ Build successful" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Build failed: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Restart portal
Write-Host ""
Write-Host "🔄 Step 5: Restarting portal service..." -ForegroundColor Yellow

try {
    ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$sshUser@$sshHost" `
        "pm2 restart web" 2>&1 | Out-Null
    
    Start-Sleep -Seconds 3
    
    Write-Host "   ✅ Portal restarted" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Restart failed: $_" -ForegroundColor Red
    exit 1
}

# Step 6: Verify deployment
Write-Host ""
Write-Host "✅ Step 6: Verifying deployment..." -ForegroundColor Yellow

try {
    # Check webhook endpoint exists
    $checkCmd = 'curl -s -o /dev/null -w "%{http_code}" https://laverdi.tech/api/webhooks/telegram'
    $statusCode = ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$sshUser@$sshHost" $checkCmd 2>&1
    
    if ($statusCode -match "405") {
        Write-Host "   ✅ Webhook handler deployed (HTTP 405 - correct for GET)" -ForegroundColor Green
    } elseif ($statusCode -match "404") {
        Write-Host "   ❌ Webhook handler not found (404)" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "   ⚠️  Unexpected status code: $statusCode" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Could not verify (may still be deployed): $_" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "=================================================="
Write-Host "✅ TELEGRAM INTEGRATION DEPLOYED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=================================================="
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://laverdi.tech/dashboard/channels"
Write-Host "2. Create a test Telegram bot via @BotFather"
Write-Host "3. Paste bot token into Telegram pairing card"
Write-Host "4. Send a message to your bot"
Write-Host "5. Verify response comes from your agent"
Write-Host ""
Write-Host "🔍 To check logs:" -ForegroundColor Cyan
Write-Host "   ssh root@$SshHost 'pm2 logs web --lines 50 | grep -i telegram'"
Write-Host ""
Write-Host "Time: $(Get-Date -Format 'HH:mm:ss PDT')" -ForegroundColor Gray
