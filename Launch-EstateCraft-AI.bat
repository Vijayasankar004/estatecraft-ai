@echo off
title EstateCraft AI - Real Estate Studio Launcher
color 0A

echo =====================================================================
echo           ESTATECRAFT AI - 1-CLICK APPLICATION LAUNCHER
echo =====================================================================
echo.

:: Refresh system path for Node & npm
set "PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm;%LOCALAPPDATA%\Programs\nodejs"

:: Navigate to project directory
cd /d "%~dp0"

echo [1/3] Checking Node.js environment...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found in PATH!
    echo Please install Node.js from https://nodejs.org or check your PATH.
    pause
    exit /b 1
)
echo [OK] Node.js is ready.

echo.
echo [2/3] Verifying and building latest client assets...
cd client
call npm run build >nul 2>&1
cd ..

echo.
echo [3/3] Launching Fullstack Application Servers...
echo Starting Backend API (Port 5000)...
start /b cmd /c "cd server && node server.js" >nul 2>&1

echo Starting Frontend Dev Server (Port 3000)...
start /b cmd /c "cd client && npm run dev" >nul 2>&1

:: Wait 3 seconds for servers to bind
timeout /t 3 /nobreak >nul

echo.
echo =====================================================================
echo  SUCCESS: EstateCraft AI is now running live!
echo  Opening http://localhost:3000 in your browser...
echo =====================================================================
echo.
echo   * Web Application:  http://localhost:3000
echo   * Backend REST API: http://localhost:5000/api/listings
echo   * Health Status:    http://localhost:5000/api/health
echo.
echo  Press Ctrl+C or close this window when you wish to stop the application.
echo =====================================================================

:: Open the default browser to the app
start http://localhost:3000

:: Keep the command prompt window open so user can see it's running
cmd /k
