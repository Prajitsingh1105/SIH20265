@echo off
title DEPOSIT-TRACK SIH Demo Launcher
echo ========================================================
echo   DEPOSIT-TRACK: Security Deposit / FDR Portal
echo   Team StrataXX - SIH2026 Problem Statement SIH26265
echo ========================================================
echo.

echo [1/3] Starting Backend API Server (port 5000)...
start "DEPOSIT-TRACK API" cmd /k "cd api && npx tsx src/index.ts"

echo [2/3] Starting Web Frontend (port 5173)...
start "DEPOSIT-TRACK Web" cmd /k "cd web && npm run dev"

timeout /t 3 >nul

echo [3/3] Starting Public Cloudflare HTTPS Tunnel...
start "DEPOSIT-TRACK Cloudflare Tunnel" cmd /k "cloudflared.exe tunnel --url http://localhost:5173 --http-host-header=localhost:5173"

echo.
echo ========================================================
echo   Services started!
echo   Local Web URL:     http://localhost:5173
echo   Local API URL:     http://localhost:5000/api
echo   Public Tunnel URL: Check the Cloudflare window!
echo ========================================================
pause
