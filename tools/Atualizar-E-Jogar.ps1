# Cidade dos Negocios - atualizador local (Windows PowerShell 5.1+)
# Repo publico: download do snapshot de um commit especifico no GitHub.
# Nao faz upload nem altera salvamentos pessoais, .git, node_modules ou backups.
$ErrorActionPreference = 'Stop'
$Repo = 'yagofranca0312-dev/CIDADE-DOS-NEGOCIOS'
$Branch = 'main'
$Root = Split-Path -Parent $PSScriptRoot
$Game = Join-Path $Root 'index.html'
$PrivateDir = Join-Path $Root '_atualizador'
$VersionFile = Join-Path $PrivateDir 'versao.txt'
$TempDir = Join-Path ([System.IO.Path]::GetTempPath()) ('cidade-negocios-update-' + [guid]::NewGuid().ToString('N'))
$StampedVersion = ''
$Success = $false

function Write-Info([string]$Message) { Write-Host ('[Cidade dos Negocios] ' + $Message) }
function Open-LocalGame {
    if (Test-Path -LiteralPath $Game -PathType Leaf) {
        Write-Info 'Abrindo o jogo local no navegador...'
        Start-Process -FilePath $Game
    } else {
        Write-Warning ('O jogo ainda nao existe nesta pasta: ' + $Game)
    }
}
function Is-Protected([string]$Relative) {
    $Parts = $Relative -split '[\\/]'
    foreach ($Part in $Parts) {
        if ($Part -in @('.git', 'node_modules', '_atualizador', 'saves', 'backups', '.env')) { return $true }
    }
    if ($Relative -match '(?i)\.(save|backup)\.json$') { return $true }
    return $false
}

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Write-Info ('Repositorio: https://github.com/' + $Repo)
    Write-Info ('Pasta do jogo: ' + $Root)
    New-Item -ItemType Directory -Force -Path $PrivateDir | Out-Null
    if (Test-Path -LiteralPath $VersionFile) {
        $StampedVersion = (Get-Content -LiteralPath $VersionFile -Raw).Trim()
    }

    $Headers = @{'User-Agent' = 'CidadeDosNegociosUpdater/1.0'; 'Accept' = 'application/vnd.github+json'}
    Write-Info 'Consultando a versao oficial no GitHub...'
    $Commit = Invoke-RestMethod -Uri ('https://api.github.com/repos/' + $Repo + '/commits/' + $Branch) -Headers $Headers -TimeoutSec 30
    if (-not ($Commit.sha -match '^[0-9a-fA-F]{40}$')) { throw 'O GitHub nao retornou um commit SHA valido.' }
    $NewVersion = $Commit.sha.ToLowerInvariant()

    if ($StampedVersion -eq $NewVersion -and (Test-Path -LiteralPath $Game -PathType Leaf)) {
        Write-Info ('Ja esta atualizado (' + $NewVersion.Substring(0, 12) + ').')
        $Success = $true
    } else {
        New-Item -ItemType Directory -Force -Path $TempDir | Out-Null
        $Archive = Join-Path $TempDir 'release.zip'
        $Extract = Join-Path $TempDir 'release'
        Write-Info ('Baixando versao ' + $NewVersion.Substring(0, 12) + '...')
        $DownloadUrl = 'https://api.github.com/repos/' + $Repo + '/zipball/' + $NewVersion
        Invoke-WebRequest -Uri $DownloadUrl -Headers $Headers -UseBasicParsing -MaximumRedirection 5 -TimeoutSec 120 -OutFile $Archive
        Expand-Archive -LiteralPath $Archive -DestinationPath $Extract -Force
        $Dirs = @(Get-ChildItem -LiteralPath $Extract -Directory)
        if ($Dirs.Count -ne 1) { throw 'Estrutura inesperada do arquivo ZIP do GitHub.' }
        $Source = $Dirs[0].FullName
        if (-not (Test-Path -LiteralPath (Join-Path $Source 'index.html') -PathType Leaf)) {
            throw 'O download nao contem index.html. Atualizacao cancelada.'
        }
        $Files = @(Get-ChildItem -LiteralPath $Source -Recurse -File | Where-Object {
            $Rel = $_.FullName.Substring($Source.Length + 1)
            -not (Is-Protected $Rel)
        })
        if ($Files.Count -lt 2) { throw 'Pacote do GitHub incompleto. Atualizacao cancelada.' }

        $Backup = Join-Path $PrivateDir ('backups\' + (Get-Date -Format 'yyyyMMdd_HHmmss_fff'))
        $Created = New-Object 'System.Collections.Generic.List[string]'
        $BackedUp = New-Object 'System.Collections.Generic.List[string]'
        $Changed = 0
        try {
            foreach ($File in $Files) {
                $Relative = $File.FullName.Substring($Source.Length + 1)
                $Target = Join-Path $Root $Relative
                $PreviouslyExisted = Test-Path -LiteralPath $Target -PathType Leaf
                if ($PreviouslyExisted) {
                    $OldHash = (Get-FileHash -LiteralPath $Target -Algorithm SHA256).Hash
                    $NewHash = (Get-FileHash -LiteralPath $File.FullName -Algorithm SHA256).Hash
                    if ($OldHash -eq $NewHash) { continue }
                    $BackupFile = Join-Path $Backup $Relative
                    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $BackupFile) | Out-Null
                    Copy-Item -LiteralPath $Target -Destination $BackupFile -Force
                    $BackedUp.Add($Relative)
                } else {
                    $Created.Add($Relative)
                }
                New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Target) | Out-Null
                Copy-Item -LiteralPath $File.FullName -Destination $Target -Force
                $Changed++
            }
            # Versao so e registrada depois de todas as copias terminarem.
            Set-Content -LiteralPath $VersionFile -Value $NewVersion -Encoding Ascii
            $Success = $true
            Write-Info ('Atualizacao concluida. Arquivos novos/alterados: ' + $Changed)
            if ($BackedUp.Count -gt 0) { Write-Info ('Backup anterior: ' + $Backup) }
        } catch {
            Write-Warning ('Erro durante a copia; revertendo arquivos: ' + $_.Exception.Message)
            foreach ($Relative in $BackedUp) {
                $BackupFile = Join-Path $Backup $Relative
                if (Test-Path -LiteralPath $BackupFile) {
                    $Target = Join-Path $Root $Relative
                    Copy-Item -LiteralPath $BackupFile -Destination $Target -Force
                }
            }
            foreach ($Relative in $Created) {
                $Target = Join-Path $Root $Relative
                if (Test-Path -LiteralPath $Target -PathType Leaf) { Remove-Item -LiteralPath $Target -Force }
            }
            throw
        }
    }
} catch {
    Write-Warning ('Nao foi possivel atualizar: ' + $_.Exception.Message)
    Write-Info 'Se houver um index.html local, ele sera aberto sem atualizar.'
} finally {
    if (Test-Path -LiteralPath $TempDir) {
        Remove-Item -LiteralPath $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Open-LocalGame
if (-not (Test-Path -LiteralPath $Game -PathType Leaf)) { exit 1 }
if ($Success) { exit 0 }
exit 2
