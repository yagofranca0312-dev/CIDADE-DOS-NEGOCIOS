@echo off
setlocal
cd /d "%~dp0"
if not exist "%~dp0tools\Atualizar-E-Jogar.ps1" (
  echo ERRO: Arquivo do atualizador nao encontrado.
  echo Confira se voce extraiu o ZIP completo na pasta do jogo.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\Atualizar-E-Jogar.ps1"
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" (
  echo.
  echo Nao foi possivel concluir a atualizacao. Veja a mensagem acima.
  pause
)
exit /b %RESULT%
