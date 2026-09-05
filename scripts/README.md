# TruckPaper Import Scripts

Quick reference for re-establishing the CDP (Chrome DevTools Protocol)
session after a reboot, plus the commands used to import inventory.

## 1. Restart Chrome with remote debugging enabled

Every `--cdp` command below drives your **actual, visible** Chrome browser
via Playwright — it is not headless. That browser must be launched with a
debug port open before any `--cdp` command will work.

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

Leave that Chrome window open in the background for the whole session.

### Confirm it's actually listening

```powershell
curl http://localhost:9222/json/version
```

A `200 OK` with browser/version JSON means it's ready. If this fails or
hangs, Chrome either isn't running with the flag, or something else is
already bound to port 9222 — close all Chrome windows fully first
(check Task Manager for lingering `chrome.exe` processes) and relaunch
with the command above.

## 2. Environment / prerequisites

- Run all commands from the project root: `C:\Users\HP\Documents\dev\primeFleet`
- Postgres must be reachable (check your `.env` / VPS SSH tunnel if using one)
- `npx tsx <script>` requires no separate install step — `tsx` runs
  TypeScript directly

## 3. Import a whole category page

```powershell
npx tsx scripts/import-truckpaper.ts --url <category-listing-url> --limit 2 --delay 4000 --category "<Category Name>" --cdp --write
```

Drop `--write` first to dry-run and confirm listings parse correctly
before saving anything.

### Known category URLs

| Category            | URL                                                                                          |
|----------------------|-----------------------------------------------------------------------------------------------|
| Box Trucks           | https://www.truckpaper.com/listings/for-sale/box-trucks/16004                                |
| Flatbed Trucks       | https://www.truckpaper.com/listings/for-sale/flatbed-trucks/16019                            |
| Drop Deck Trailers   | https://www.truckpaper.com/listings/for-sale/drop-deck-trailers-semi-trailers/12             |
| Day Cab Trucks       | https://www.truckpaper.com/listings/for-sale/day-cab-trucks/16013                            |
| Sleeper Trucks       | https://www.truckpaper.com/listings/for-sale/sleeper-trucks/16045                            |
| Flatbed Trailers     | https://www.truckpaper.com/listings/for-sale/flatbed-trailers-semi-trailers/14               |
| Tow Trucks           | https://www.truckpaper.com/listings/for-sale/tow-trucks/16060                                |
| Tank Trailers        | https://www.truckpaper.com/listings/for-sale/tank-trailers-semi-trailers/21                  |
| Reefer Trailers      | https://www.truckpaper.com/listings/for-sale/reefer-trailers-semi-trailers/20                |
| Dry Van Trailers     | https://www.truckpaper.com/listings/for-sale/dry-van-trailers-semi-trailers/15022            |

## 4. Import one specific listing

Use this when you want a single named truck, rather than a batch from a
category page:

```powershell
npx tsx scripts/import-truckpaper.ts --listing-url "<truckpaper detail page URL>" --category "<Category Name>" --cdp --write
```

Example:

```powershell
npx tsx scripts/import-truckpaper.ts --listing-url "https://www.truckpaper.com/listing/for-sale/193205993/2027-benson-48-ft-x-102-in-aluminum" --category "Flatbed Trailers" --cdp --write
```

## 5. Cleanup / dedupe scripts

```powershell
# List all trucks, flag likely duplicate groups (same manufacturer+model+year)
npx tsx scripts/cleanup-inventory.ts report

# Fix the corrupted PF-000124 seed record (bad scraped description/specs)
npx tsx scripts/cleanup-inventory.ts fix-pf124

# Preview which duplicates would be removed (keeps the one with more specs/images)
npx tsx scripts/cleanup-inventory.ts dedupe

# Actually delete the duplicates
npx tsx scripts/cleanup-inventory.ts dedupe apply

# Delete one specific truck by id
npx tsx scripts/cleanup-inventory.ts delete <truckId>
```

## 6. Notes / gotchas

- `--cdp` commands **require** the Chrome debug session from step 1 to be
  running — restart it after every reboot or Chrome crash.
- `populateDetailImages` navigates the same shared Chrome tab across
  listings; each navigation now waits for full `load` (not just `commit`)
  before reading meta tags, to avoid attributing one listing's
  description/specs to a different truck (a bug hit early on with
  PF-000123 / PF-000124).
- `stockNumber` is the upsert key — re-running an import for a listing
  already in the DB **updates** it rather than creating a duplicate.
- Images always save to `public/uploads/trucks/`, based on
  `process.cwd()` — always run these scripts from the project root, not
  from inside `scripts/`.



  ## Others VPS

  `ssh -N -L 5533:127.0.0.1:5533 vps`


  ## Move to production
  `scp -r .\public\uploads\trucks\* vps:/opt/primefleet/public/uploads/trucks/`

## Powershell
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