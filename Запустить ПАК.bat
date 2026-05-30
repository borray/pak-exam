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

rem Запускаем Electron через его официальный путь — работает где бы он ни лежал
node -e "require('child_process').spawn(require('electron'),['.'],{detached:true,stdio:'ignore'}).unref()"
exit
