$ErrorActionPreference = "Stop"

$PYTHON_VERSION = "3.10.11"
$PYTHON_URL = "https://www.python.org/ftp/python/$PYTHON_VERSION/python-$PYTHON_VERSION-embed-amd64.zip"
$PIP_URL = "https://bootstrap.pypa.io/get-pip.py"
$PYTHON_EXE_NAME = "python.exe"
$PYTHON_COMMAND_FLAG = "-c"
$PYTHON_MODULE_FLAG = "-m"
$PIP_MODULE = "pip"
$PIP_INSTALL_COMMAND = "install"
$PIL_IMPORT_COMMAND = "import PIL"
$PIL_PACKAGE = "Pillow"
$PIL_INSTALL_ERROR = "Failed to install Pillow."
$PIP_INSTALL_ERROR = "Failed to install pip."
$RUNTIME_EXISTS_MESSAGE = "Python runtime already exists in {0}"
$DOWNLOAD_PYTHON_MESSAGE = "Downloading Python Embeddable {0}..."
$EXTRACT_PYTHON_MESSAGE = "Extracting Python to {0}..."
$CLEAN_ZIP_MESSAGE = "Cleaning up ZIP file..."
$ENABLE_PACKAGES_MESSAGE = "Enabling site-packages..."
$DOWNLOAD_PIP_MESSAGE = "Downloading get-pip.py..."
$INSTALL_PIP_MESSAGE = "Installing pip..."
$CLEAN_PIP_MESSAGE = "Cleaning up get-pip.py..."
$SETUP_SUCCESS_MESSAGE = "Python runtime successfully set up!"
$TARGET_RELATIVE_DIR = "python_scripts\python_runtime"
$ZIP_RELATIVE_PATH = "python_scripts\python-embed.zip"
$PIP_SCRIPT_NAME = "get-pip.py"
$PTH_FILE_NAME = "python310._pth"
$PTH_DISABLED_SITE = "#import site"
$PTH_ENABLED_SITE = "import site"
$DIRECTORY_ITEM_TYPE = "Directory"
$EXIT_SUCCESS = 0
$EXIT_FAILURE = 1

$TARGET_DIR = Join-Path $PSScriptRoot $TARGET_RELATIVE_DIR
$ZIP_PATH = Join-Path $PSScriptRoot $ZIP_RELATIVE_PATH
$PIP_SCRIPT = Join-Path $TARGET_DIR $PIP_SCRIPT_NAME

if (Test-Path (Join-Path $TARGET_DIR $PYTHON_EXE_NAME)) {
    Write-Host ($RUNTIME_EXISTS_MESSAGE -f $TARGET_DIR)
    $pythonExe = Join-Path $TARGET_DIR $PYTHON_EXE_NAME
    & $pythonExe $PYTHON_COMMAND_FLAG $PIL_IMPORT_COMMAND
    if ($LASTEXITCODE -eq $EXIT_SUCCESS) {
        exit $EXIT_SUCCESS
    }
    & $pythonExe $PYTHON_MODULE_FLAG $PIP_MODULE $PIP_INSTALL_COMMAND $PIL_PACKAGE
    if ($LASTEXITCODE -ne $EXIT_SUCCESS) {
        Write-Error $PIL_INSTALL_ERROR
        exit $EXIT_FAILURE
    }
    exit $EXIT_SUCCESS
}

Write-Host ($DOWNLOAD_PYTHON_MESSAGE -f $PYTHON_VERSION)
Invoke-WebRequest -Uri $PYTHON_URL -OutFile $ZIP_PATH

Write-Host ($EXTRACT_PYTHON_MESSAGE -f $TARGET_DIR)
if (-not (Test-Path $TARGET_DIR)) {
    New-Item -ItemType $DIRECTORY_ITEM_TYPE -Force -Path $TARGET_DIR | Out-Null
}
Expand-Archive -Path $ZIP_PATH -DestinationPath $TARGET_DIR -Force

Write-Host $CLEAN_ZIP_MESSAGE
Remove-Item -Path $ZIP_PATH -Force

Write-Host $ENABLE_PACKAGES_MESSAGE
$pthFile = Join-Path $TARGET_DIR $PTH_FILE_NAME
if (Test-Path $pthFile) {
    $content = Get-Content $pthFile
    $content = $content -replace $PTH_DISABLED_SITE, $PTH_ENABLED_SITE
    Set-Content -Path $pthFile -Value $content
}

Write-Host $DOWNLOAD_PIP_MESSAGE
Invoke-WebRequest -Uri $PIP_URL -OutFile $PIP_SCRIPT

Write-Host $INSTALL_PIP_MESSAGE
$pythonExe = Join-Path $TARGET_DIR $PYTHON_EXE_NAME
& $pythonExe $PIP_SCRIPT
if ($LASTEXITCODE -ne $EXIT_SUCCESS) {
    Write-Error $PIP_INSTALL_ERROR
    exit $EXIT_FAILURE
}

Write-Host $CLEAN_PIP_MESSAGE
Remove-Item -Path $PIP_SCRIPT -Force

& $pythonExe $PYTHON_MODULE_FLAG $PIP_MODULE $PIP_INSTALL_COMMAND $PIL_PACKAGE
if ($LASTEXITCODE -ne $EXIT_SUCCESS) {
    Write-Error $PIL_INSTALL_ERROR
    exit $EXIT_FAILURE
}

Write-Host $SETUP_SUCCESS_MESSAGE
