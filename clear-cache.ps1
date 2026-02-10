#!/usr/bin/env pwsh
# Clear all Expo and Metro caches

Write-Host "Clearing Expo and Metro bundler caches..." -ForegroundColor Cyan

# Remove Expo cache
if (Test-Path "client/.expo") {
    Remove-Item -Recurse -Force "client/.expo"
    Write-Host "✓ Cleared client/.expo cache" -ForegroundColor Green
}

# Remove Metro cache  
if (Test-Path "client/node_modules/.cache") {
    Remove-Item -Recurse -Force "client/node_modules/.cache"
    Write-Host "✓ Cleared Metro bundler cache" -ForegroundColor Green
}

# Remove server cache if exists
if (Test-Path "server/node_modules/.cache") {
    Remove-Item -Recurse -Force "server/node_modules/.cache"
    Write-Host "✓ Cleared server cache" -ForegroundColor Green
}

Write-Host "`nAll caches cleared! Now you can run:" -ForegroundColor Yellow
Write-Host "  cd client && pnpm start" -ForegroundColor Cyan
Write-Host "`nTip: Also clear your browser cache (Ctrl+Shift+Delete)" -ForegroundColor Yellow
