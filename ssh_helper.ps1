param(
    [string]$Host = "66.42.70.66",
    [string]$User = "root",
    [string]$Password = "F,6f`$bZKYr9CTDN",
    [string]$Command = ""
)

# Use plink (PuTTY) if available, otherwise try expect script
$plinkPath = "C:\Program Files\PuTTY\plink.exe"

if (Test-Path $plinkPath) {
    Write-Host "Using plink for SSH..."
    & $plinkPath -ssh -l $User -pw $Password -v $Host $Command 2>&1
} else {
    Write-Host "plink not found, trying expect approach..."
    # Fall back to raw SSH (will need interactive auth)
    Write-Host "ERROR: No password SSH tool available"
    exit 1
}
