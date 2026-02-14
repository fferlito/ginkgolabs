@echo off
echo Starting Mushroom Radar React Dashboard...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Dependencies not found. Running installation...
    call install.bat
    if %errorlevel% neq 0 (
        echo Installation failed.
        pause
        exit /b 1
    )
)

echo Starting development server...
echo The dashboard will open in your browser at http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
