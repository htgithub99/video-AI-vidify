import fs from "node:fs";
import { layoutRemotionNodes } from "../../../src/lib/motionRemotion.ts";
const base = "storage/output/motion-video/story-jobs/";
const script = JSON.parse(fs.readFileSync(base + "69216e40-c6eb-467b-8a97-74f9674fb29e.json", "utf8")).job.result;
const state = script.gen.remotion;
const results = script.beats.map((beat: any) => ({ id: beat.id, nodes: layoutRemotionNodes(state.scenes[beat.id][0].nodes, state.assets, 1920, 1080).map((n: any) => ({id:n.id, kind:n.kind, relation:n.relation,target:n.target,x:n.x,y:n.y,width:n.width,height:n.height,depth:n.depth})) }));
fs.writeFileSync("docs/video-references/mam-com-cung-audit-20261027/layout.json", JSON.stringify(results,null,2));
for (const index of [2,5,6,14,15]) console.log(index+1,JSON.stringify(results[index].nodes));
