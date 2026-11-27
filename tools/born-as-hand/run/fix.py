import json,glob,sys
root=sys.argv[1]
def spots(xs,y,h): return [[x,y,h] for x in xs]
FIX={
 'bg_west_jail_interior': dict(horizon=280, ground=[720,720,720], person=[480,480,480], spots=spots([620,820,1020,1220],720,480)),
 'bg_west_river_crossing': dict(ground=[950,950,950], person=[300,300,300], spots=spots([260,560,860,1160,1460,1700],950,300)),
 'bg_japan_castle': dict(ground=[960,960,960], person=[300,300,300], spots=spots([320,640,960,1280,1600],960,300)),
 'bg_home_front': dict(ground=[990,990,990], person=[300,300,300], spots=spots([300,600,900,1200,1500,1700],990,300)),
 'bg_carthage_city': dict(ground=[1010,1010,1010], person=[300,300,300], spots=spots([700,960,1220],1010,300)),
}
DROP={'bg_thermopylae':[0,4],'bg_japan_village':[2,3],'bg_rome_villa_interior':[2],'bg_ww_iwo_jima':[5]}
n=0
for f in glob.glob(f'{root}/*/catalog.json'):
    raw=open(f,encoding='utf8').read();sep=(', ',': ') if raw.startswith('{"style": ') else (',',':');c=json.loads(raw);ch=False
    for name,v in c['backgrounds'].items():
        a=v.get('ann')
        if not a: continue
        if name in FIX: a.update(FIX[name]); ch=True; n+=1
        if name in DROP: a['spots']=[s for i,s in enumerate(a['spots']) if i not in DROP[name]]; ch=True; n+=1
    if ch: open(f,'w',encoding='utf8').write(json.dumps(c,ensure_ascii=False,separators=sep))
print('fixed',n)
