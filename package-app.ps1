. (Join-Path $PSScriptRoot "scripts/powershellTexts.ps1")

$ErrorActionPreference = $WORKSPACE_SCRIPT_TEXT.STOP

Write-Host $WORKSPACE_SCRIPT_TEXT.SYMBOL -ForegroundColor Cyan
Write-Host $WORKSPACE_SCRIPT_TEXT.VALUE_1_BUILDING_WEB_ASSETS_AND_BACKEND_BYTECODE -ForegroundColor Cyan
Write-Host $WORKSPACE_SCRIPT_TEXT.SYMBOL -ForegroundColor Cyan

npm run build

Write-Host $WORKSPACE_SCRIPT_TEXT.SYMBOL_12 -ForegroundColor Cyan
Write-Host $WORKSPACE_SCRIPT_TEXT.VALUE_2_PREPARING_STANDALONE_RELEASE_DIRECTORY -ForegroundColor Cyan
Write-Host $WORKSPACE_SCRIPT_TEXT.SYMBOL -ForegroundColor Cyan

$ReleaseDir = $WORKSPACE_SCRIPT_TEXT.RELEASE_VIDEO_WORKSPACE_WIN32_X64
$AppResourceDir = "$ReleaseDir\resources\app"

if (Test-Path $ReleaseDir) {
    Write-Host $WORKSPACE_SCRIPT_TEXT.CLEANING_EXISTING_RELEASE_DIRECTORY
    Remove-Item -Path $ReleaseDir -Recurse -Force -ErrorAction SilentlyContinue
}

New-Item -ItemType Directory -Path $AppResourceDir -Force | Out-Null

Write-Host $WORKSPACE_SCRIPT_TEXT.COPYING_ELECTRON_BINARIES
Copy-Item -Path $WORKSPACE_SCRIPT_TEXT.NODE_MODULES_ELECTRON_DIST -Destination $ReleaseDir -Recurse -Force

if (Test-Path "$ReleaseDir\electron.exe") {
    Rename-Item -Path "$ReleaseDir\electron.exe" -NewName $WORKSPACE_SCRIPT_TEXT.VIDEO_WORKSPACE_EXE -Force
}

Write-Host $WORKSPACE_SCRIPT_TEXT.SYMBOL_12 -ForegroundColor Cyan
Write-Host $WORKSPACE_SCRIPT_TEXT.VALUE_3_COPYING_APPLICATION_CODE_AND_RUNTIME_MODULES -ForegroundColor Cyan
Write-Host $WORKSPACE_SCRIPT_TEXT.SYMBOL -ForegroundColor Cyan

Copy-Item -Path $WORKSPACE_SCRIPT_TEXT.DIST -Destination $AppResourceDir -Recurse -Force
Copy-Item -Path $WORKSPACE_SCRIPT_TEXT.ELECTRON -Destination $AppResourceDir -Recurse -Force
Copy-Item -Path $WORKSPACE_SCRIPT_TEXT.PACKAGE_JSON -Destination $AppResourceDir -Force

Write-Host $WORKSPACE_SCRIPT_TEXT.COPYING_REQUIRED_NODE_MODULES
New-Item -ItemType Directory -Path "$AppResourceDir\node_modules" -Force | Out-Null

robocopy $WORKSPACE_SCRIPT_TEXT.NODE_MODULES "$AppResourceDir\node_modules" /E /XD $WORKSPACE_SCRIPT_TEXT.GIT $WORKSPACE_SCRIPT_TEXT.CACHE $WORKSPACE_SCRIPT_TEXT.TMP /XF $WORKSPACE_SCRIPT_TEXT.TS $WORKSPACE_SCRIPT_TEXT.MAP /NFL /NDL /NJH /NJS /nc /ns /np
if ($LASTEXITCODE -ge 8) {
    Write-Warning "Robocopy warning code: $LASTEXITCODE"
}

Write-Host $WORKSPACE_SCRIPT_TEXT.SYMBOL_12 -ForegroundColor Cyan
Write-Host $WORKSPACE_SCRIPT_TEXT.VALUE_4_INJECTING_EXTRA_RESOURCES_FFMPEG_DATABASE_SCRIPTS_ASSETS -ForegroundColor Cyan
Write-Host $WORKSPACE_SCRIPT_TEXT.SYMBOL -ForegroundColor Cyan

