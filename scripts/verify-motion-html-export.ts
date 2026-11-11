import fs from "node:fs/promises";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const out = path.resolve("scratch/motion-html-export-20261107");
process.env.VIDIFY_STORAGE_DIR = path.join(out, "storage"); delete process.env.APP_DATA_DIR;
await fs.mkdir(out, { recursive: true });
// Keep the real export job/cache/mux pipeline, isolating only the shared AI-browser handoff.
// This test owns a separate rendering Chrome; it must never close a user's Gemini tabs.
const bundle = await build({ stdin: { contents: 'export { startMotionVideoRenderInput } from "./src/features/motion/server/services/motionProductionActions.ts"; export { getMotionJob } from "./src/features/motion/server/services/motionRenderService.ts";', resolveDir: process.cwd(), loader: "ts" }, bundle: true, platform: "node", format: "esm", packages: "external", write: false, plugins: [{ name: "isolated-export-browser-handoff", setup(builder) {
  builder.onLoad({ filter: /[\\/]motionRenderService\.ts$/ }, async ({ path: file }) => {
    const text = await fs.readFile(file, "utf8");
    const call = "await acquireMotionRenderBrowser(signal, (line) => pushLog(job, line), options.editorialSessionId, options.clearGeminiChatsBeforeExport === true)";
    assert.equal(text.split(call).length, 2);
    return { loader: "ts", contents: text.replace(call, "await Promise.resolve(Object.assign(() => undefined, { shared: true }))") };
  });
} }] });
const modulePath = path.resolve(`node_modules/.cache/motion-html-export-${process.pid}.mjs`);
await fs.mkdir(path.dirname(modulePath), { recursive: true }); await fs.writeFile(modulePath, bundle.outputFiles[0].text);
const { startMotionVideoRenderInput, getMotionJob } = await import(pathToFileURL(modulePath).href);
const { getMotionAudioDirectory, getMotionRootDirectory } = await import("../src/features/motion/server/services/motionLibraryService.ts");
const { getFfmpegPath } = await import("../src/server/services/shortsPreprocessService.ts");
const { probeMotionMedia } = await import("../src/features/motion/server/services/motionMediaValidation.ts");
const { renderRemotionVideo } = await import("../src/features/motion/server/services/motionRemotionRenderService.ts");
const exec = promisify(execFile);
const audio = getMotionAudioDirectory();
for (const [name,frequency] of [["fixture.wav",440],["fixture-sfx.wav",880]] as const) await exec(getFfmpegPath(),["-hide_banner","-loglevel","error","-y","-f","lavfi","-i",`sine=frequency=${frequency}:duration=2`,"-ar","48000",path.join(audio,name)],{windowsHide:true});
const html = `<!DOCTYPE html><html><head></head><body><canvas id="motion-canvas"></canvas><script>window.motionScene={ready:Promise.resolve(),renderAt:p=>{const c=document.getElementById('motion-canvas');c.width=p.width;c.height=p.height;const x=c.getContext('2d');x.fillStyle='#f3e5c1';x.fillRect(0,0,c.width,c.height);x.fillStyle='#9c3346';x.fillRect(c.width*(.1+.5*p.progress),c.height*.35,c.width*.2,c.height*.3)}};</script></body></html>`;
const scene: any = { renderer:"html-canvas",id:"canvas",beatId:"b1",sourceBeatIds:["b1"],fromLineId:"b1:1",toLineId:"b1:1",purpose:"Canvas export",environment:"",sourceKey:"fixture",nodes:[],startFrame:0,endFrame:60,build:{status:"accepted",inputKey:"fixture",review:false},html:{version:1,html,hash:"export-v1",seed:"fixed",duration:2,attempts:1,status:"ready"} };
const spec: any = {renderer:"html-canvas",engine:"remotion",version:1,title:"Canvas pipeline export",aspect:"16:9",fps:30,duration:2,width:1280,height:720,motion:true,profileId:"history",assets:{},scenes:[scene],subtitles:[{start:0,end:2,text:"A moving illustration — hình chuyển động."}],fontFamily:"Arial",renderBehavior:{version:1,actors:"simple",camera:"gentle",sceneEffects:"gentle"}};
const {job}=startMotionVideoRenderInput({spec,options:{quality:"standard",aspect:"16:9",fps:30,encoder:"cpu",audioId:"fixture.wav",sfxId:"fixture-sfx.wav",sfxVolume:.2,requireAudio:true,music:{mood:"off",volume:0},clearGeminiChatsBeforeExport:false}});
let final: any;
for(let poll=0;poll<1200;poll++) {final=getMotionJob(job.id);if(["completed","error","cancelled"].includes(final.status))break;await new Promise(r=>setTimeout(r,100));}
assert.equal(final.status,"completed",JSON.stringify(final));
const output=path.join(getMotionRootDirectory(),final.result.fileName);
const probe=await probeMotionMedia(output);
assert.equal(probe.streams.find(s=>s.codec_type==="video")?.width,1920);
assert.equal(probe.streams.find(s=>s.codec_type==="video")?.height,1080);
assert.ok(probe.streams.some(s=>s.codec_type==="audio"));
assert.equal(final.result.fps,30);
assert.equal(final.result.resolvedSettings.subtitles,true);
await fs.copyFile(output,path.join(out,"canvas-with-audio.mp4"));
const legacy:any={id:"legacy",beatId:"b2",purpose:"Legacy background",environment:"",sourceKey:"legacy",nodes:[],backgroundKey:"bg",startFrame:30,endFrame:60};
const mixed:any={...spec,subtitles:[],scenes:[{...scene,endFrame:30},legacy],assets:{bg:{key:"bg",inputKey:"bg",description:"Blue background",width:1280,height:720,svg:"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'><rect width='1280' height='720' fill='#335a8c'/></svg>"}}};
const mixedPath=path.join(out,"mixed-legacy-canvas.mp4");
await renderRemotionVideo(mixed,mixedPath,{width:640,height:360,crf:23,concurrency:1,signal:new AbortController().signal,onProgress:()=>undefined});
const mixedProbe=await probeMotionMedia(mixedPath);
assert.equal(Number(mixedProbe.streams[0].nb_frames),60);
await fs.writeFile(path.join(out,"verification.json"),JSON.stringify({syntheticAudio:true,realTts:false,actualProductionExportPipeline:true,browserHandoff:"isolated fixture; user AI browser untouched",probe,result:final.result,mixedProbe,log:final.log},null,2));
process.stdout.write("PASS: production export/cache/mux/publication at 1080p/30fps with audio, SFX, subtitles; mixed legacy/Canvas video.\n");
await fs.unlink(modulePath);
process.exit(0);
