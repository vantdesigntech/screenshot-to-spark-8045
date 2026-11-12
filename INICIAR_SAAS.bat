@echo off
title ChronoSniper SaaS - Sistema Completo
echo =========================================================
echo    CHRONOSNIPER - SAAS DE CHOLLOS EN RELOJES (eBay + Wallapop)
echo =========================================================
echo.

echo [1/2] Iniciando Servidor Backend (API Port 3001)...
start "Backend - Watch Chollos Engine" cmd /k "cd /d E:\WEBS\WATCH_CHOLOS_SAAS\server && npx tsx src/server.ts"

timeout /t 2 >nul

echo [2/2] Iniciando Panel Frontend (Vite React UI)...
start "Frontend - ChronoSniper UI" cmd /k "cd /d E:\WEBS\WATCH_CHOLOS_SAAS\client && npm run dev"

timeout /t 3 >nul

echo.
echo Todo listo! Abre tu navegador en: http://localhost:5173
start http://localhost:5173
pause
