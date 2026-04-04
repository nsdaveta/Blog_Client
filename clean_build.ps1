Stop-Process -Name BlogApp, electron, msiexec -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
if (Test-Path dist) { Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue }
if (Test-Path dist-electron) { Remove-Item -Recurse -Force dist-electron -ErrorAction SilentlyContinue }
npm run build:electron
