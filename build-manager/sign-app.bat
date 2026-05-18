@echo off
"C:\Program Files (x86)\Windows Kits\10\App Certification Kit\signtool.exe" sign /f "%~dp0cert.pfx" /p password123 /tr http://timestamp.digicert.com /td sha256 /fd sha256 %1
