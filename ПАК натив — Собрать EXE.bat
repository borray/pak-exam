@echo off
chcp 65001 >nul
title ПАК — сборка EXE
cd /d "%~dp0"

where dotnet >nul 2>&1
if errorlevel 1 (
  echo .NET SDK не установлен! Скачай:
  echo   https://dotnet.microsoft.com/download/dotnet/8.0
  pause
  exit /b 1
)

echo ============================================
echo   Собираю автономный EXE (несколько минут)...
echo ============================================
cd desktop\Pak
dotnet publish -c Release -r win-x64 --self-contained true ^
  -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true ^
  -o publish
if errorlevel 1 ( echo. & echo Ошибка сборки. Скриншот в чат. & pause & exit /b 1 )

echo.
echo ============================================
echo   Готово! Файл: desktop\Pak\publish\PAK.exe
echo   Его можно копировать куда угодно и запускать.
echo ============================================
explorer publish
pause
