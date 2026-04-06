$buildDir = "build-final-new"
$distTemp = "dist-temp"

Write-Host "Stopping all Electron and MSI related processes..."
Stop-Process -Name BlogApp, electron, msiexec, light, candle -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Cleaning build directories..."
if (Test-Path $buildDir) {
    Write-Host "Removing $buildDir..."
    Remove-Item -Recurse -Force $buildDir -ErrorAction SilentlyContinue
}

if (Test-Path $distTemp) {
    Write-Host "Removing $distTemp..."
    Remove-Item -Recurse -Force $distTemp -ErrorAction SilentlyContinue
}

# Check if directories are still there (they might be if locked)
if (Test-Path $buildDir) {
    Write-Host "WARNING: $buildDir still exists, likely locked by another process (e.g. File Explorer)."
    Write-Host "Please close any explorer windows showing the $buildDir folder."
}

Write-Host "Starting build process..."
npm run build:electron | Tee-Object -FilePath "build_msi_final_run.log"
