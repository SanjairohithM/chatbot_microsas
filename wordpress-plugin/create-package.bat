@echo off
echo Creating OmniX Chatbot WordPress Plugin Package...
echo.

REM Check if PHP is available
php --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: PHP is not installed or not in PATH
    echo Please install PHP and try again
    pause
    exit /b 1
)

REM Run the PHP packager
php create-package.php

echo.
echo Package creation completed!
echo Check the current directory for the ZIP file.
echo.
pause