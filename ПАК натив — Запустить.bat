@echo off
chcp 65001 >nul
title ПАК (нативная версия)
cd /d "%~dp0"

echo ============================================
echo   Загружаю последнюю версию...
echo ============================================
git checkout -- . 2>nul
git pull

where dotnet >nul 2>&1
if errorlevel 1 (
  echo.
  echo .NET SDK не установлен!
  echo Скачай ".NET SDK 8.0" для Windows x64:
  echo   https://dotnet.microsoft.com/download/dotnet/8.0
  echo Установи, перезагрузи компьютер, запусти этот файл снова.
  echo.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   Запускаю программу (первый раз дольше)...
echo ============================================
cd desktop\Pak
dotnet run -c Release
if errorlevel 1 (
  echo.
  echo Ошибка. Сделай скриншот окна и пришли в чат.
  pause
)
