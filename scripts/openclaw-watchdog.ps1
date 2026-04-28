# OpenClaw Watchdog - Monitors Gateway health and restarts if needed
# Runs silently as a scheduled task

param(
    [switch]$Verbose
)

$GatewayUrl = "http://127.0.0.1:18789"
$GatewayCmd = "C:\Users\chris\.openclaw\gateway.cmd"
$LogPath = "C:\Users\chris\.openclaw\logs\watchdog.log"
$LockFile = "C:\Users\chris\.openclaw\logs\.watchdog-lock"
$MaxLockAge = 60 # seconds

# Ensure log directory exists
$LogDir = Split-Path $LogPath
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Function to write log
function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogLine = "[$Timestamp] $Message"
    Add-Content -Path $LogPath -Value $LogLine -ErrorAction SilentlyContinue
    if ($Verbose) { Write-Host $LogLine }
}

# Function to check if gateway is healthy
function Test-GatewayHealth {
    try {
        $Response = Invoke-WebRequest -Uri "$GatewayUrl/health" -TimeoutSec 5 -ErrorAction Stop
        return $Response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# Prevent duplicate watchdog restarts with a lock file
function Test-LockFile {
    if (Test-Path $LockFile) {
        $LockAge = (Get-Date) - (Get-Item $LockFile).LastWriteTime
        if ($LockAge.TotalSeconds -lt $MaxLockAge) {
            Write-Log "Lock file exists (age: $([int]$LockAge.TotalSeconds)s) - skipping restart"
            return $true
        }
        else {
            Remove-Item $LockFile -Force -ErrorAction SilentlyContinue
        }
    }
    return $false
}

function Set-LockFile {
    Set-Content -Path $LockFile -Value (Get-Date) -Force -ErrorAction SilentlyContinue
}

# Check if a gateway process is already running
function Test-GatewayProcess {
    $GatewayProcesses = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match 'gateway' }
    return $null -ne $GatewayProcesses
}

# Main watchdog logic
Write-Log "Watchdog check started"

if (Test-GatewayHealth) {
    Write-Log "Gateway is healthy"
}
else {
    Write-Log "Gateway health check failed"
    
    # Wait and retry
    Start-Sleep -Seconds 10
    
    if (Test-GatewayHealth) {
        Write-Log "Gateway recovered after retry"
    }
    else {
        Write-Log "Gateway still down after retry"
        
        if (Test-LockFile) {
            Write-Log "Restart already in progress (lock active)"
        }
        elseif (Test-GatewayProcess) {
            Write-Log "Gateway process exists but not responding - killing and restarting"
            Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match 'gateway' } | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
        
        if (-not (Test-LockFile)) {
            Write-Log "Starting gateway via $GatewayCmd"
            Set-LockFile
            
            try {
                Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$GatewayCmd`"" -WindowStyle Hidden -ErrorAction Stop
                Write-Log "Gateway restart initiated"
            }
            catch {
                Write-Log "Failed to start gateway: $_"
            }
        }
    }
}

Write-Log "Watchdog check complete"
