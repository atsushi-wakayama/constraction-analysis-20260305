@echo off
chcp 65001 >nul
REM 政務活動費 管理ツール ベータ版 (Windows用ランチャー)
REM このファイルを ダブルクリック すると起動します

cd /d "%~dp0📁 アプリ本体（さわらないでください）" 2>nul
if %errorlevel% neq 0 (
  echo.
  echo 「📁 アプリ本体（さわらないでください）」フォルダが見つかりません。
  echo ZIPを正しく解凍できているか確認してください。
  echo.
  pause
  exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo.
  echo Node.js がインストールされていません。
  echo https://nodejs.org/ja から最新版（LTS）をインストールしてください。
  echo （一度インストールすれば次回からは何もしなくてOKです）
  echo.
  pause
  exit /b 1
)

node start.mjs
pause
