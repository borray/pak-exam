@echo off
chcp 65001 >nul
title ПАК
cd /d "%~dp0"

if not exist "dist\index.html" (
  echo Программа ещё не собрана.
  echo Сначала запусти "Обновить ПАК".
  echo.
  pause
  exit /b 1
)

start "" "node_modules\electron\dist\electron.exe" .
exit
