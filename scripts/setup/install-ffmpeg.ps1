. (Join-Path $PSScriptRoot "../powershellTexts.ps1")
$ErrorActionPreference = $WORKSPACE_SCRIPT_TEXT.STOP
$WorkspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$TemporaryRoot = [IO.Path]::GetFullPath((Join-Path $WorkspaceRoot "storage/tmp"))
$StageDirectory = [IO.Path]::GetFullPath((Join-Path $TemporaryRoot ("ffmpeg-install-" + [guid]::NewGuid().ToString("N"))))
if (-not $StageDirectory.StartsWith($TemporaryRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw "Installer staging path must remain inside storage/tmp." }
$TargetFile = Join-Path $WorkspaceRoot $WORKSPACE_SCRIPT_TEXT.FFMPEG_EXE
New-Item -ItemType Directory -Path $StageDirectory -Force | Out-Null
try {
    $ZipPath = Join-Path $StageDirectory "ffmpeg.zip"
    $ArchiveDirectory = Join-Path $StageDirectory "archive"
    $Url = $WORKSPACE_SCRIPT_TEXT.HTTPS_GITHUB_COM_BTBN_FFMPEG_BUILDS_RELEASES_DOWNLOAD_LATEST_FFMP
    Write-Host ($WORKSPACE_SCRIPT_TEXT.DOWNLOAD_FFMPEG -f $Url)
    Invoke-WebRequest -Uri $Url -OutFile $ZipPath
    Write-Host $WORKSPACE_SCRIPT_TEXT.EXTRACTING_FFMPEG
    Expand-Archive -LiteralPath $ZipPath -DestinationPath $ArchiveDirectory -Force
    $Binary = Get-ChildItem -LiteralPath $ArchiveDirectory -Filter "ffmpeg.exe" -File -Recurse | Select-Object -First 1
    if (-not $Binary) { throw "The downloaded archive contains no ffmpeg.exe." }
    New-Item -ItemType Directory -Path (Split-Path $TargetFile -Parent) -Force | Out-Null
    Copy-Item -LiteralPath $Binary.FullName -Destination $TargetFile -Force
    Write-Host $WORKSPACE_SCRIPT_TEXT.FFMPEG_HAS_BEEN_SUCCESSFULLY_INSTALLED_IN_THE_PROJECT_ROOT
} finally {
    if (-not $StageDirectory.StartsWith($TemporaryRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe installer cleanup path." }
    Remove-Item -LiteralPath $StageDirectory -Recurse -Force
}
