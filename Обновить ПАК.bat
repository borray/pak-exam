@echo off
chcp 65001 >nul
title Обновление ПАК
cd /d "%~dp0"

echo ============================================
echo   Обновление программы ПАК
echo ============================================
echo.

echo [1/4] Загружаю обновления с GitHub...
rem Сбрасываем служебные изменения, которые мешают обновлению
git checkout -- . 2>nul
git pull
if errorlevel 1 goto error

echo.
echo [2/4] Проверяю зависимости...
call npm install
if errorlevel 1 goto error

echo.
echo [3/4] Проверяю движок Electron...
if not exist "node_modules\electron\dist\electron.exe" (
  echo   Движок не найден, доустанавливаю...
  node "node_modules\electron\install.js"
  if errorlevel 1 goto error
)

echo.
echo [4/4] Собираю программу...
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
