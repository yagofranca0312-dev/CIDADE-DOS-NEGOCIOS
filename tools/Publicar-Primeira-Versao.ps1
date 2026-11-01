# Cidade dos Negocios - publicacao INICIAL para repositorio publico VAZIO.
# Nunca executa force push, nunca apaga arquivos e so publica caminhos permitidos.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Remote = 'https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS.git'
$Allowed = @(
  '.gitignore',
  'README.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'index.html',
  'src/core/game.js',
  'src/ui/app.js',
  'src/shell/theme.css',
  'src/shell/index.template.html',
  'tools/build.mjs',
  'tests/game.test.mjs',
  'package.json',
  'ATUALIZAR_E_JOGAR.bat',
  'JOGAR_OFFLINE.bat',
  'PUBLICAR_PRIMEIRA_VERSAO.bat',
  'tools/Atualizar-E-Jogar.ps1',
  'tools/Publicar-Primeira-Versao.ps1',
  'docs/00_CHECKPOINT_CP000.md',
  'docs/ARQUITETURA.md',
  'docs/DECISOES.md',
  'docs/ROADMAP.md',
  'docs/VALIDACAO_CP000.md',
  'docs/ATUALIZADOR_WINDOWS.md',
  'tests/structure.test.mjs',
  'tests/updater.test.mjs',
  '.github/workflows/ci.yml',
  '.github/CODEOWNERS',
  '.github/ISSUE_TEMPLATE/bug_report.yml',
  '.github/ISSUE_TEMPLATE/feature_request.yml',
  '.github/pull_request_template.md'
)
try {
  Write-Host '=== CIDADE DOS NEGOCIOS: PUBLICACAO INICIAL ===' -ForegroundColor Cyan
  Write-Host ('Diretorio: ' + $Root)
  Write-Host ('Destino: ' + $Remote)
  Write-Warning 'REPOSITORIO PUBLICO: todos os arquivos enviados poderao ser vistos na internet.'
  Write-Host 'Somente os arquivos da lista permitida serao publicados. Saves e segredos ficam fora.'
  $Answer = (Read-Host 'Confirma a publicacao da primeira versao jogavel nesse repositorio PUBLICO? Digite SIM').Trim()
  if ($Answer -cne 'SIM') { throw 'Cancelado pelo usuario; nada foi publicado.' }
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Git nao encontrado. Instale o Git for Windows e repita.' }
  foreach ($File in $Allowed) {
    if (-not (Test-Path -LiteralPath (Join-Path $Root $File) -PathType Leaf)) { throw ('Arquivo obrigatorio ausente: ' + $File) }
  }
  Set-Location -LiteralPath $Root
  Write-Host 'Verificando acesso ao GitHub...'
  $RemoteHeads = & git ls-remote --heads $Remote main 2>&1
  if ($LASTEXITCODE -ne 0) { throw ('Nao foi possivel consultar o GitHub: ' + ($RemoteHeads | Out-String)) }
  if ($RemoteHeads -and (($RemoteHeads | Out-String).Trim().Length -gt 0)) {
    throw 'O repositorio ja contem uma branch main. Publicacao inicial cancelada para nao sobrescrever conteudo. Use um fluxo Git normal.'
  }
  if (-not (Test-Path -LiteralPath (Join-Path $Root '.git'))) {
    & git init -b main
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao inicializar Git.' }
  } else {
    $ActualBranch = (& git branch --show-current).Trim()
    if ($ActualBranch -ne 'main') { throw ('Esta pasta ja usa a branch ' + $ActualBranch + '. Nao vou trocar branches automaticamente.') }
  }
  $Origin = (& git remote get-url origin 2>$null)
  if ($LASTEXITCODE -ne 0) {
    & git remote add origin $Remote
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao definir o repositorio remoto.' }
  } elseif (($Origin | Out-String).Trim() -ne $Remote) {
    throw 'A pasta Git ja aponta para outro repositorio. Nenhuma alteracao automatica realizada.'
  }
  & git add -- $Allowed
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao preparar os arquivos permitidos.' }
  & git diff --cached --quiet
  if ($LASTEXITCODE -eq 1) {
    & git commit -m 'feat(game): Cidade dos Negocios 1 v1.0.0-rc.1'
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar o commit. Verifique git config user.name/user.email.' }
  } elseif ($LASTEXITCODE -ne 0) {
    throw 'Erro ao conferir os arquivos preparados.'
  }
  Write-Host 'Publicando... O Git pode abrir uma janela de login do GitHub.'
  & git push -u origin main
  if ($LASTEXITCODE -ne 0) { throw 'O push nao foi concluido. Se for necessario, autentique-se no GitHub e execute o publicador novamente.' }
  Write-Host ('OK: https://github.com/yagofranca0312-dev/CIDADE-DOS-NEGOCIOS') -ForegroundColor Green
  exit 0
} catch {
  Write-Host ('ERRO: ' + $_.Exception.Message) -ForegroundColor Red
  exit 1
}
