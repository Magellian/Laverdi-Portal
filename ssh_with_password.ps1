# SSH with password authentication for Windows
# Usage: powershell -File ssh_with_password.ps1 "command"

param(
    [string]$Command = "echo 'SSH OK'"
)

$password = "F,6f`$)bZKYr9CTDN"
$host_ip = "66.42.70.66"
$user = "root"

# Use Putty's plink if available, otherwise fall back to SSH with stdin
$plink = Get-Command plink -ErrorAction SilentlyContinue
$ssh_exe = Get-Command ssh -ErrorAction SilentlyContinue

if ($plink) {
    Write-Host "Using plink..."
    & plink -ssh -l $user -pw $password $host_ip $Command
} elseif ($ssh_exe) {
    Write-Host "Using ssh with echo workaround..."
    # Create a script that will be run on the server
    $scriptBlock = {
        param($cmd)
        $credentials = New-Object System.Management.Automation.PSCredential("root", (ConvertTo-SecureString "F,6f`$)bZKYr9CTDN" -AsPlainText -Force))
        # This won't work easily on Windows without additional tools
        Write-Host "SSH key-based auth recommended for non-interactive use"
    }
    
    # Fallback: just try SSH and report timeout
    Write-Host "Attempting SSH connection..."
    $process = Start-Process ssh -ArgumentList "-o ConnectTimeout=5 root@$host_ip `"$Command`"" -NoNewWindow -PassThru -RedirectStandardOutput "out.txt" -RedirectStandardError "err.txt"
    
    $timeout = 10
    $waited = 0
    while (!$process.HasExited -and $waited -lt $timeout) {
        Start-Sleep -Seconds 1
        $waited++
    }
    
    if (!$process.HasExited) {
        Write-Host "Timeout - SSH waiting for input (password auth attempted)"
        $process.Kill()
        Write-Host "Process killed"
    }
    
    Get-Content "out.txt" -ErrorAction SilentlyContinue
    Get-Content "err.txt" -ErrorAction SilentlyContinue
    Remove-Item "out.txt", "err.txt" -ErrorAction SilentlyContinue
} else {
    Write-Host "SSH not found"
}
