# Push and Build Tauri App Script (x86 / 32-bit)
# This script ensures it runs in the project directory regardless of where it is called from.

# 1. Set the working directory to the project root
$ProjectDir = "c:\Users\nsdav\OneDrive\Desktop\MERN_STACK\Blog\Blog_Client"
Set-Location -Path $ProjectDir

# 2. Add Signtool to PATH and check for Administrator privileges
$SigntoolPath = "C:\Program Files (x86)\Windows Kits\10\App Certification Kit"
if ($env:PATH -notlike "*$SigntoolPath*") {
    $env:PATH = "$SigntoolPath;$env:PATH"
}

$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
    Write-Host "WARNING: Script is NOT running as Administrator." -ForegroundColor Yellow
    Write-Host "Tauri builds often require elevation for signing/packaging." -ForegroundColor Yellow
    Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
}

Write-Host "`n[1/3] Staging and Committing changes..." -ForegroundColor Cyan
git add .
git commit -m "Sync before x86 build"

Write-Host "`n[2/3] Pushing to Git..." -ForegroundColor Cyan
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[3/3] Starting Tauri x86 (32-bit) Build..." -ForegroundColor Green
    npm run tauri:build:x86
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nDone! Build complete. Check src-tauri/target/i686-pc-windows-msvc/release/bundle/msi/ for your installer." -ForegroundColor Green
    } else {
        Write-Host "`nError: Tauri build failed. Please check the logs above for specific error details." -ForegroundColor Red
        exit $LASTEXITCODE
    }
} else {
    Write-Host "`nError: Git push failed. Build aborted to prevent out-of-sync releases." -ForegroundColor Red
    exit $LASTEXITCODE
}
