# Continuous monitoring for laverdi.tech
# Monitors every 5 minutes for 2 hours (24 checks total)

param(
    [int]$StartCheck = 3,
    [int]$TotalChecks = 24,
    [int]$IntervalSeconds = 300
)

$host_ip = "64.23.142.154"
$work_dir = "/opt/openagents"
$log_file = "C:\Users\chris\.openclaw\workspace\MONITORING_LOG.md"

for ($check = $StartCheck; $check -le $TotalChecks; $check++) {
    $minutes = ($check - 1) * 5
    $hours = 21 + [math]::Floor($minutes / 60)
    $mins = $minutes % 60
    $timestamp = "{0:D2}:{1:D2}:00" -f $hours, $mins
    
    Write-Host "[$timestamp] Executing CHECK $check..." -ForegroundColor Cyan
    
    $ssh_cmd = @"
cd $work_dir
echo '=== CHECK $check at $timestamp ==='
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
echo ''
curl -s -I https://laverdi.tech 2>&1 | head -2
echo ''
docker logs laverdi-portal --tail 2 2>&1
echo ''
docker stats --no-stream 2>&1 | head -3
echo ''
docker logs laverdi-nginx --tail 2 2>&1
"@
    
    $output = ssh -o StrictHostKeyChecking=no root@$host_ip $ssh_cmd 2>&1
    Write-Host $output
    Write-Host "---"
    
    if ($check -lt $TotalChecks) {
        Write-Host "Waiting 5 minutes until next check..." -ForegroundColor Yellow
        Start-Sleep -Seconds $IntervalSeconds
    }
}

Write-Host "Monitoring complete!" -ForegroundColor Green
