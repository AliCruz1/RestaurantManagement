Param(
  [string]$Owner = 'AliCruz1',
  [string]$Repo = 'RestaurantManagement'
)

Write-Host "=== HostMate: Push to GitHub ===" -ForegroundColor Cyan
Write-Host "Owner: $Owner  Repo: $Repo" -ForegroundColor DarkCyan

function Exec($cmd) {
  Write-Host ("$ " + $cmd) -ForegroundColor DarkGray
  & powershell -NoLogo -NoProfile -Command $cmd
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $cmd"
  }
}

# Pre-flight checks
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "git is not installed or not in PATH."; exit 1
}
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "GitHub CLI (gh) is not installed. Install: https://cli.github.com/"; exit 1
}

# Ensure we are at repo root (contains package.json)
if (-not (Test-Path -LiteralPath "package.json")) {
  Write-Error "Run this script from the project root (where package.json is located)."; exit 1
}

try {
  # Init repo if needed
  & git rev-parse --is-inside-work-tree 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Exec "git init"
  }

  # Basic identity fallback (use GitHub noreply if not set)
  $uName = (git config user.name 2>$null)
  if (-not $uName) { Exec "git config user.name '$Owner'" }
  $uEmail = (git config user.email 2>$null)
  if (-not $uEmail) { Exec "git config user.email '$Owner@users.noreply.github.com'" }

  # Make sure env files aren’t tracked
  if (Test-Path -LiteralPath ".env.local") {
    & git rm --cached .env.local 2>$null | Out-Null
  }

  Exec "git add -A"
  & git commit -m "chore: public-ready: ignore envs, docs, safe config" 2>$null | Out-Null
  # ignore if nothing to commit

  # Ensure branch name
  Exec "git branch -M master"

  # Ensure remote and push
  $remoteUrl = (git remote get-url origin 2>$null)
  if (-not $remoteUrl) {
    # Create the repo under the user account; requires gh auth
    Write-Host "Creating GitHub repo $Owner/$Repo via gh…" -ForegroundColor Yellow
    Exec "gh auth status"
    Exec "gh repo create $Owner/$Repo --public --source . --remote origin --push"
  } else {
    Exec "git push -u origin master"
  }

  Write-Host "✅ Pushed to GitHub: https://github.com/$Owner/$Repo" -ForegroundColor Green
} catch {
  Write-Error $_
  exit 1
}
