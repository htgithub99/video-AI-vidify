@echo off
setlocal
cd /d "%~dp0"
if exist out.mp4 if exist render.done findstr /b /c:"0 " render.done >nul && exit /b 0
set "TEMP=%~dp0..\_hf_tmp_%RANDOM%%RANDOM%"
set "TMP=%TEMP%"
mkdir "%TEMP%" 2>nul
echo %date% %time% > render.start
call npx -y hyperframes@0.9.87 render . -f 30 -w auto --crf 20 --max-bitrate 12M --keyframe-interval 2 -o out.mp4 > render.log 2>&1
set "rc=%errorlevel%"
if not "%rc%"=="0" findstr /c:"temporary frame storage" render.log >nul && (
  move /y render.log render_first.log >nul
  call npx -y hyperframes@0.9.87 render . -f 30 -w auto --workers 1 --crf 20 --max-bitrate 12M --keyframe-interval 2 -o out.mp4 > render.log 2>&1
)
set "rc=%errorlevel%"
rmdir /s /q "%TEMP%" 2>nul
echo %rc% %date% %time% > render.done
