@echo off
"C:\Program Files (x86)\Windows Kits\10\App Certification Kit\signtool.exe" sign /f "C:\Users\nsdav\OneDrive\Desktop\MERN_STACK\Blog\Blog_Client\cert.pfx" /p password123 /tr http://timestamp.digicert.com /td sha256 /fd sha256 %1
