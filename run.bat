@echo off
:: ============================================================
::  AI Student Productivity Assistant
::  One-click setup and launch for Windows
::  Double-click this file OR: cd ai-student-productivity && run.bat
:: ============================================================
title StudyAI — AI Student Productivity

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   StudyAI — AI Student Productivity Assistant   ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: ── Check Node.js ─────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js is not installed or not in PATH.
    echo.
    echo  Please download and install Node.js from:
    echo  https://nodejs.org  ^(choose LTS version^)
    echo.
    pause
    exit /b 1
)

:: ── Print Node version ────────────────────────────────────
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  [1/4] Node.js found: %NODE_VER%

:: ── Check npm ─────────────────────────────────────────────
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: npm not found. Reinstall Node.js.
    pause
    exit /b 1
)

:: ── Install dependencies ──────────────────────────────────
echo  [2/4] Installing dependencies...
call npm install --silent
if %errorlevel% neq 0 (
    echo  ERROR: npm install failed. Check your internet connection.
    pause
    exit /b 1
)
echo         Done.

:: ── Create data directory ─────────────────────────────────
echo  [3/4] Setting up data directory...
if not exist "data\" mkdir data
echo         Done.

:: ── Copy .env if missing ──────────────────────────────────
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo         .env created from .env.example
    )
)

:: ── Seed demo data ────────────────────────────────────────
echo  [4/4] Seeding demo data...
call node scripts\seed.js
if %errorlevel% neq 0 (
    echo         ^(Seed skipped — continuing^)
)

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   App is starting...                            ║
echo  ║                                                  ║
echo  ║   Open in browser:  http://localhost:3000        ║
echo  ║   Press CTRL+C to stop the server               ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: ── Start server ──────────────────────────────────────────
node server\index.js

pause
