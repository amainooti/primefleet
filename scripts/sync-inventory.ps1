<#
.SYNOPSIS
  Full TruckPaper import pipeline for one category:
  import -> clean descriptions -> sync images to VPS -> restart container.

.PARAMETER Url
  TruckPaper category listing URL.

.PARAMETER Category
  Display name of the category in Prime Fleet (e.g. "Tow Trucks").

.PARAMETER Pages
  Number of listing pages to fetch. Default 2.

.PARAMETER Limit
  Max listings to import. Default 20.

.PARAMETER Delay
  Delay between page fetches in ms. Default 4000.

.PARAMETER DryRun
  Preview only — skips --write on the import and skips the cleanup/sync/restart
  steps entirely. Use this first to sanity-check the listings.

.EXAMPLE
  .\scripts\sync-inventory.ps1 -Url "https://www.truckpaper.com/listings/for-sale/tow-trucks/16060" -Category "Tow Trucks" -DryRun

.EXAMPLE
  .\scripts\sync-inventory.ps1 -Url "https://www.truckpaper.com/listings/for-sale/tow-trucks/16060" -Category "Tow Trucks"
#>

param(
  [Parameter(Mandatory=$true)][string]$Url,
  [Parameter(Mandatory=$true)][string]$Category,
  [int]$Pages = 2,
  [int]$Limit = 20,
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

# --- 1. Import ---
Step "Importing: $Category"
$importArgs = @(
  "tsx", "scripts/import-truckpaper.ts",
  "--url", $Url,
  "--pages", $Pages,
  "--limit", $Limit,
  "--delay", $Delay,
  "--category", $Category,
  "--cdp"
)
if (-not $DryRun) { $importArgs += "--write" }

npx @importArgs
if ($LASTEXITCODE -ne 0) { Write-Error "Import step failed."; exit 1 }

if ($DryRun) {
  Write-Host "`nDry run complete — nothing written, skipping cleanup/sync/restart." -ForegroundColor Yellow
  exit 0
}

# --- 2. Clean descriptions ---
Step "Cleaning descriptions"
npx tsx scripts/clean-descriptions.ts --write
if ($LASTEXITCODE -ne 0) { Write-Error "Description cleanup failed."; exit 1 }

# --- 3. Sync images to VPS ---
Step "Syncing images to VPS"
scp -r .\public\uploads\trucks\* "${VpsAlias}:${RemoteUploadsPath}"
if ($LASTEXITCODE -ne 0) { Write-Error "Image sync failed."; exit 1 }

# --- 4. Restart container ---
Step "Restarting primefleet-app on VPS"
ssh $VpsAlias "cd $RemoteComposeDir && docker compose restart primefleet-app"
if ($LASTEXITCODE -ne 0) { Write-Error "Container restart failed."; exit 1 }

Write-Host "`nDone. `"$Category`" imported, descriptions cleaned, images synced, container restarted." -ForegroundColor Green
