#!/usr/bin/env powershell

# Batch monitoring - remains checks 4-24
# Each iteration: wait 5 min, then run check

$host_ip = "64.23.142.154"
$work_dir = "/opt/openagents"
$ssh_opts = "-o StrictHostKeyChecking=no"

$checks_remaining = @(4..24)
$interval_sec = 300

foreach ($check_num in $checks_remaining) {
    # Calculate timestamp
    $min_offset = ($check_num - 1) * 5
    $hour = 21 + [math]::Floor($min_offset / 60)
    $min = $min_offset % 60
    $timestamp = "{0:D2}:{1:D2}:00" -f $hour, $min
    
    Write-Host "`n[$timestamp] CHECK $check_num..." -ForegroundColor Cyan
    
    $cmd = @"
cd $work_dir
echo '=== CHECK $check_num ($timestamp) ==='
docker ps --format 'table {{.Names}}\t{{.Status}}'
echo ''
curl -s -I https://laverdi.tech 2>&1 | head -2
echo ''
docker logs laverdi-portal --tail 1 2>&1 | grep -i error || echo 'No errors'
echo ''
docker stats --no-stream --no-trunc 2>&1 | tail -2
"@
    
    # Execute check
    $result = ssh $ssh_opts root@$host_ip $cmd 2>&1
    Write-Host $result
    Write-Host "✅ Check $check_num complete"
    
    # Wait before next check (except for last one)
    if ($check_num -lt 24) {
        Write-Host "Waiting 5 minutes..." -ForegroundColor Gray
        Start-Sleep -Seconds $interval_sec
    }
}

Write-Host "`n✅ ALL 24 CHECKS COMPLETE" -ForegroundColor Green
