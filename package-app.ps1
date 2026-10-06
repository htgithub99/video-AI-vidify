# Build and Package Script for Video Workspace Desktop App
$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " 1. Building Web Assets and Backend Bytecode..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

npm run build

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host " 2. Preparing Standalone Release Directory..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$ReleaseDir = "release\Video-Workspace-win32-x64"
$AppResourceDir = "$ReleaseDir\resources\app"

if (Test-Path $ReleaseDir) {
    Write-Host "Cleaning existing release directory..."
    Remove-Item -Path $ReleaseDir -Recurse -Force -ErrorAction SilentlyContinue
}

New-Item -ItemType Directory -Path $AppResourceDir -Force | Out-Null

Write-Host "Copying Electron binaries..."
Copy-Item -Path "node_modules\electron\dist\*" -Destination $ReleaseDir -Recurse -Force

if (Test-Path "$ReleaseDir\electron.exe") {
    Rename-Item -Path "$ReleaseDir\electron.exe" -NewName "Video Workspace.exe" -Force
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host " 3. Copying Application Code and Runtime Modules..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

Copy-Item -Path "dist" -Destination $AppResourceDir -Recurse -Force
Copy-Item -Path "electron" -Destination $AppResourceDir -Recurse -Force
Copy-Item -Path "package.json" -Destination $AppResourceDir -Force

Write-Host "Copying required node_modules..."
New-Item -ItemType Directory -Path "$AppResourceDir\node_modules" -Force | Out-Null

robocopy "node_modules" "$AppResourceDir\node_modules" /E /XD ".git" ".cache" ".tmp" /XF "*.ts" "*.map" /NFL /NDL /NJH /NJS /nc /ns /np
if ($LASTEXITCODE -ge 8) {
    Write-Warning "Robocopy warning code: $LASTEXITCODE"
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host " 4. Injecting Extra Resources (FFmpeg, Database, Scripts, Assets)..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

if (Test-Path "ffmpeg.exe") {
    Copy-Item "ffmpeg.exe" -Destination "$ReleaseDir\resources\" -Force
} elseif (Test-Path "C:\ffmpeg\bin\ffmpeg.exe") {
    Copy-Item "C:\ffmpeg\bin\ffmpeg.exe" -Destination "$ReleaseDir\resources\" -Force
}

if (Test-Path "database.db") {
    Copy-Item "database.db" -Destination "$ReleaseDir\resources\" -Force
}

if (Test-Path "python_scripts") {
    Copy-Item -Path "python_scripts" -Destination "$ReleaseDir\resources\" -Recurse -Force
}

if (Test-Path "motion-engine") {
    Copy-Item -Path "motion-engine" -Destination "$ReleaseDir\resources\" -Recurse -Force
}

if (Test-Path "assets") {
    Copy-Item -Path "assets" -Destination $AppResourceDir -Recurse -Force
    Copy-Item -Path "assets" -Destination "$ReleaseDir\resources\" -Recurse -Force
}

# Remove default_app.asar if present to avoid conflict and save space
if (Test-Path "$ReleaseDir\resources\default_app.asar") {
    try {
        Remove-Item "$ReleaseDir\resources\default_app.asar" -Force -ErrorAction SilentlyContinue
    } catch {}
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host " 5. Creating Portable ZIP Archive..." -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$ZipFile = "release\Video-Workspace-v1.0.0-win64.zip"
if (Test-Path $ZipFile) {
    Remove-Item $ZipFile -Force -ErrorAction SilentlyContinue
}

try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory((Resolve-Path $ReleaseDir).Path, (Join-Path (Get-Location).Path $ZipFile))
} catch {
    Write-Warning "ZIP fallback compression..."
    Compress-Archive -Path "$ReleaseDir\*" -DestinationPath $ZipFile -Force -ErrorAction SilentlyContinue
}

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host " BUILD HOAN TAT THANH CONG!" -ForegroundColor Green
Write-Host " Executable: $ReleaseDir\Video Workspace.exe" -ForegroundColor Green
Write-Host " Portable ZIP: $ZipFile" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