if (Test-Path $WORKSPACE_SCRIPT_TEXT.FFMPEG_EXE_31) {
    Copy-Item $WORKSPACE_SCRIPT_TEXT.FFMPEG_EXE_31 -Destination "$ReleaseDir\resources\" -Force
} elseif (Test-Path $WORKSPACE_SCRIPT_TEXT.C_FFMPEG_BIN_FFMPEG_EXE) {
    Copy-Item $WORKSPACE_SCRIPT_TEXT.C_FFMPEG_BIN_FFMPEG_EXE -Destination "$ReleaseDir\resources\" -Force
}

if (Test-Path $WORKSPACE_SCRIPT_TEXT.DATABASE_DB) {
    Copy-Item $WORKSPACE_SCRIPT_TEXT.DATABASE_DB -Destination "$ReleaseDir\resources\" -Force
}

if (Test-Path $WORKSPACE_SCRIPT_TEXT.PYTHON_SCRIPTS) {
    Copy-Item -Path $WORKSPACE_SCRIPT_TEXT.PYTHON_SCRIPTS -Destination "$ReleaseDir\resources\" -Recurse -Force
}

if (Test-Path $WORKSPACE_SCRIPT_TEXT.MOTION_ENGINE) {
    Copy-Item -Path $WORKSPACE_SCRIPT_TEXT.MOTION_ENGINE -Destination "$ReleaseDir\resources\" -Recurse -Force
}

if (Test-Path $WORKSPACE_SCRIPT_TEXT.DIST_REMOTION) {
    Copy-Item -Path $WORKSPACE_SCRIPT_TEXT.DIST_REMOTION -Destination "$ReleaseDir/resources/" -Recurse -Force
}

if (Test-Path $WORKSPACE_SCRIPT_TEXT.ASSETS) {
    Copy-Item -Path $WORKSPACE_SCRIPT_TEXT.ASSETS -Destination $AppResourceDir -Recurse -Force
    Copy-Item -Path $WORKSPACE_SCRIPT_TEXT.ASSETS -Destination "$ReleaseDir\resources\" -Recurse -Force
}


if (Test-Path "$ReleaseDir\resources\default_app.asar") {
    try {
        Remove-Item "$ReleaseDir\resources\default_app.asar" -Force -ErrorAction SilentlyContinue
    } catch {}
}

Write-Host $WORKSPACE_SCRIPT_TEXT.SYMBOL_12 -ForegroundColor Cyan
Write-Host $WORKSPACE_SCRIPT_TEXT.VALUE_5_CREATING_PORTABLE_ZIP_ARCHIVE -ForegroundColor Cyan
Write-Host $WORKSPACE_SCRIPT_TEXT.SYMBOL -ForegroundColor Cyan

$ZipFile = $WORKSPACE_SCRIPT_TEXT.RELEASE_VIDEO_WORKSPACE_V1_0_0_WIN64_ZIP
if (Test-Path $ZipFile) {
    Remove-Item $ZipFile -Force -ErrorAction SilentlyContinue
}

try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory((Resolve-Path $ReleaseDir).Path, (Join-Path (Get-Location).Path $ZipFile))
} catch {
    Write-Warning $WORKSPACE_SCRIPT_TEXT.ZIP_FALLBACK_COMPRESSION
    Compress-Archive -Path "$ReleaseDir\*" -DestinationPath $ZipFile -Force -ErrorAction SilentlyContinue
}

Write-Host $WORKSPACE_SCRIPT_TEXT.SYMBOL_12 -ForegroundColor Green
Write-Host $WORKSPACE_SCRIPT_TEXT.BUILD_HOAN_TAT_THANH_CONG -ForegroundColor Green
Write-Host " Executable: $ReleaseDir\Video Workspace.exe" -ForegroundColor Green
Write-Host " Portable ZIP: $ZipFile" -ForegroundColor Green
Write-Host $WORKSPACE_SCRIPT_TEXT.SYMBOL -ForegroundColor Green

