# Continuum one-shot installer (Windows / PowerShell).
# Installs/updates into %USERPROFILE%\continuum.
# Never touches Electron userData (settings, tokens, transcripts)
# or project CONTINUUM.md files.
#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$RepoUrl    = if ($env:CONTINUUM_REPO_URL) { $env:CONTINUUM_REPO_URL } else { "https://github.com/Haroon966/Continuum.git" }
$Branch     = if ($env:CONTINUUM_BRANCH)   { $env:CONTINUUM_BRANCH }   else { "main" }
$InstallDir = if ($env:CONTINUUM_HOME)     { $env:CONTINUUM_HOME }     else { Join-Path $env:USERPROFILE "continuum" }
$BinDir     = if ($env:CONTINUUM_BIN_DIR)  { $env:CONTINUUM_BIN_DIR }  else { Join-Path $env:USERPROFILE ".local\bin" }
$Launcher   = Join-Path $BinDir "continuum.cmd"
$MinNodeMajor = 20

function Write-Info([string]$Message) { Write-Host "==> $Message" }
function Write-Warn([string]$Message) { Write-Warning $Message }
function Die([string]$Message) {
  Write-Error $Message
  exit 1
}

function Test-Command([string]$Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Show-NodeHints {
  Write-Host @"

Install Node.js 20+ (22 recommended), then re-run this script.
  https://nodejs.org/

Hints (Windows):
  winget install OpenJS.NodeJS.LTS
  # or download the installer from nodejs.org
  # Git (required): winget install Git.Git

"@
}

function Assert-Node {
  if (-not (Test-Command "node")) {
    Write-Warn "Node.js not found on PATH."
    Show-NodeHints
    Die "Node.js $MinNodeMajor+ is required."
  }
  if (-not (Test-Command "npm")) {
    Write-Warn "npm not found on PATH (Node install may be incomplete)."
    Show-NodeHints
    Die "npm is required."
  }

  $version = (& node -v).TrimStart("v")
  $major = [int]($version.Split(".")[0])
  if ($major -lt $MinNodeMajor) {
    Write-Warn "Node.js v$version is too old (need $MinNodeMajor+)."
    Show-NodeHints
    Die "Please upgrade Node.js."
  }

  $npmVer = (& npm -v)
  Write-Info "Node v$version, npm $npmVer"
}

function Assert-Git {
  if (-not (Test-Command "git")) {
    Write-Warn "git not found on PATH."
    Write-Host @"

Install Git, then re-run this script.
  https://git-scm.com/download/win
  winget install Git.Git

"@
    Die "git is required."
  }
}

function Update-OrClone {
  $gitDir = Join-Path $InstallDir ".git"
  if (Test-Path $gitDir) {
    Write-Info "Updating existing install at $InstallDir"
    Push-Location $InstallDir
    try {
      & git fetch --prune origin $Branch
      if ($LASTEXITCODE -ne 0) { Die "git fetch failed." }
      & git checkout $Branch
      if ($LASTEXITCODE -ne 0) { Die "git checkout failed." }
      & git pull --ff-only origin $Branch
      if ($LASTEXITCODE -ne 0) { Die "git pull failed." }
    } finally {
      Pop-Location
    }
  } elseif (Test-Path $InstallDir) {
    Die "$InstallDir exists but is not a Continuum git clone. Move/rename it, then re-run."
  } else {
    Write-Info "Cloning Continuum into $InstallDir"
    & git clone --branch $Branch --single-branch $RepoUrl $InstallDir
    if ($LASTEXITCODE -ne 0) { Die "git clone failed." }
  }
}

function Install-Deps {
  Write-Info "Installing npm dependencies"
  Push-Location $InstallDir
  try {
    & npm install
    if ($LASTEXITCODE -ne 0) { Die "npm install failed." }
  } finally {
    Pop-Location
  }
}

function Ensure-UserPath([string]$Directory) {
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  if (-not $userPath) { $userPath = "" }
  $parts = $userPath -split ";" | Where-Object { $_ -and $_.Trim() -ne "" }
  $normalized = $Directory.TrimEnd("\")
  $already = $parts | Where-Object { $_.TrimEnd("\") -ieq $normalized }
  if (-not $already) {
    $newPath = if ($userPath.Trim() -eq "") { $Directory } else { "$userPath;$Directory" }
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Info "Added $Directory to your user PATH (new terminals pick this up)."
  }
  # Current session
  if (($env:Path -split ";") -notcontains $Directory) {
    $env:Path = "$Directory;$env:Path"
  }
}

function Install-Launcher {
  New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
  $cmd = @"
@echo off
cd /d "$InstallDir"
npm run electron:dev -- %*
"@
  Set-Content -Path $Launcher -Value $cmd -Encoding ASCII
  Write-Info "Launcher installed: $Launcher"
  Ensure-UserPath $BinDir
}

function Show-StartHelp {
  Write-Host @"

Continuum is ready.

Start anytime:
  continuum
  # or:
  cd $InstallDir
  npm run electron:dev

Install dir:  $InstallDir
User data:    Electron userData (settings/token/transcripts) — not modified by this installer
Projects:     CONTINUUM.md lives in each project folder you open — not modified by this installer

"@
}

function Test-Interactive {
  try {
    return [Environment]::UserInteractive -and -not [Console]::IsInputRedirected
  } catch {
    return $false
  }
}

function Maybe-Start {
  if (-not (Test-Interactive)) {
    Write-Info "Non-interactive stdin — skipping start prompt."
    return
  }
  $reply = Read-Host "Start Continuum now? [y/N]"
  if ($reply -match '^(y|yes)$') {
    Write-Info "Starting Continuum…"
    & $Launcher
  } else {
    Write-Info "Skipped start. Run: continuum"
  }
}

Assert-Git
Assert-Node
Update-OrClone
Install-Deps
Install-Launcher
Show-StartHelp
Maybe-Start
