import sys
from PIL import Image
src,out,times=sys.argv[1],sys.argv[2],sys.argv[3:]
ims=[Image.open(f"{src}/t{t}.jpg").convert('RGB').resize((270,480)) for t in times]
cols=min(10,len(ims));rows=(len(ims)+cols-1)//cols
sheet=Image.new('RGB',(cols*270,rows*480),'black')
for i,im in enumerate(ims):sheet.paste(im,((i%cols)*270,(i//cols)*480))
sheet.save(out,quality=85)
