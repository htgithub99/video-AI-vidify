import pathlib,json,subprocess,sys
from PIL import Image,ImageDraw,ImageFont
sys.stdout.reconfigure(encoding='utf-8')
root=pathlib.Path.cwd();out=root/'docs/video-references/mam-com-cung-audit-20261027';p=root/'storage/output/motion-video'; video=p/'mam-com-cung-bung-vao-hien-16x9-draft-1793078527782.mp4'
s=json.loads((p/'story-jobs/69216e40-c6eb-467b-8a97-74f9674fb29e.json').read_text(encoding='utf-8-sig'))['job']['result'];v=json.loads((p/'story-jobs/a27a1a26-d441-4fad-b631-93fd037bede9.json').read_text(encoding='utf-8-sig'))['job']['result']
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20); small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',15)
rows=[];cursor=.25
for i,(beat,dur) in enumerate(zip(s['beats'],v['durations'])):
 start=0 if i==0 else cursor;end=cursor+dur; t=(start+end)/2;f=out/f'scene-{i+1:02}.jpg'
 subprocess.run(['C:/ffmpeg/bin/ffmpeg.exe','-v','error','-ss',str(t),'-i',str(video),'-frames:v','1','-q:v','2','-y',str(f)],check=True)
 rows.append({'index':i+1,'start':start,'end':118.9 if i == len(s['beats']) - 1 else end,'sample':t,'text':beat['narration'],'scene':s['gen']['remotion']['scenes'][beat['id']][0],'file':f.name});cursor=end
for page in range(3):
 board=Image.new('RGB',(1280,1410),'#181c22');draw=ImageDraw.Draw(board)
 for k,row in enumerate(rows[page*6:(page+1)*6]):
  x=(k%2)*640;y=(k//2)*470;img=Image.open(out/row['file']);img.thumbnail((640,360));board.paste(img,(x,y+30))
  draw.text((x+10,y+5),f"C{row['index']:02} | {row['start']:.2f}-{row['end']:.2f}s | sample {row['sample']:.2f}s",font=font,fill='white')
  text=row['text'];lines=[];line=''
  for word in text.split():
   if draw.textlength(line+' '+word,font=small)>615:lines.append(line);line=word
   else:line=(line+' '+word).strip()
  lines.append(line)
  for n,line in enumerate(lines[:4]):draw.text((x+10,y+394+n*18),line,font=small,fill='#eeeeee')
 board.save(out/f'board-{page+1}.jpg',quality=90)
(out/'timeline.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8');print('Extracted',len(rows),'scenes; end',cursor)
