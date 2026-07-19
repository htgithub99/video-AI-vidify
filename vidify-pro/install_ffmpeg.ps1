$url = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
$zipPath = "ffmpeg.zip"
Write-Host "Downloading FFmpeg from $url ..."
Invoke-WebRequest -Uri $url -OutFile $zipPath
Write-Host "Extracting FFmpeg ..."
Expand-Archive -Path $zipPath -DestinationPath "ffmpeg_temp" -Force
Write-Host "Copying ffmpeg.exe to project root ..."
Copy-Item -Path "ffmpeg_temp\*\bin\ffmpeg.exe" -Destination ".\ffmpeg.exe"
Write-Host "Cleaning up temp files ..."
Remove-Item -Path $zipPath -Force
Remove-Item -Path "ffmpeg_temp" -Recurse -Force
Write-Host "FFmpeg has been successfully installed in the project root."
