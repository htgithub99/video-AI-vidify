cd /home/claude/four
export PLAYWRIGHT=/home/claude/app/node_modules/playwright/index.mjs CHROME=/usr/bin/google-chrome
mkdir -p /tmp/shs
for v in jesse billy redbaron sherlock spartacus audie musashi caesar; do
  T=$(python3 -c "
import json,re
sh=json.load(open('render_short/$v/shots.json'))
ts={round(s['t0']+min(1.2,(s['t1']-s['t0'])*0.7),2) for s in sh}
h=open('render_short/$v/index.html').read()
ts|={round(float(x)+0.7,2) for x in re.findall(r'BORN\\.(?:plateIn|labelIn)\\(tl,[a-z]+,([0-9.]+)\\)',h)}
end=max(s['t1'] for s in sh)
print(' '.join('%.2f'%t for t in sorted(ts) if t<end))")
  rm -rf /tmp/sn_$v
  (cd render_short/$v && BORN_VERT=1 timeout 900 node /home/claude/kitv2/snap.mjs . /tmp/sn_$v 1 $T > /tmp/sn_$v.log 2>&1)
  python3 /tmp/tile.py /tmp/sn_$v /tmp/shs/$v.jpg $T
done
python3 -c "
from PIL import Image
vs='jesse billy redbaron sherlock spartacus audie musashi caesar'.split()
ims=[Image.open(f'/tmp/shs/{v}.jpg').convert('RGB') for v in vs]
ims[0].save('/mnt/user-data/outputs/anh_canh/tat_ca_short_v5.pdf',save_all=True,append_images=ims[1:])"
echo done > /tmp/sheets.done
