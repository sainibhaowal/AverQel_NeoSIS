@echo off
setlocal DisableDelayedExpansion
set "ELECTRON_RUN_AS_NODE=1"
"%~dp0..\..\..\..\AverQel NeoSIS.exe" --expose-internals "%~dp0..\..\..\app.asar\neosis\node_modules\@averqel\neosis\lib\bin.js" %*
exit /b %errorlevel%
