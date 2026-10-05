@echo off
setlocal DisableDelayedExpansion
set "signTool=%NEOSIS_DESKTOP_WINDOWS_SIGNTOOL%"
set "certificateFile=%NEOSIS_DESKTOP_WINDOWS_CER_FILE%"
set "tokenPin=%NEOSIS_DESKTOP_WINDOWS_TOKEN_PIN%"
set "keyContainer=%NEOSIS_DESKTOP_WINDOWS_KEY_CONTAINER%"
set "targetFile=%NEOSIS_DESKTOP_WINDOWS_SIGN_TARGET%"
set "appendSignature="
if "%NEOSIS_DESKTOP_WINDOWS_SIGN_APPEND%"=="1" set "appendSignature=/as"
set "NEOSIS_DESKTOP_WINDOWS_SIGNTOOL="
set "NEOSIS_DESKTOP_WINDOWS_CER_FILE="
set "NEOSIS_DESKTOP_WINDOWS_TOKEN_PIN="
set "NEOSIS_DESKTOP_WINDOWS_KEY_CONTAINER="
set "NEOSIS_DESKTOP_WINDOWS_SIGN_TARGET="
set "NEOSIS_DESKTOP_WINDOWS_SIGN_APPEND="
set "signTool=" & set "certificateFile=" & set "tokenPin=" & set "keyContainer=" & set "targetFile=" & set "appendSignature=" & "%signTool%" sign /v /fd sha256 /f "%certificateFile%" /kc "[{{%tokenPin%}}]=%keyContainer%" /csp "eToken Base Cryptographic Provider" %appendSignature% "%targetFile%"
exit /b %errorlevel%
