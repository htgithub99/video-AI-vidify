import os, random, sys, tempfile, zipfile, tkinter as tk
from tkinter import filedialog
def main():
    songs=max(1,int(sys.argv[1])); results=max(1,int(sys.argv[2])); root=tk.Tk(); root.withdraw(); root.attributes('-topmost',True); folders=[]
    while True:
        folder=filedialog.askdirectory(title=f'Chọn folder nhạc ({len(folders)+1}), Cancel để kết thúc')
        if not folder: break
        if folder not in folders: folders.append(folder)
    if not folders: return 2
    ext=('.mp3','.wav','.m4a','.aac','.flac','.ogg','.opus','.webm'); pools=[[os.path.join(r,f) for r,_,fs in os.walk(x) for f in fs if f.lower().endswith(ext)] for x in folders]
    if any(len(x)<songs for x in pools): return 3
    fd,target=tempfile.mkstemp(suffix='.zip',prefix='music-mixes-'); os.close(fd)
    with zipfile.ZipFile(target,'w',zipfile.ZIP_STORED) as z:
        for n in range(results):
            tracks=sum((random.sample(pool,songs) for pool in pools),[]); random.shuffle(tracks)
            for i,source in enumerate(tracks,1): z.write(source,f'Mix_{n+1:02d}/{i:02d}_{os.path.basename(source)}')
    print(target); return 0
if __name__=='__main__': sys.exit(main())
