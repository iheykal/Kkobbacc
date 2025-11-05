# WebP Conversion Script for PowerShell
# Converts all PNG, JPG, and JPEG images to WebP format

Write-Host "🚀 Starting WebP conversion process..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Sharp is installed
Write-Host "📦 Checking dependencies..." -ForegroundColor Blue
try {
    npm list sharp | Out-Null
    Write-Host "✅ Sharp library found" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing Sharp library..." -ForegroundColor Yellow
    try {
        npm install sharp
        Write-Host "✅ Sharp installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install Sharp. Please run: npm install sharp" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Run the conversion script
Write-Host "🔄 Running WebP conversion..." -ForegroundColor Blue
try {
    node scripts/convert-to-webp.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ WebP conversion completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Next steps:" -ForegroundColor Cyan
        Write-Host "1. Update your components to use WebP images" -ForegroundColor White
        Write-Host "2. Test the images in different browsers" -ForegroundColor White
        Write-Host "3. Monitor performance improvements" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ WebP conversion failed. Check the error messages above." -ForegroundColor Red
        Write-Host ""
    }
} catch {
    Write-Host "❌ Error running conversion script: $_" -ForegroundColor Red
}

Read-Host "Press Enter to exit"

