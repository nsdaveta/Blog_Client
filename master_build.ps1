$buildDir = "build-final-new"
$distTemp = "dist-temp"

Write-Host "Stopping all Electron, MSI, and app-builder related processes..."
Stop-Process -Name BlogApp, electron, msiexec, light, candle, node, app-builder -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host "Cleaning build and temporary directories..."
$dirsToClean = @($buildDir, $distTemp, "release")
foreach ($dir in $dirsToClean) {
    if (Test-Path $dir) {
        Write-Host "Forcing removal of $dir..."
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
    }
}

# Check if directories are still there (they might be if locked)
if (Test-Path $buildDir) {
    Write-Host "WARNING: $buildDir still exists, likely locked by another process (e.g. File Explorer)."
    Write-Host "Please close any explorer windows showing the $buildDir folder."
}

Write-Host "Starting build process..."
npm run build:electron | Tee-Object -FilePath "build_msi_final_run.log"
