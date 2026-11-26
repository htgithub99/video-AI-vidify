@echo off
setlocal
cd /d "%~dp0"
echo %date% %time% > render.start
call npx -y hyperframes@0.9.87 render . -f 30 -w auto -o out.mp4 > render.log 2>&1
echo %errorlevel% %date% %time% > render.done
