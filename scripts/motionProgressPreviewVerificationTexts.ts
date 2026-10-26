export const PROGRESS_PREVIEW_TEST = {
  HTML: '<!doctype html><html><meta charset="utf-8"><style>body{background:#17121f;color:white;font:12px Arial}.log{line-height:24px}[data-motion-log-rows]{max-height:130px;overflow:auto}.hidden{display:none}img{max-width:400px;max-height:220px}button{margin:8px}</style><div id="root"></div><script type="module" src="/fixture.js"></script></html>',
  ENTRY: `import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MotionPuppetPanel} from './src/components/motion-video/MotionPuppetPanel.tsx';
import {MotionFlowLog} from './src/components/motion-video/MotionControls.tsx';
import {MotionAssetImage} from './src/components/motion-video/MotionAssetImage.tsx';
function Fixture(){
const [preview,setPreview]=useState(null);
const [entries,setEntries]=useState([{id:'run',kind:'production',lines:['16:37:45 · [Đọc cảnh] Đang xử lý cảnh 1/31']},{id:'seo',kind:'seo',lines:['16:12:15 · Hoàn tất SEO']}]);
globalThis.appendScene=()=>setEntries(list=>list.map(row=>row.id==='run'?{...row,lines:[...row.lines,'16:39:49 · [Đọc cảnh] Đã xong cảnh 1/31']}:row));
return <><MotionFlowLog entries={entries} label={String} className='log'/><MotionPuppetPanel lang='vi' script={DATA.script} analysis={DATA.analysis} busy={false} onFrames={()=>{}} onRedoBeats={()=>{}} onRedoPlace={key=>globalThis.redoPlace=key} onOpen={value=>{globalThis.preview=value;setPreview(value)}}/>{preview&&<section id='preview'><h2>{preview.type} · {preview.id}</h2><MotionAssetImage src={preview.imageUrl} title={preview.title}/><p>{preview.description}</p></section>}<MotionAssetImage src='/missing-image' title='missing fixture'/></>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);`,
  PASSED: "Motion progress/preview passed: separate scene/SEO logs, live scene progress, midnight order, scoped assembled-set preview, stable place key, actual browser SVG decoding and explicit image errors; no AI, TTS or video.",
} as const;
