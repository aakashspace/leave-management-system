@echo off
title Leave Management System
echo =========================================
echo      Leave Management System - IGNOU
echo =========================================
echo.

:: Start MongoDB
echo [1/4] Starting MongoDB...
net start MongoDB >nul 2>&1
if %errorlevel% == 0 (
    echo        MongoDB started.
) else (
    echo        MongoDB already running.
)

:: Check and install backend dependencies
echo.
echo [2/4] Checking backend dependencies...
if not exist "%~dp0backend\node_modules" (
    echo        node_modules not found. Running npm install...
    cd /d "%~dp0backend"
    call npm install
    echo        Backend dependencies installed.
) else (
    echo        Backend dependencies OK.
)

:: Check and install frontend dependencies
echo.
echo [3/4] Checking frontend dependencies...
if not exist "%~dp0frontend\node_modules" (
    echo        node_modules not found. Running npm install...
    cd /d "%~dp0frontend"
    call npm install
    echo        Frontend dependencies installed.
) else (
    echo        Frontend dependencies OK.
)

:: Start backend and frontend
echo.
echo [4/4] Starting servers...
start "LMS Backend" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 2 >nul
start "LMS Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 3 >nul

:: Open browser
echo.
echo Opening http://localhost:5173 ...
start http://localhost:5173

echo.
echo =========================================
echo  App is running! Keep both terminals open.
echo  To stop: close the Backend and Frontend
echo  terminal windows.
echo =========================================
pause
