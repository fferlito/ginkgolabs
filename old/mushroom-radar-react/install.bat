@echo off
echo Installing Mushroom Radar React Dashboard...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    echo After installation, restart this script.
    pause
    exit /b 1
)

echo Node.js found. Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo Installation complete!
echo.
echo To start the development server, run:
echo   npm run dev
echo.
echo Or double-click the 'start.bat' file
echo.
pause
