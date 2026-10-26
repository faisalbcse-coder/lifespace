$ErrorActionPreference = "Stop"

$workspaceRoot = $PSScriptRoot | Split-Path -Parent
$staging = Join-Path $env:TEMP "pms_live_staging"
$zipPath = Join-Path $workspaceRoot "personal-management-software-live.zip"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Building Lightweight Standalone Package " -ForegroundColor Cyan
Write-Host " (Zero-Install, Ultra Low Resource, 1 Process) " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Clean previous staging
if (Test-Path $staging) {
    Remove-Item -Recurse -Force $staging
}
New-Item -ItemType Directory -Path $staging | Out-Null

# 2. Check standalone folder
$standaloneRoot = Join-Path $workspaceRoot ".next\standalone"
if (-not (Test-Path $standaloneRoot)) {
    Write-Host "Standalone build not found. Running npm run build..." -ForegroundColor Yellow
    npm run build
}

# 3. Copy standalone contents
Write-Host "Copying standalone application bundle..." -ForegroundColor Green
Get-ChildItem -Path $standaloneRoot | ForEach-Object {
    Copy-Item -Recurse $_.FullName (Join-Path $staging $_.Name)
}

# 4. Copy .next/static into staging/.next/static (Required by Next.js standalone)
Write-Host "Copying static assets (.next/static)..." -ForegroundColor Green
$stagingStatic = Join-Path (Join-Path $staging ".next") "static"
if (Test-Path $stagingStatic) {
    Remove-Item -Recurse -Force $stagingStatic
}
Copy-Item -Recurse (Join-Path $workspaceRoot ".next\static") $stagingStatic

# 5. Copy public directory if exists
$publicDir = Join-Path $workspaceRoot "public"
if (Test-Path $publicDir) {
    Write-Host "Copying public directory..." -ForegroundColor Green
    $destPub = Join-Path $staging "public"
    if (-not (Test-Path $destPub)) {
        New-Item -ItemType Directory -Path $destPub | Out-Null
    }
    Copy-Item -Recurse (Join-Path $publicDir "*") $destPub -Force
}

# 6. Copy prisma directory (schema and sqlite db)
Write-Host "Copying prisma schema and database..." -ForegroundColor Green
$stagingPrisma = Join-Path $staging "prisma"
if (-not (Test-Path $stagingPrisma)) {
    New-Item -ItemType Directory -Path $stagingPrisma | Out-Null
}
Copy-Item (Join-Path $workspaceRoot "prisma\schema.prisma") (Join-Path $stagingPrisma "schema.prisma")
if (Test-Path (Join-Path $workspaceRoot "prisma\dev.db")) {
    Copy-Item (Join-Path $workspaceRoot "prisma\dev.db") (Join-Path $stagingPrisma "prod.db")
}

# 7. Copy configurations & guides
Write-Host "Copying deployment configs..." -ForegroundColor Green
Copy-Item (Join-Path $workspaceRoot "DEPLOYMENT_GUIDE.md") (Join-Path $staging "DEPLOYMENT_GUIDE.md")
if (Test-Path (Join-Path $workspaceRoot ".env.example")) {
    Copy-Item (Join-Path $workspaceRoot ".env.example") (Join-Path $staging ".env.example")
}

# Create a ready-to-use production .env
$prodEnvContent = @"
PORT=3000
NODE_ENV=production
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET="$( [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N') )"
"@
Set-Content -Path (Join-Path $staging ".env") -Value $prodEnvContent

# 8. Create zip using tar.exe (Ensures standard Linux POSIX '/' forward-slash paths)
if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}

Write-Host "Creating Linux-compatible zip package: $zipPath ..." -ForegroundColor Yellow
Push-Location $staging
try {
    tar.exe -a -c -f $zipPath *
} finally {
    Pop-Location
}

# Cleanup staging
Remove-Item -Recurse -Force $staging

$zipItem = Get-Item $zipPath
Write-Host "==========================================" -ForegroundColor Green
Write-Host " SUCCESS! Standalone Live Package Ready!" -ForegroundColor Green
Write-Host " Location: $($zipItem.FullName)" -ForegroundColor Green
Write-Host " File Size: $([math]::Round($zipItem.Length / 1MB, 2)) MB" -ForegroundColor Green
Write-Host " Zero npm install required on server!" -ForegroundColor Green
Write-Host " Runs with a single process (node server.js)" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
