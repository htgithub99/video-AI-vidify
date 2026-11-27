import os, shutil, sys, tarfile
src = sys.argv[1]
tmp = "/tmp/place3"
shutil.rmtree(tmp, ignore_errors=True)
os.makedirs(tmp)
tarfile.open(src).extractall(tmp)
for f in sorted(os.listdir(tmp)):
    v, sid = f[:-4].split("__")
    os.makedirs(f"/home/claude/four/raw3/{v}", exist_ok=True)
    shutil.copy(f"{tmp}/{f}", f"/home/claude/four/raw3/{v}/{sid}.png")
    print(v, sid)
