param(
    [int]$CheckNum = 1,
    [string]$Host = "64.23.142.154",
    [string]$WorkDir = "/opt/openagents"
)

$timeStamp = Get-Date -Format "HH:mm:ss"
Write-Host "=== [$timeStamp] CHECK $CheckNum ===" -ForegroundColor Cyan

# Run SSH commands
$commands = @"
cd $WorkDir

echo '1. Container Status:'
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 

echo ''
echo '2. HTTPS Health:'
curl -s -I https://laverdi.tech | head -3

echo ''
echo '3. Application Logs (Last 5 lines):'
docker logs laverdi-portal --tail 5

echo ''
echo '4. System Resources:'
docker stats --no-stream --no-trunc

echo ''
echo '5. Nginx Logs (Last 3 lines):'
docker logs laverdi-nginx --tail 3
"@

ssh -o StrictHostKeyChecking=no root@$Host $commands

Write-Host "=== CHECK $CheckNum COMPLETE ===" -ForegroundColor Green
