import json,sys
from faster_whisper import WhisperModel
m=WhisperModel(sys.argv[1],device="cpu",compute_type="int8",cpu_threads=2)
import numpy as np,wave
wf=wave.open(sys.argv[2]);a=np.frombuffer(wf.readframes(wf.getnframes()),np.int16).astype(np.float32)/32768.0
segs,info=m.transcribe(a,language="en",word_timestamps=True,vad_filter=False,beam_size=1)
out=[]
for s in segs:
    out.append({"s":round(s.start,2),"e":round(s.end,2),"t":s.text.strip(),"w":[[w.word,round(w.start,2),round(w.end,2)] for w in (s.words or [])]})
    print(round(s.end,1),flush=True)
json.dump(out,open(sys.argv[3],"w"),ensure_ascii=False)
