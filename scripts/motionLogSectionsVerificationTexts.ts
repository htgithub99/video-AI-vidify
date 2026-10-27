export const MOTION_LOG_SECTION_TEST = {
  HTML: '<!doctype html><html><meta charset="utf-8"><link rel="stylesheet" href="/fixture.css"><style>body{background:#100e18;color:#eee;font:14px Arial;margin:20px}main{max-width:760px;margin:auto}button{cursor:pointer}</style><div id="root"></div><script type="module" src="/fixture.js"></script></html>',
  ENTRY: `import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MotionFlowLog} from './src/components/motion-video/MotionControls.tsx';
import {MOTION_STORY_CONFIG} from './src/constants/motionVideo.ts';
function Fixture(){
const [entries,setEntries]=useState(JSON.parse(localStorage.getItem('fixture-log-sections')||'null')||DATA.entries);
const [job,setJob]=useState(DATA.job);
globalThis.appendLog=()=>setEntries(list=>{const next=list.map(entry=>entry.id==='run'?{...entry,lines:[...entry.lines,'16:39:00 · [Ghép hình từ kho][Đọc cảnh] Đã xong cảnh 3/31']}:entry);localStorage.setItem('fixture-log-sections',JSON.stringify(next));return next});
globalThis.failLog=()=>{setJob({...DATA.job,status:'error',activeAi:{}});setEntries(list=>list.map(entry=>entry.id==='run'?{...entry,lines:[...entry.lines,'16:40:00 · [Ghép hình từ kho] Lỗi: catalogKey must depict this exact noun phrase']}:entry))};
return <main className={MOTION_STORY_CONFIG.BUSY_LOCK_CLASS}><h1>Nhật ký tạo video</h1><MotionFlowLog entries={entries} job={job}/></main>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);`,
  ENTRIES: [
    {
      id: "run",
      kind: "production",
      lines: [
        "15:00:00 · [Phân tích nội dung] Đã phân tích câu chuyện và giữ chủ đề nguồn.",
        "15:01:00 · [Phân tích nội dung] Hoàn tất",
        "16:01:00 · [Viết kịch bản] Viết lời dẫn chương 1/2",
        "16:10:00 · [Viết kịch bản] Hoàn tất",
        "16:11:00 · [Ghép hình từ kho][Phân cảnh] Đang xử lý nhóm 1/3 · đã chốt 0 cảnh.",
        "16:12:00 · [Ghép hình từ kho][Phân cảnh] Đã chốt 31 cảnh minh họa.",
        "16:13:00 · [Tạo giọng] Đang tạo giọng cho người kể.",
        "16:20:00 · [Tạo giọng] Hoàn tất",
        ...Array.from({ length: 25 }, (_, i) => `16:37:${String(i).padStart(2, "0")} · [Ghép hình từ kho][Đọc cảnh] Đang xử lý cảnh 2/31 · Nhà tôi · Kiểm tra ${i + 1}`),
        "16:38:00 · [Ghép hình từ kho][Đọc cảnh] Prompt motion-puppet-read: 12000 ký tự.",
      ],
    },
    { id: "seo", kind: "seo", lines: ["16:12:15 · Hoàn tất SEO"] },
  ],
  SCREENSHOT: "scratch/motion-log-sections-20261026.png",
  PASSED: "Motion log sections passed: six stable phases, scoped and legacy classification, parallel progress, accurate completed/error states, collapsed raw diagnostics, independent expansion, follow-scroll without jumping, mobile layout and reload history. No AI, TTS or video.\n",
} as const;
