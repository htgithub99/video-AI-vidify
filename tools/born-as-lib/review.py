import sys
from PIL import Image
out=sys.argv[1]; items=sys.argv[2:]
c=Image.new('RGB',(1376*2,768*((len(items)+1)//2)),'white')
for i,n in enumerate(items):
    l,s=n.split('/'); c.paste(Image.open(f'/home/claude/lib/{l}/raw/{s}.jpg'),((i%2)*1376,(i//2)*768))
c.resize((c.width//2,c.height//2)).save(out)
