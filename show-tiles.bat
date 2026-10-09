@echo off
rem Double-click to show the Lines Tiles showcase in your browser (needs Python 3).
cd /d "%~dp0"
python serve.py %*
if errorlevel 1 pause
