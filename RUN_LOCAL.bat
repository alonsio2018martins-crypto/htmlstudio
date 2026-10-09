@echo off
setlocal
cd /d "%~dp0"
echo Iniciando OpenHTML Studio v1.0.2 em http://localhost:8080/?v=1.0.2
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\server.ps1" -Port 8080
endlocal
