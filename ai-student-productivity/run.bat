@echo off
:: ============================================================
:: AI Student Productivity – ONE CLICK SETUP & RUN
:: Double-click this file OR run in terminal
:: ============================================================
title AI Student Productivity - Setup & Run

echo.
echo  ========================================================
echo    AI Student Productivity - Setup and Launch
echo  ========================================================
echo.

:: ── Find Python ──────────────────────────────────────────────
set PYTHON=python
where python >nul 2>&1
if %errorlevel% neq 0 (
    set PYTHON=py
    where py >nul 2>&1
    if %errorlevel% neq 0 (
        echo  ERROR: Python not found!
        echo  Please install Python from https://www.python.org
        echo  Make sure to check "Add Python to PATH" during install.
        pause
        exit /b 1
    )
)

echo  [1/5] Python found: 
%PYTHON% --version
echo.

:: ── Create virtual environment ────────────────────────────────
if not exist "venv\" (
    echo  [2/5] Creating virtual environment...
    %PYTHON% -m venv venv
    echo  Virtual environment created.
) else (
    echo  [2/5] Virtual environment already exists. Skipping.
)
echo.

:: ── Activate venv ────────────────────────────────────────────
echo  [3/5] Activating virtual environment...
call venv\Scripts\activate.bat

:: ── Install dependencies ──────────────────────────────────────
echo  [4/5] Installing Python packages...
pip install -r requirements.txt --quiet
echo  Packages installed.
echo.

:: ── Create data folder ────────────────────────────────────────
if not exist "data\" mkdir data

:: ── Run migrations ────────────────────────────────────────────
echo  [5/5] Setting up database...
python manage.py migrate --run-syncdb 2>&1
echo.

:: ── Create superuser (optional) ──────────────────────────────
echo  Creating admin user (admin / admin123)...
python manage.py shell -c "from django.contrib.auth import get_user_model; U=get_user_model(); U.objects.filter(username='admin').exists() or U.objects.create_superuser('admin','admin@studyai.local','admin123')" 2>&1

echo.
echo  ========================================================
echo   Starting server at  http://localhost:8000
echo   Admin panel at      http://localhost:8000/admin
echo   Username: admin   Password: admin123
echo   Press CTRL+C to stop
echo  ========================================================
echo.

:: ── Launch server ─────────────────────────────────────────────
python manage.py runserver 8000

pause
