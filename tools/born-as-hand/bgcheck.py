import json,sys,os
from PIL import Image,ImageDraw,ImageFont
cat={}
for l in ['wildwest','ww','ancient']:
    if os.path.exists(f'lib/{l}/catalog.json'): cat.update(json.load(open(f'lib/{l}/catalog.json'))['backgrounds'])
hz=json.load(open('bgs/horizon.json'))
over=json.load(open('bgs/override.json')) if os.path.exists('bgs/override.json') else {}
names=sys.argv[2:]; out=sys.argv[1]
F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',40)
tiles=[]
for n in names:
    im=Image.open(f'bgs/{n}.png').convert('RGB'); d=ImageDraw.Draw(im)
    for y in range(0,1080,100): d.line([(0,y),(30,y)],fill=(0,0,255),width=3); d.text((34,y-20),str(y),fill=(0,0,255),font=F)
    a=(cat.get(n) or {}).get('ann') or {}
    o=over.get(n,{})
    g=o.get('ground',a.get('ground',[900,900,900]))
    h=o.get('horizon',(hz.get(n) or {}).get('horizon'))
    if h is not None: d.line([(0,h),(1920,h)],fill=(255,0,0),width=4)
    for x,gy in zip([320,960,1600],g):
        d.line([(x-120,gy),(x+120,gy)],fill=(0,200,255),width=6)
        if h is not None:
            ph=max(1,(gy-h)*1.75/1.6); d.rectangle([x-25,gy-ph,x+25,gy],outline=(255,255,0),width=6)
    d.text((60,20),n,fill=(255,255,255),font=F,stroke_width=3,stroke_fill=(0,0,0))
    tiles.append(im.resize((960,540)))
W=Image.new('RGB',(1920,540*((len(tiles)+1)//2)))
for i,t in enumerate(tiles): W.paste(t,((i%2)*960,(i//2)*540))
W.save(out,quality=85)
