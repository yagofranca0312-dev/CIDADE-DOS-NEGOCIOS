@echo off
setlocal
cd /d "%~dp0"
if not exist "%~dp0tools\Publicar-Primeira-Versao.ps1" (
  echo ERRO: Publicador nao encontrado. Extraia o ZIP completo.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\Publicar-Primeira-Versao.ps1"
set "RESULT=%ERRORLEVEL%"
echo.
if "%RESULT%"=="0" (
  echo Publicacao inicial concluida.
) else (
  echo Publicacao NAO concluida. Confira a mensagem acima.
)
pause
exit /b %RESULT%
