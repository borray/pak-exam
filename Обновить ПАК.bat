@echo off
chcp 65001 >nul
title Обновление ПАК
cd /d "%~dp0"

echo ============================================
echo   Обновление программы ПАК
echo ============================================
echo.

echo [1/3] Загружаю обновления с GitHub...
git pull
if errorlevel 1 goto error

echo.
echo [2/3] Проверяю зависимости...
call npm install
if errorlevel 1 goto error

echo.
echo [3/3] Собираю программу...
call npm run build
if errorlevel 1 goto error

echo.
echo ============================================
echo   Обновление завершено успешно!
echo   Запускай через файл "Запустить ПАК"
echo ============================================
echo.
pause
exit /b 0

:error
echo.
echo ============================================
echo   Произошла ошибка. Сделай скриншот окна
echo   и пришли его в чат.
echo ============================================
echo.
pause
exit /b 1
