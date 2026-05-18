# Push and Build Tauri App Script
# This script ensures it runs in the project directory regardless of where it is called from.

# 1. Set the working directory to the project root
$ProjectDir = $PSScriptRoot
if (-not $ProjectDir) {
    # Fallback if copy-pasted interactively: dynamically discover project folder without hardcoded paths
    $searchPaths = @(
        "$env:USERPROFILE\OneDrive\Desktop",
        "$env:USERPROFILE\Desktop",
        "$env:USERPROFILE\Documents",
        "$env:USERPROFILE\source\repos",
        "C:\", "D:\", "E:\"
    )
    foreach ($basePath in $searchPaths) {
        if (Test-Path $basePath) {
            $found = Get-ChildItem -Path $basePath -Filter "Blog_Client" -Recurse -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) {
                $ProjectDir = $found.FullName
                break
            }
        }
    }
    if (-not $ProjectDir) { $ProjectDir = $PWD.Path }
}
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
git commit -m "Sync before build"

Write-Host "`n[2/3] Pushing to Git..." -ForegroundColor Cyan
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[3/3] Starting Tauri Build..." -ForegroundColor Green
    npm run tauri:build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nDone! Build complete. Check src-tauri/target/release/bundle/msi/ for your installer." -ForegroundColor Green
    } else {
        Write-Host "`nError: Tauri build failed. Please check the logs above for specific error details." -ForegroundColor Red
    }
} else {
    Write-Host "`nError: Git push failed. Build aborted to prevent out-of-sync releases." -ForegroundColor Red
}

Write-Host "`nPress any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
exit $LASTEXITCODE
