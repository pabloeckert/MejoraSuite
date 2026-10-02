@echo off
chcp 65001 >nul
title MejoraSuite - Centro de Control
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0arrancar.ps1"
