<#
.SYNOPSIS
  Full TruckPaper import pipeline across every known category (from
  scripts/import-categories.ts's CATEGORIES list):
  batch import -> clean descriptions -> sync images to VPS -> restart container.

.PARAMETER Limit
  Max listings per category. Default 5.

.PARAMETER Delay
  Delay between listings within a category, in ms. Default 4000.

.PARAMETER DryRun
  Preview only — skips --write on the batch import and skips the
  cleanup/sync/restart steps entirely.

.EXAMPLE
  .\scripts\sync-all-categories.ps1 -DryRun

.EXAMPLE
  .\scripts\sync-all-categories.ps1 -Limit 10
#>

param(
  [int]$Limit = 5,
  [int]$Delay = 4000,
  [switch]$DryRun,
  [string]$VpsAlias = "vps",
  [string]$RemoteUploadsPath = "/opt/primefleet/public/uploads/trucks/",
  [string]$RemoteComposeDir = "/opt/primefleet"
)

$ErrorActionPreference = "Stop"

function Step($msg) {
  Write-Host "`n=== $msg ===" -ForegroundColor Cyan
}

# --- Preflight checks ---
Step "Checking Chrome debug port (9222)"
try {
  $null = Invoke-WebRequest -Uri "http://localhost:9222/json/version" -UseBasicParsing -TimeoutSec 3
} catch {
  Write-Error "Chrome debug port 9222 not reachable. Launch Chrome first:`n  Get-Process chrome | Stop-Process -Force`n  & `"C:\Program Files\Google\Chrome\Application\chrome.exe`" --remote-debugging-port=9222 --user-data-dir=`"C:\Users\HP\chrome-debug-profile`""
  exit 1
}

Step "Checking DATABASE_URL"
if (-not $env:DATABASE_URL) {
  Write-Error "`$env:DATABASE_URL is not set for this session. Set it (and make sure the SSH tunnel to the VPS is running) before continuing."
  exit 1
}

# --- 1. Batch import across all categories ---
Step "Running import-categories.ts across all known categories (limit=$Limit, delay=$Delay)"
$importArgs = @("--limit", $Limit, "--delay", $Delay)
if (-not $DryRun) { $importArgs += "--write" }

npx tsx scripts/import-categories.ts @importArgs
if ($LASTEXITCODE -ne 0) { Write-Error "Batch import failed."; exit 1 }

if ($DryRun) {
  Write-Host "`nDry run complete — skipping cleanup/sync/restart." -ForegroundColor Yellow
  exit 0
}

# --- 2. Clean descriptions (once, after all categories are in) ---
Step "Cleaning descriptions"
npx tsx scripts/clean-descriptions.ts --write
if ($LASTEXITCODE -ne 0) { Write-Error "Description cleanup failed."; exit 1 }

# --- 3. Sync images to VPS (once) ---
Step "Syncing images to VPS"
scp -r .\public\uploads\trucks\* "${VpsAlias}:${RemoteUploadsPath}"
if ($LASTEXITCODE -ne 0) { Write-Error "Image sync failed."; exit 1 }

# --- 4. Restart container (once) ---
Step "Restarting primefleet-app on VPS"
ssh $VpsAlias "cd $RemoteComposeDir && docker compose restart primefleet-app"
if ($LASTEXITCODE -ne 0) { Write-Error "Container restart failed."; exit 1 }

Write-Host "`nDone. All categories imported, descriptions cleaned, images synced, container restarted." -ForegroundColor Green
