@echo off
REM Laverdi OpenClaw Connection Script for Windows
REM This script opens an SSH tunnel and launches your OpenClaw instance in the browser

setlocal enabledelayedexpansion

echo.
echo ====================================
echo   Laverdi OpenClaw Connector
echo ====================================
echo.
echo This will:
echo   1. Open an SSH tunnel to your server
echo   2. Launch OpenClaw in your browser
echo.
echo Keep this window open while using OpenClaw.
echo.

REM Check if SSH is available
where ssh >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: SSH is not installed or not in PATH
    echo.
    echo Please install OpenSSH or Git Bash (includes SSH)
    echo Download Git Bash: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

REM Start SSH tunnel in background
echo Starting SSH tunnel...
start "Laverdi OpenClaw Tunnel" cmd /c "ssh -L 9000:localhost:9000 root@64.23.142.154 && pause"

REM Wait for tunnel to establish
echo Waiting for tunnel to establish...
timeout /t 3 /nobreak

REM Launch browser
echo Launching OpenClaw in browser...
timeout /t 1 /nobreak

REM Try to open with default browser
start http://localhost:9000

echo.
echo ====================================
echo   Connection Established!
echo ====================================
echo.
echo Your OpenClaw instance is now accessible at:
echo   http://localhost:9000
echo.
echo Keep both windows open. Close this window when done.
echo.
pause
