set -eo pipefail
v=$1; n=$2
cd /home/claude/four && python3 build_plan.py $v | tail -1
cd /home/claude/kitv2 && BORN_ASSETS=/home/claude/four/assets/$v node born_build.mjs /home/claude/four/voice/$v/plan.json /home/claude/four/render/$v 2>&1 | tail -1 | cut -c1-500
cd /home/claude/four && python3 - $v <<'P'
import json,sys
v=sys.argv[1]
s=json.load(open(f'render/{v}/shots.json')); t=json.load(open(f'render/{v}/texts.json'))
times=[]
for sh in s:
    if sh.get('kind')=='chapter': continue
    ev=[e for e in t if e['id']==sh['id']]
    tt=min(ev[0]['t']+0.7, ev[0]['end']-0.05, sh['t1']-0.05) if ev else (sh['t0']+sh['t1'])/2
    times.append(round(tt,2))
open(f'/tmp/{v}_t.txt','w').write(' '.join(map(str,times)))
P
mkdir -p /home/claude/four/snaps$n/$v
cd /home/claude/kitv2 && PLAYWRIGHT=/home/claude/app/node_modules/playwright/index.mjs CHROME=/usr/bin/google-chrome node snap.mjs /home/claude/four/render/$v /home/claude/four/snaps$n/$v $(cat /tmp/${v}_t.txt) > /tmp/snap_$v.log 2>&1
cd /home/claude/four && sed -i "s#snaps[0-9]*/{v}#snaps$n/{v}#" tile.py && python3 tile.py $v
