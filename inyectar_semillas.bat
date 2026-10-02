@echo off
chcp 65001 >nul
title MejoraSuite - Inyeccion Semillas de Oro
cd /d "%~dp0"
python "%~dp0scripts\inyectar_semillas.py"
echo.
echo Presiona una tecla para salir...
pause >nul
