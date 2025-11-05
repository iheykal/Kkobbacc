@echo off
echo 🚀 Starting WebP conversion process...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Sharp is installed, if not install it
echo 📦 Checking dependencies...
npm list sharp >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing Sharp library...
    npm install sharp
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Sharp. Please run: npm install sharp
        pause
        exit /b 1
    )
)

REM Run the conversion script
echo 🔄 Running WebP conversion...
node scripts/convert-to-webp.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ WebP conversion completed successfully!
    echo.
    echo 📋 Next steps:
    echo 1. Update your components to use WebP images
    echo 2. Test the images in different browsers
    echo 3. Monitor performance improvements
    echo.
) else (
    echo.
    echo ❌ WebP conversion failed. Check the error messages above.
    echo.
)

pause

