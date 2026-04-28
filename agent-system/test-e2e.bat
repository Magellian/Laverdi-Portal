@echo off
setlocal enabledelayedexpansion

set BASE_URL=http://localhost:8000
set AGENT_SERVICE_URL=http://localhost:5000

echo 🧪 Running End-to-End Test...
echo.

REM Step 1: Register Agent
echo 📍 Step 1: Registering agent...

for /f %%i in ('curl -s -X POST "%BASE_URL%/api/agents" ^
  -H "Content-Type: application/json" ^
  -d "{\"id\": \"test-agent-1\", \"name\": \"Test Agent\", \"url\": \"http://agent:5000\"}" ^
  ^| findstr "id"') do set AGENT_ID=%%i

if "!AGENT_ID!"=="" (
    echo ❌ Failed to register agent
    exit /b 1
)

echo ✅ Agent registered

echo.

REM Step 2: Send test task
echo ⚡ Step 2: Sending test task...

curl -s -X POST "%BASE_URL%/api/tasks" ^
  -H "Content-Type: application/json" ^
  -d "{\"agentId\": \"test-agent-1\", \"name\": \"Echo Test\", \"command\": \"echo\", \"args\": [\"hello\", \"world\"]}" ^
  > response.json

echo ✅ Task sent

echo.

REM Step 3: Wait for completion
echo ⏳ Step 3: Waiting for task execution...
timeout /t 3 /nobreak

REM Step 4: Check agent health
echo.
echo 📊 Step 4: Verifying agent health...
curl -s "%AGENT_SERVICE_URL%/health" > nul
if errorlevel 1 (
    echo ❌ Agent service unhealthy
    exit /b 1
) else (
    echo ✅ Agent service healthy
)

echo.
echo 📋 Task History:
curl -s "%AGENT_SERVICE_URL%/tasks" | findstr /R "status.*completed"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✨ Basic Test Complete!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Services are running. Visit http://localhost:8000 to use the dashboard.
echo.
del /q response.json 2>nul
pause
