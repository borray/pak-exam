@echo off
chcp 65001 >nul
title Обновление ПАК
cd /d "%~dp0"

echo ============================================
echo   Обновление программы ПАК
echo ============================================
echo.

echo [1/4] Загружаю обновления с GitHub...
git pull
if errorlevel 1 goto error

echo.
echo [2/4] Проверяю зависимости...
call npm install
if errorlevel 1 goto error

echo.
echo [3/4] Собираю программу...
call npm run electron:dir
if errorlevel 1 goto error

echo.
echo [4/4] Готово!
echo.
echo ============================================
echo   Обновление завершено успешно!
echo   Запускай программу через "Запустить ПАК"
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
