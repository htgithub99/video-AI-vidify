cd /home/claude/four
export PLAYWRIGHT=/home/claude/app/node_modules/playwright/index.mjs CHROME=/usr/bin/google-chrome
for v in jesse billy redbaron sherlock spartacus audie musashi caesar; do
  (cd /home/claude/kitv2 && BORN_ASSETS=/home/claude/four/assets/$v node born_build.mjs /home/claude/four/voice/$v/plan.json /home/claude/four/render/$v > /tmp/build_$v.log 2>&1)
  rm -f "/home/claude/four/render/${v:?}"/bg_*.png; cp /home/claude/kitv2/kit.js render/$v/kit.js
  cmp -s /home/claude/lvoice/$v.wav render/$v/voice.wav || cp /home/claude/lvoice/$v.wav render/$v/voice.wav
  (cd render/$v && timeout 2400 node /home/claude/kitv2/check.mjs . /tmp/chk_$v texts.json faces_all.json > /tmp/chk_render_$v.log 2>&1; rm -rf /tmp/chk_$v)
done
echo done > /tmp/longs.done
