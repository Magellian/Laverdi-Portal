@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting Agent System...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

echo 📦 Building Docker images...
docker-compose build

echo.
echo 🎬 Starting services...
docker-compose up -d

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak

echo.
echo 🔍 Checking service health...

REM Check Agent Service
curl -s http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Agent Service (port 5000) - FAILED
) else (
    echo ✅ Agent Service (port 5000) - HEALTHY
)

REM Check Command Center
curl -s http://localhost:8000 >nul 2>&1
if errorlevel 1 (
    echo ❌ Command Center (port 8000) - FAILED
) else (
    echo ✅ Command Center (port 8000) - HEALTHY
)

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✨ System Started!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📊 Command Center:  http://localhost:8000
echo 🔧 Agent Service:   http://localhost:5000
echo.
echo Next steps:
echo 1. Open http://localhost:8000 in your browser
echo 2. Click 'Register Agent'
echo 3. Enter: http://agent:5000
echo 4. Send a test task (e.g., 'echo hello world')
echo.
echo To view logs:
echo   docker-compose logs -f
echo.
echo To stop:
echo   docker-compose down
echo.
pause
