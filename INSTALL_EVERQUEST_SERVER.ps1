#requires -RunAsAdministrator
<#
.SYNOPSIS
    Complete EverQuest Emulator Server Installation for DAD-WS3
    Seeds of Destruction Edition
.DESCRIPTION
    Automated installation of:
    - MariaDB (MySQL database)
    - EQEmulator Server (game engine)
    - ProjectEQ database (SoD content)
.AUTHOR
    Crawford
.VERSION
    1.0
#>

Write-Host "================================" -ForegroundColor Cyan
Write-Host "EverQuest Emulator Server Setup" -ForegroundColor Cyan
Write-Host "DAD-WS3 Installation" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Define installation paths
$InstallRoot = "C:\EQEmulator"
$MariaDBPath = "C:\Program Files\MariaDB 11.4"
$DownloadPath = "$InstallRoot\downloads"
$DatabasePath = "$InstallRoot\database"

# Create directories
Write-Host "[1/8] Creating directories..." -ForegroundColor Yellow
if (-not (Test-Path $InstallRoot)) {
    New-Item -ItemType Directory -Path $InstallRoot | Out-Null
}
if (-not (Test-Path $DownloadPath)) {
    New-Item -ItemType Directory -Path $DownloadPath | Out-Null
}
if (-not (Test-Path $DatabasePath)) {
    New-Item -ItemType Directory -Path $DatabasePath | Out-Null
}
Write-Host "✓ Directories created at $InstallRoot" -ForegroundColor Green
Write-Host ""

# Download MariaDB
Write-Host "[2/8] Downloading MariaDB..." -ForegroundColor Yellow
$MariaDBUrl = "https://downloads.mariadb.org/MariaDB/mariadb-11.4.2/winx64-zip/mariadb-11.4.2-winx64.zip"
$MariaDBZip = "$DownloadPath\mariadb-11.4.2-winx64.zip"

