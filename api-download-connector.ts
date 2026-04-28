// pages/api/openclaw/download-connector.ts
// Serve OpenClaw connector scripts (Windows .bat and Mac/Linux .sh)

import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { os } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    let filename: string
    let contentType: string
    let scriptContent: string

    if (os === 'windows') {
      filename = 'laverdi-openclaw-connect.bat'
      contentType = 'application/x-bat'
      scriptContent = `@echo off
REM Laverdi OpenClaw Connection Script for Windows
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

echo Starting SSH tunnel...
start "Laverdi OpenClaw Tunnel" cmd /c "ssh -L 9000:localhost:9000 root@64.23.142.154 && pause"

echo Waiting for tunnel to establish...
timeout /t 3 /nobreak

echo Launching OpenClaw in browser...
timeout /t 1 /nobreak

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
`
    } else if (os === 'mac' || os === 'linux') {
      filename = 'laverdi-openclaw-connect.sh'
      contentType = 'application/x-sh'
      scriptContent = `#!/bin/bash
# Laverdi OpenClaw Connection Script for Mac/Linux

echo ""
echo "===================================="
echo "  Laverdi OpenClaw Connector"
echo "===================================="
echo ""
echo "This will:"
echo "  1. Open an SSH tunnel to your server"
echo "  2. Launch OpenClaw in your browser"
echo ""
echo "Keep this terminal open while using OpenClaw."
echo ""

if ! command -v ssh &> /dev/null; then
    echo "ERROR: SSH is not installed"
    exit 1
fi

echo "Starting SSH tunnel..."
ssh -L 9000:localhost:9000 root@64.23.142.154 &
SSH_PID=$!

echo "Waiting for tunnel to establish..."
sleep 3

echo "Launching OpenClaw in browser..."
sleep 1

if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:9000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:9000
    elif command -v gnome-open &> /dev/null; then
        gnome-open http://localhost:9000
    else
        echo "Please open http://localhost:9000 in your browser"
    fi
fi

echo ""
echo "===================================="
echo "  Connection Established!"
echo "===================================="
echo ""
echo "Your OpenClaw instance is now accessible at:"
echo "  http://localhost:9000"
echo ""
echo "Keep this terminal open. Press Ctrl+C to close when done."
echo ""

wait $SSH_PID
`
    } else {
      return res.status(400).json({ error: 'Invalid OS parameter. Use: windows, mac, or linux' })
    }

    // Set response headers to trigger download
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')

    return res.send(scriptContent)
  } catch (error) {
    console.error('Download error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to download connector',
    })
  }
}
