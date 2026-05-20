param(
    [string]$TargetHost = "66.42.70.66",
    [string]$User = "root",
    [string]$Password = 'F,6f$)bZKYr9CTDN'
)

# Install posh-ssh if not available
$modules = Get-Module -ListAvailable
if (-not ($modules.Name -contains "Posh-SSH")) {
    Write-Host "Installing Posh-SSH module..."
    Install-Module -Name Posh-SSH -Force -Scope CurrentUser -SkipPublisherCheck
}

# Import the module
Import-Module Posh-SSH

# Create SSH session
$password = ConvertTo-SecureString -AsPlainText -Force -String $Password
$credential = New-Object System.Management.Automation.PSCredential($User, $password)

Write-Host "Connecting to $TargetHost..."
$session = New-SSHSession -ComputerName $TargetHost -Credential $credential -AcceptKey

if ($session) {
    Write-Host "`n=== 1. Docker daemon status (docker ps) ==="
    $result = Invoke-SSHCommand -SessionId $session.SessionId -Command "docker ps"
    Write-Host $result.Output

    Write-Host "`n=== 2. All containers (docker ps -a) ==="
    $result = Invoke-SSHCommand -SessionId $session.SessionId -Command "docker ps -a"
    Write-Host $result.Output

    Write-Host "`n=== 3. LaVerdi containers (docker ps -a | grep laverdi) ==="
    $result = Invoke-SSHCommand -SessionId $session.SessionId -Command "docker ps -a | grep -i laverdi"
    Write-Host $result.Output

    Write-Host "`n=== 4. docker-compose.yml location ==="
    $result = Invoke-SSHCommand -SessionId $session.SessionId -Command "ls -la /root/laverdi-portal/docker-compose.yml"
    Write-Host $result.Output

    Write-Host "`n=== 5. LaVerdi systemd services ==="
    $result = Invoke-SSHCommand -SessionId $session.SessionId -Command "systemctl status | grep -i laverdi"
    Write-Host $result.Output

    Write-Host "`n=== 6. Port 3000 listeners ==="
    $result = Invoke-SSHCommand -SessionId $session.SessionId -Command "netstat -tlnp | grep 3000"
    Write-Host $result.Output

    Write-Host "`n=== 7. Directory listing of laverdi-portal ==="
    $result = Invoke-SSHCommand -SessionId $session.SessionId -Command "ls -la /root/laverdi-portal/"
    Write-Host $result.Output

    Write-Host "`n=== 8. Check docker-compose version ==="
    $result = Invoke-SSHCommand -SessionId $session.SessionId -Command "docker-compose --version; docker compose --version"
    Write-Host $result.Output

    Remove-SSHSession -SessionId $session.SessionId
} else {
    Write-Host "Failed to connect to $TargetHost"
}