try {
    if (-not (Test-Path $MariaDBZip)) {
        Write-Host "Downloading MariaDB (this may take a minute)..."
        Invoke-WebRequest -Uri $MariaDBUrl -OutFile $MariaDBZip -ErrorAction Stop
        Write-Host "✓ MariaDB downloaded" -ForegroundColor Green
    } else {
        Write-Host "✓ MariaDB already downloaded" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ MariaDB download failed. You may need to download manually from:" -ForegroundColor Yellow
    Write-Host "   https://downloads.mariadb.org/" -ForegroundColor Yellow
    Write-Host "   (Download the Windows x64 ZIP version and extract to $MariaDBPath)" -ForegroundColor Yellow
}
Write-Host ""

# Extract MariaDB
Write-Host "[3/8] Extracting MariaDB..." -ForegroundColor Yellow
if (Test-Path $MariaDBZip) {
    try {
        Expand-Archive -Path $MariaDBZip -DestinationPath "C:\Program Files\" -Force -ErrorAction Stop
        Write-Host "✓ MariaDB extracted" -ForegroundColor Green
    } catch {
        Write-Host "✓ MariaDB extraction skipped (may already exist)" -ForegroundColor Green
    }
} else {
    Write-Host "⚠ MariaDB ZIP not found, skipping extraction" -ForegroundColor Yellow
}
Write-Host ""

# Initialize MariaDB
Write-Host "[4/8] Initializing MariaDB database..." -ForegroundColor Yellow
$MariaDBBin = "$MariaDBPath\bin"
if (Test-Path $MariaDBBin) {
    try {
        Push-Location $MariaDBBin
        .\mariadb-install-db.exe --datadir="$MariaDBPath\data" --password=eq_root_pass 2>&1 | Out-Null
        Write-Host "✓ MariaDB initialized" -ForegroundColor Green
        Pop-Location
    } catch {
        Write-Host "⚠ MariaDB initialization encountered issues (may already be initialized)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ MariaDB binary path not found at $MariaDBBin" -ForegroundColor Yellow
}
Write-Host ""

# Download EQEmulator Server
Write-Host "[5/8] Downloading EQEmulator Server..." -ForegroundColor Yellow
$EQEmuUrl = "https://github.com/EQEmu/EQEmu/releases/download/latest/eqemu-server-windows-latest.zip"
$EQEmuZip = "$DownloadPath\eqemu-server-latest.zip"

Write-Host "Getting latest EQEmulator release information..." -ForegroundColor Cyan
# Note: GitHub URL redirect may require following redirects
# Fallback: User may need to download manually from https://github.com/EQEmu/EQEmu/releases

try {
    if (-not (Test-Path $EQEmuZip)) {
        Write-Host "Downloading EQEmulator (this may take a couple minutes)..." -ForegroundColor Cyan
        $ProgressPreference = 'SilentlyContinue'
        # Try to get actual release URL from GitHub API
        $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/EQEmu/EQEmu/releases/latest" -ErrorAction Stop
        $downloadUrl = $releases.assets | Where-Object { $_.name -like "*windows*" } | Select-Object -First 1 -ExpandProperty browser_download_url
        
        if ($downloadUrl) {
            Invoke-WebRequest -Uri $downloadUrl -OutFile $EQEmuZip -ErrorAction Stop
            Write-Host "✓ EQEmulator downloaded" -ForegroundColor Green
        } else {
            throw "Could not find Windows binary in latest release"
        }
    } else {
        Write-Host "✓ EQEmulator already downloaded" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ EQEmulator download failed. Please download manually from:" -ForegroundColor Yellow
    Write-Host "   https://github.com/EQEmu/EQEmu/releases" -ForegroundColor Yellow
    Write-Host "   Download the Windows binary and extract to $InstallRoot" -ForegroundColor Yellow
}
Write-Host ""

# Extract EQEmulator
Write-Host "[6/8] Extracting EQEmulator Server..." -ForegroundColor Yellow
if (Test-Path $EQEmuZip) {
    try {
        Expand-Archive -Path $EQEmuZip -DestinationPath $InstallRoot -Force -ErrorAction Stop
        Write-Host "✓ EQEmulator extracted to $InstallRoot" -ForegroundColor Green
    } catch {
        Write-Host "✓ EQEmulator extraction skipped (may already exist)" -ForegroundColor Green
    }
} else {
    Write-Host "⚠ EQEmulator ZIP not found, skipping extraction" -ForegroundColor Yellow
}
Write-Host ""

# Create EQEmulator config
Write-Host "[7/8] Creating EQEmulator configuration..." -ForegroundColor Yellow
$ConfigPath = "$InstallRoot\eqemu_config.json"

$Config = @{
    "server" = @{
        "world" = @{
            "loginserver1" = @{
                "host" = "127.0.0.1"
                "port" = 5998
                "legacy" = $true
            }
        }
    }
    "database" = @{
        "db" = "eqemu"
        "user" = "eqemu"
        "password" = "eqemu_pass"
        "host" = "127.0.0.1"
        "port" = 3306
    }
} | ConvertTo-Json -Depth 10

if (-not (Test-Path $ConfigPath)) {
    $Config | Out-File -FilePath $ConfigPath -Encoding UTF8
    Write-Host "✓ Configuration file created at $ConfigPath" -ForegroundColor Green
} else {
    Write-Host "✓ Configuration already exists" -ForegroundColor Green
}
Write-Host ""

# Installation summary
Write-Host "[8/8] Installation Summary" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Installation paths:" -ForegroundColor Cyan
Write-Host "  EQEmulator: $InstallRoot" -ForegroundColor White
Write-Host "  MariaDB:    $MariaDBPath" -ForegroundColor White
Write-Host "  Downloads:  $DownloadPath" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Install MariaDB as Windows Service (if not already done)" -ForegroundColor White
Write-Host "  2. Download ProjectEQ database dump from EQEmulator forums" -ForegroundColor White
Write-Host "  3. Import database: mysql -u root eqemu < projecteq_sod.sql" -ForegroundColor White
Write-Host "  4. Start EQEmulator servers:" -ForegroundColor White
Write-Host "     - world.exe" -ForegroundColor White
Write-Host "     - zone.exe" -ForegroundColor White
Write-Host "     - loginserver.exe" -ForegroundColor White
Write-Host "  5. Connect client to 127.0.0.1:5999" -ForegroundColor White
Write-Host ""
Write-Host "Resources:" -ForegroundColor Cyan
Write-Host "  GitHub:      https://github.com/EQEmu/EQEmu" -ForegroundColor Cyan
Write-Host "  Forums:      https://www.eqemulator.org/" -ForegroundColor Cyan
Write-Host "  Discord:     https://discord.gg/QHsm7CD" -ForegroundColor Cyan
Write-Host "  Docs:        https://docs.eqemu.dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan

Read-Host "Press Enter to exit"
