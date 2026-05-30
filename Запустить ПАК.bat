@echo off
chcp 65001 >nul
title ПАК
cd /d "%~dp0"
start "" "dist\win-unpacked\ПАК.exe"
exit
