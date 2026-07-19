$ErrorActionPreference = "Stop"

$PYTHON_VERSION = "3.10.11"
$PYTHON_URL = "https://www.python.org/ftp/python/$PYTHON_VERSION/python-$PYTHON_VERSION-embed-amd64.zip"
$PIP_URL = "https://bootstrap.pypa.io/get-pip.py"

$TARGET_DIR = Join-Path $PSScriptRoot "python_scripts\python_runtime"
$ZIP_PATH = Join-Path $PSScriptRoot "python_scripts\python-embed.zip"
$PIP_SCRIPT = Join-Path $TARGET_DIR "get-pip.py"

if (Test-Path (Join-Path $TARGET_DIR "python.exe")) {
    Write-Host "Python runtime already exists in $TARGET_DIR"
    exit 0
}

Write-Host "Downloading Python Embeddable $PYTHON_VERSION..."
Invoke-WebRequest -Uri $PYTHON_URL -OutFile $ZIP_PATH

Write-Host "Extracting Python to $TARGET_DIR..."
if (-not (Test-Path $TARGET_DIR)) {
    New-Item -ItemType Directory -Force -Path $TARGET_DIR | Out-Null
}
Expand-Archive -Path $ZIP_PATH -DestinationPath $TARGET_DIR -Force

Write-Host "Cleaning up ZIP file..."
Remove-Item -Path $ZIP_PATH -Force

Write-Host "Enabling site-packages (uncommenting import site in ._pth)..."
$pthFile = Join-Path $TARGET_DIR "python310._pth"
if (Test-Path $pthFile) {
    $content = Get-Content $pthFile
    $content = $content -replace '#import site', 'import site'
    Set-Content -Path $pthFile -Value $content
}

Write-Host "Downloading get-pip.py..."
Invoke-WebRequest -Uri $PIP_URL -OutFile $PIP_SCRIPT

Write-Host "Installing pip..."
$pythonExe = Join-Path $TARGET_DIR "python.exe"
& $pythonExe $PIP_SCRIPT
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install pip."
    exit 1
}

Write-Host "Cleaning up get-pip.py..."
Remove-Item -Path $PIP_SCRIPT -Force

Write-Host "Python runtime successfully set up!"
