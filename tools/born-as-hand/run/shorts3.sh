cd /home/claude/four
export PLAYWRIGHT=/home/claude/app/node_modules/playwright/index.mjs CHROME=/usr/bin/google-chrome
for v in jesse billy redbaron sherlock spartacus audie musashi caesar; do
  b=$(python3 -c "import json;p=json.load(open('voice/${v}_short/plan.json'));e=p['beats'][-1];print(e['t0'],e['cast'][0]['sprite'])")
  python3 make_short.py $v $b > /tmp/build_short_$v.log 2>&1; cp /tmp/svoice/$v.wav render_short/$v/voice.wav; cp /home/claude/kitv2/kit.js render_short/$v/kit.js
  rm -f "/home/claude/four/render_short/${v:?}"/bg_*.png
  (cd render_short/$v && BORN_VERT=1 timeout 900 node /home/claude/kitv2/check.mjs . /tmp/chk_$v texts.json faces_all.json > /tmp/chk_render_short_$v.log 2>&1; rm -rf /tmp/chk_$v)
done
echo done > /tmp/shorts3.done
