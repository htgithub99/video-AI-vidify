set -eo pipefail
v=$1
music=$2
out=$3
src=$v
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
ffmpeg -y -loglevel error -i "$src" -stream_loop -1 -i "$music" -filter_complex "[0:a]asplit[v1][v2];[1:a]atrim=0:$dur,asetpts=N/SR/TB,volume=-17dB,afade=t=in:d=2,afade=t=out:st=$(python3 -c "print(max(0,$dur-4))"):d=4[m];[m][v1]sidechaincompress=threshold=0.03:ratio=6:attack=80:release=600[duck];[v2][duck]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5[a]" -map "[a]" -ar 48000 "$out"
