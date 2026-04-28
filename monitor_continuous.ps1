#!/usr/bin/env powershell

# Continuous monitoring for checks 4-24
# Runs every 5 minutes

$host_ip = "64.23.142.154"
$work_dir = "/opt/openagents"

# Quick monitoring function
function Run-HealthCheck {
    param([int]$CheckNum)
    
    $cmd = @"
cd $work_dir
docker ps --format 'table {{.Names}}\t{{.Status}}'
curl -s -I https://laverdi.tech 2>&1 | head -1
docker stats --no-stream --no-trunc 2>&1 | tail -2
"@
    
    $result = ssh -o StrictHostKeyChecking=no root@$host_ip $cmd 2>&1
    return $result
}

# Loop for checks 4-24 (21 remaining checks)
for ($i = 4; $i -le 24; $i++) {
    Write-Host "`n[CHECK $i]" -ForegroundColor Cyan
    
    $output = Run-HealthCheck -CheckNum $i
    Write-Host $output
    
    # Check for critical issues
    if ($output -match "502|500|connection refused|ECONNREFUSED") {
        Write-Host "`n❌ CRITICAL ERROR DETECTED IN CHECK $i - STOPPING MONITORING" -ForegroundColor Red
        exit 1
    }
    
    if ($i -lt 24) {
        Write-Host "Waiting for next interval..." -ForegroundColor Gray
        Start-Sleep -Seconds 300
    }
}

Write-Host "`n✅ MONITORING COMPLETE - All 24 checks executed successfully" -ForegroundColor Green
