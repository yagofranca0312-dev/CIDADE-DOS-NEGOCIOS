# QA Windows: chama BAT e script PowerShell ORIGINAL em pastas descartaveis.
# Acesso a GitHub e abertura grafica sao interceptados somente no processo QA.
param([string]$Mode='suite')
$ErrorActionPreference='Stop'
if ($Mode -eq 'child') {
  function global:Invoke-RestMethod {
    param($Uri,$Headers,$TimeoutSec)
    if($env:QA_FAIL_NETWORK -eq '1'){throw 'QA: API offline por projeto'}
    return [pscustomobject]@{sha=$env:QA_COMMIT}
  }
  function global:Invoke-WebRequest {
    param($Uri,$Headers,$UseBasicParsing,$MaximumRedirection,$TimeoutSec,$OutFile)
    if($env:QA_FAIL_NETWORK -eq '1'){throw 'QA: ZIP offline por projeto'}
    Copy-Item -LiteralPath $env:QA_FIXTURE_ZIP -Destination $OutFile -Force
    Add-Content -LiteralPath $env:QA_DOWNLOAD_LOG -Value 'ZIP_LOCAL_ONLY'
  }
  function global:Start-Process {
    param($FilePath)
    Add-Content -LiteralPath $env:QA_LAUNCH_LOG -Value ('ABRIR_LOCAL:' + $FilePath)
  }
  . (Join-Path $env:QA_INSTALL 'tools\Atualizar-E-Jogar.ps1')
  exit 99
}
if (-not $IsWindows -and $env:OS -ne 'Windows_NT') {
  throw 'Este QA de BAT/PowerShell so pode ser declarado no Windows real.'
}
$SourceRoot=Split-Path -Parent $PSScriptRoot
$WorkRoot=Join-Path ([IO.Path]::GetTempPath()) ('Cidade V300 QA BAT ' + [guid]::NewGuid().ToString('N'))
$Sha=('a'*40)
$script:Passed=0
function Test-QA([bool]$Ok,[string]$Name){
  if(-not $Ok){throw ('FAIL: '+$Name)}
  $script:Passed++
  Write-Host ('QA_BAT_PASS '+$script:Passed+' '+$Name)
}
function Write-QA([string]$Base,[string]$Rel,[string]$Value){
  $Path=Join-Path $Base $Rel
  $Parent=Split-Path -Parent $Path
  if(-not (Test-Path -LiteralPath $Parent -PathType Container)){
    New-Item -ItemType Directory -Force -Path $Parent|Out-Null
  }
  [IO.File]::WriteAllText($Path,$Value,[Text.UTF8Encoding]::new($false))
}
function Read-QA([string]$Base,[string]$Rel){
  return [IO.File]::ReadAllText((Join-Path $Base $Rel))
}
function New-QAContext([string]$Name,[string]$InstalledVersion='2.9.0',
  [bool]$NoIndex=$false,[bool]$CopyConflict=$false){
  $Base=Join-Path $WorkRoot ($Name+' com espacos')
  $Install=Join-Path $Base 'install com espacos'
  $Repo=Join-Path $Base 'archive-source\repo-artificial'
  New-Item -ItemType Directory -Force -Path $Install,$Repo|Out-Null
  Write-QA $Install 'index.html' ('HTML_ANTIGO_'+$Name)
  Write-QA $Install 'package.json' ('{"version":"'+$InstalledVersion+'"}')
  Write-QA $Install 'saves/progresso.save.json' 'SAVE_PRIVADO_INTACTO'
  Write-QA $Install 'backups/progresso.backup.json' 'BACKUP_PRIVADO_INTACTO'
  Write-QA $Install '_atualizador/privado.txt' 'DIRETORIO_PRIVADO_INTACTO'
  Write-QA $Install 'extra.save.json' 'ARQUIVO_PRIVADO_INTACTO'
  Write-QA $Install '.env' 'SEGREDO_FICTICIO_INTACTO'
  Write-QA $Install 'notas.txt' 'LOCAL_EXTRA'
  Copy-Item -LiteralPath (Join-Path $SourceRoot 'ATUALIZAR_E_JOGAR.bat') -Destination (Join-Path $Install 'ATUALIZAR_E_JOGAR.bat')
  Copy-Item -LiteralPath (Join-Path $SourceRoot 'JOGAR_OFFLINE.bat') -Destination (Join-Path $Install 'JOGAR_OFFLINE.bat')
  $Tool=Join-Path $Install 'tools'
  New-Item -ItemType Directory -Force -Path $Tool|Out-Null
  Copy-Item -LiteralPath (Join-Path $SourceRoot 'tools\Atualizar-E-Jogar.ps1') -Destination (Join-Path $Tool 'Atualizar-E-Jogar.ps1')
  if(-not $NoIndex){Write-QA $Repo 'index.html' ('HTML_NOVO_'+$Name)}
  Write-QA $Repo 'package.json' '{"version":"3.0.0-alpha.1"}'
  Write-QA $Repo 'docs/new.txt' 'DOCUMENTO_NOVO'
  Write-QA $Repo 'saves/progresso.save.json' 'NAO_COPIAR_SAVE'
  Write-QA $Repo 'backups/progresso.backup.json' 'NAO_COPIAR_BACKUP'
  Write-QA $Repo '_atualizador/privado.txt' 'NAO_COPIAR_PRIVADO'
  Write-QA $Repo '.env' 'NAO_COPIAR_ENV'
  Write-QA $Repo 'extra.save.json' 'NAO_COPIAR_ARQUIVO_PRIVADO'
  if($CopyConflict){
    Write-QA $Install 'zz_blocker' 'ARQUIVO_NAO_DIRETORIO'
    Write-QA $Repo 'zz_blocker/child.txt' 'DEVE_FALHAR'
  }
  $Zip=Join-Path $Base 'fixture.zip'
  Compress-Archive -LiteralPath $Repo -DestinationPath $Zip -Force
  return [pscustomobject]@{
    Base=$Base;Install=$Install;Zip=$Zip;
    DownloadLog=(Join-Path $Base 'download.log');
    LaunchLog=(Join-Path $Base 'launch.log')
  }
}
function Run-Updater($Context,[bool]$NetworkFail=$false){
  $env:QA_INSTALL=$Context.Install
  $env:QA_FIXTURE_ZIP=$Context.Zip
  $env:QA_COMMIT=$Sha
  $env:QA_FAIL_NETWORK=if($NetworkFail){'1'}else{'0'}
  $env:QA_DOWNLOAD_LOG=$Context.DownloadLog
  $env:QA_LAUNCH_LOG=$Context.LaunchLog
  $Output=(& powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $PSCommandPath -Mode child 2>&1 | Out-String)
  return [pscustomobject]@{Exit=$LASTEXITCODE;Output=$Output}
}
function Hash-QA([string]$Base,[string]$Rel){
  return (Get-FileHash -LiteralPath (Join-Path $Base $Rel) -Algorithm SHA256).Hash
}
function Protected-QA($C){
  return ('saves/progresso.save.json','backups/progresso.backup.json',
    '_atualizador/privado.txt','extra.save.json','.env'|ForEach-Object{Hash-QA $C.Install $_})-join ';'
}
function Count-QA([string]$Log){
  if(-not (Test-Path -LiteralPath $Log)){return 0}
  return @((Get-Content -LiteralPath $Log)).Count
}
try{
  New-Item -ItemType Directory -Force -Path $WorkRoot|Out-Null
  # BAT original em caminhos com espacos: casos de falha e de chamada do PowerShell.
  $Offline=Join-Path $WorkRoot 'offline sem html'
  Write-QA $Offline 'JOGAR_OFFLINE.bat' (Read-QA $SourceRoot 'JOGAR_OFFLINE.bat')
  $Cmd=('echo.|call "'+(Join-Path $Offline 'JOGAR_OFFLINE.bat')+'"')
  $Output=(& cmd.exe /d /c $Cmd 2>&1 | Out-String)
  Test-QA (($LASTEXITCODE -eq 1)-and ($Output -match 'index.html nao foi encontrado')) 'JOGAR_OFFLINE detecta ausencia de HTML sem abrir jogo'
  Write-QA $Offline 'index.html' 'HTML_FICTICIO'
  $Cmd=('call "'+(Join-Path $Offline 'JOGAR_OFFLINE.bat')+'"')
  $Output=(& cmd.exe /d /c $Cmd 2>&1 | Out-String)
  Test-QA (($LASTEXITCODE -eq 0)-and ((Read-QA $Offline 'index.html') -eq 'HTML_FICTICIO')) 'JOGAR_OFFLINE abre somente copia ficticia em caminho com espacos'

  $Batch=Join-Path $WorkRoot 'batch em pasta com espacos'
  Write-QA $Batch 'ATUALIZAR_E_JOGAR.bat' (Read-QA $SourceRoot 'ATUALIZAR_E_JOGAR.bat')
  $Cmd=('echo.|call "'+(Join-Path $Batch 'ATUALIZAR_E_JOGAR.bat')+'"')
  $Output=(& cmd.exe /d /c $Cmd 2>&1 | Out-String)
  Test-QA (($LASTEXITCODE -eq 1)-and ($Output -match 'Arquivo do atualizador nao encontrado')) 'BAT update detecta ausencia de script'
  Write-QA $Batch 'tools/Atualizar-E-Jogar.ps1' 'Set-Content -Path (Join-Path $PSScriptRoot "stub.called") -Value "CHILD_OK";exit 0'
  $Cmd=('call "'+(Join-Path $Batch 'ATUALIZAR_E_JOGAR.bat')+'"')
  $Output=(& cmd.exe /d /c $Cmd 2>&1 | Out-String)
  Test-QA (($LASTEXITCODE -eq 0)-and ((Read-QA $Batch 'tools/stub.called').Trim() -eq 'CHILD_OK')) 'BAT chama PowerShell stub e repassa sucesso 0'
  Write-QA $Batch 'tools/Atualizar-E-Jogar.ps1' 'exit 2'
  $Cmd=('echo.|call "'+(Join-Path $Batch 'ATUALIZAR_E_JOGAR.bat')+'"')
  $Output=(& cmd.exe /d /c $Cmd 2>&1 | Out-String)
  Test-QA ($LASTEXITCODE -eq 2) 'BAT repassa codigo 2 em falha'

  # O script PowerShell real roda em child process com REST, ZIP e navegador interceptados.
  $Good=New-QAContext 'sucesso'
  $PrivateBefore=Protected-QA $Good
  $OldHtml=Read-QA $Good.Install 'index.html'
  $Result=Run-Updater $Good
  Test-QA ($Result.Exit -eq 0) ('Script original aplica ZIP artificial: '+$Result.Output)
  Test-QA ((Read-QA $Good.Install 'index.html') -eq 'HTML_NOVO_sucesso') 'Atualizador substitui HTML na pasta de teste'
  Test-QA ((Read-QA $Good.Install 'docs/new.txt') -eq 'DOCUMENTO_NOVO') 'Atualizador entrega documentos novos'
  Test-QA ((Read-QA $Good.Install '_atualizador/versao.txt').Trim() -eq $Sha) 'Atualizador registra SHA so apos todas copias'
  Test-QA ((Protected-QA $Good) -eq $PrivateBefore) 'Arquivos privados e saves locais preservados byte-a-byte'
  $Backups=@(Get-ChildItem -LiteralPath (Join-Path $Good.Install '_atualizador/backups') -Directory)
  Test-QA (($Backups.Count -gt 0)-and
    ([IO.File]::ReadAllText((Join-Path $Backups[0].FullName 'index.html')) -eq $OldHtml)) 'HTML antigo preservado em pasta interna de rollback'
  Test-QA ((Count-QA $Good.LaunchLog) -eq 1) 'Abertura de jogo foi somente local e interceptada'
  $Downloads=Count-QA $Good.DownloadLog
  $Again=Run-Updater $Good
  Test-QA (($Again.Exit -eq 0)-and ((Count-QA $Good.DownloadLog) -eq $Downloads)) 'Mesmo SHA nao baixa ZIP novamente'

  $Network=New-QAContext 'rede-falha'
  $Before=Read-QA $Network.Install 'index.html'
  $Result=Run-Updater $Network $true
  Test-QA (($Result.Exit -eq 2)-and ((Read-QA $Network.Install 'index.html') -eq $Before)) 'Falha API preserva jogo anterior e exit 2'
  Test-QA (((Count-QA $Network.LaunchLog) -eq 1)-and
    (-not (Test-Path (Join-Path $Network.Install '_atualizador/versao.txt')))) 'Falha API tenta apenas abrir HTML offline anterior'

  $Downgrade=New-QAContext 'downgrade' '3.2.0'
  $Before=Read-QA $Downgrade.Install 'index.html'
  $Result=Run-Updater $Downgrade
  Test-QA (($Result.Exit -eq 2)-and ($Result.Output -match 'anterior a instalada')-and
    ((Read-QA $Downgrade.Install 'index.html') -eq $Before)) 'Script recusa downgrade da instalacao'

  $Invalid=New-QAContext 'zip-sem-index' '2.9.0' $true
  $Before=Read-QA $Invalid.Install 'index.html'
  $Result=Run-Updater $Invalid
  Test-QA (($Result.Exit -eq 2)-and ((Read-QA $Invalid.Install 'index.html') -eq $Before)) 'ZIP sem HTML nao modifica instalacao'

  $Broken=New-QAContext 'erro-copia' '2.9.0' $false $true
  $Before=Read-QA $Broken.Install 'index.html'
  $PrivateBefore=Protected-QA $Broken
  $Result=Run-Updater $Broken
  Test-QA (($Result.Exit -eq 2)-and ((Read-QA $Broken.Install 'index.html') -eq $Before)) 'Erro apos copiar arquivo reverte HTML de origem'
  Test-QA (((Protected-QA $Broken) -eq $PrivateBefore)-and
    (-not (Test-Path (Join-Path $Broken.Install '_atualizador/versao.txt')))) 'Rollback nao altera saves e nao cria stamp de versao'

  Write-Host ('V300_WINDOWS_BAT_UPDATER_QA ' + ([pscustomobject]@{
    status='PASS';assertions=$script:Passed;platform=[Environment]::OSVersion.VersionString;
    networkUsed=$false;userSaveUsed=$false;installationTouched=$false;
    scenarios=@('BAT offline com/sem HTML','BAT update com/sem script','PS1 original e ZIP local',
      'saves protegidos','backup HTML','sem download repetido','erro API','downgrade',
      'ZIP sem HTML','rollback de erro de copia');
    limitation='Script original com comandos de rede e abertura mockados. Nenhum save pessoal ou associacao grafica foi validado.'
  } | ConvertTo-Json -Compress))
}finally{
  Remove-Item -LiteralPath $WorkRoot -Recurse -Force -ErrorAction SilentlyContinue
}
