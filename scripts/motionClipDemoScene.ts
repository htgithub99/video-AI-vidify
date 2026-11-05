import type { MotionClip, MotionClipScript } from "../src/types/motionClip.ts";
const hills = `<path d="M0 430 Q160 330 320 400 T640 385 T960 370 T1280 430 L1280 480 L0 480 Z" fill="#9cc59a"/><path d="M0 455 Q200 400 420 440 T860 430 T1280 455 L1280 480 L0 480 Z" fill="#86b783"/>`;
const tree = (x: number) => `<rect x="${x - 6}" y="420" width="12" height="52" fill="#6b4a2b"/><circle cx="${x}" cy="405" r="34" fill="#4f8f46"/><circle cx="${x - 18}" cy="420" r="22" fill="#5aa24f"/>`;
const trees = [90, 330, 560, 800, 1040, 1210].map(tree).join("");
const marks = Array.from({ length: 14 }, (_, i) => `<ellipse cx="${40 + i * 92}" cy="${615 + (i % 3) * 32}" rx="${10 + (i % 4) * 4}" ry="4" fill="#a8844f"/>`).join("");
const tile = (art: string) => `${art}<g transform="translate(1280 0)">${art}</g>`;
const leg = (id: string, x: number, color: string) => `<g id="${id}"><rect x="${x}" y="580" width="18" height="88" rx="8" fill="${color}"/><rect x="${x - 2}" y="664" width="22" height="12" rx="3" fill="#2b1a10"/></g>`;
const limb = (id: string, x1: number, y1: number, x2: number, y2: number, color: string, w: number) => `<g id="${id}"><path d="M${x1} ${y1} L${x2} ${y2}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/></g>`;
const wheel = (id: string, cx: number) => `<g id="${id}"><circle cx="${cx}" cy="590" r="22" fill="#222"/><circle cx="${cx}" cy="590" r="11" fill="#bbb"/><path d="M${cx - 20} 590 H${cx + 20} M${cx} 570 V610" stroke="#555" stroke-width="4"/></g>`;
const car = `<g id="car_1"><rect x="910" y="540" width="170" height="42" rx="10" fill="#c0392b"/><path d="M940 540 L960 505 H1040 L1060 540 Z" fill="#a93226"/><rect x="968" y="512" width="30" height="24" fill="#d6eaf8"/><rect x="1004" y="512" width="30" height="24" fill="#d6eaf8"/><rect x="904" y="556" width="12" height="8" fill="#f4d03f"/>${wheel("car_1_wheel_f", 945)}${wheel("car_1_wheel_b", 1045)}</g>`;
const boy = `<g id="boy_1">${limb("boy_1_arm_far", 300, 540, 300, 592, "#8e5b3c", 11)}${limb("boy_1_leg_far", 300, 600, 300, 660, "#34495e", 13)}<rect x="286" y="530" width="28" height="74" rx="10" fill="#2e86c1"/><circle cx="302" cy="512" r="17" fill="#e0ac69"/><path d="M286 506 Q302 486 318 506 Z" fill="#3b2a1a"/>${limb("boy_1_leg_near", 300, 600, 300, 662, "#2c3e50", 14)}${limb("boy_1_arm_near", 300, 540, 300, 594, "#e0ac69", 11)}</g>`;
const rider = `<g id="rider_1"><path d="M598 520 L612 575 L622 572" stroke="#34495e" stroke-width="14" fill="none" stroke-linecap="round"/><rect x="586" y="448" width="38" height="78" rx="12" fill="#1f618d"/><circle cx="606" cy="428" r="19" fill="#e0ac69"/><path d="M584 424 Q606 396 628 424 Z" fill="#7d3c98"/>${limb("rider_1_arm", 614, 462, 690, 500, "#e0ac69", 11)}</g>`;
const horse = `<g id="horse_1">${leg("horse_1_leg_fr", 641, "#5e3820")}${leg("horse_1_leg_br", 546, "#5e3820")}<g id="horse_1_tail"><path d="M494 540 Q448 548 440 612 Q464 576 500 558 Z" fill="#2b1a10"/></g><ellipse cx="600" cy="560" rx="112" ry="46" fill="#7a4a2a"/>${leg("horse_1_leg_fl", 664, "#7a4a2a")}${leg("horse_1_leg_bl", 526, "#7a4a2a")}<g id="horse_1_head"><polygon points="660,548 712,468 742,472 714,578" fill="#7a4a2a"/><ellipse cx="762" cy="480" rx="38" ry="19" fill="#7a4a2a"/><polygon points="722,454 730,432 739,456" fill="#5e3820"/><circle cx="764" cy="472" r="3" fill="#111"/></g><g id="horse_1_mane"><path d="M712 466 Q688 482 666 532 L654 528 Q676 474 704 458 Z" fill="#2b1a10"/></g>${rider}</g>`;
/** Stand-in for an AI-drawn scene: semantic group ids, moving groups carry no base transform. */
export const DEMO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
<defs><linearGradient id="sky_grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#f7e9c6"/></linearGradient></defs>
<g id="sky"><rect width="1280" height="720" fill="url(#sky_grad)"/><circle cx="1090" cy="115" r="52" fill="#fff3b0"/></g>
<g id="far_hills">${tile(hills)}</g>
<g id="trees">${tile(trees)}</g>
<g id="river"><rect x="0" y="472" width="1280" height="70" fill="#4aa3d8"/><rect x="0" y="472" width="1280" height="6" fill="#7cc4ea"/></g>
<g id="road"><rect x="0" y="542" width="1280" height="178" fill="#c9a46a"/></g>
<g id="road_marks">${tile(marks)}</g>
${car}${boy}${horse}
</svg>`;
/** What the AI motion director returns for this scene: semantic choices only, no keyframes or angles. */
export const DEMO_RESPONSE: { temperament: "lively"; clips: MotionClip[]; bible: { subject: string; note: string }[] } = {
  temperament: "lively",
  bible: [{ subject: "horse_1", note: "phi nước đại, 4 chân lệch nhịp chéo, thân nhún, bờm và đuôi bay ngược" }],
  clips: [
    { id: "ride", op: "travel", target: "horse_1", mode: "scroll_background", speed: "fast", start: 0.05 },
    { op: "scroll", target: "far_hills", couple: "ride", depth: 0.12 },
    { op: "scroll", target: "trees", couple: "ride", depth: 0.4 },
    { op: "scroll", target: "road_marks", couple: "ride", depth: 1 },
    { op: "flow", target: "river", dir: "left", speed: "fast", density: "medium" },
    { op: "swing", group: ["horse_1_leg_fl", "horse_1_leg_fr", "horse_1_leg_bl", "horse_1_leg_br"], amount: "large", cycle: 0.55, phase: [0, 0.12, 0.5, 0.62], couple: "ride" },
    { op: "bob", target: "horse_1", amount: "medium", cycle: 1.1, bounce: true, lean: "forward", couple: "ride" },
    { op: "swing", target: "horse_1_head", joint: "bottom", amount: "small", cycle: 0.55, phase: 0.25, couple: "ride" },
    { op: "swing", target: "horse_1_mane", amount: "medium", cycle: 0.55, dir: "back", lag: 0.08, couple: "ride" },
    { op: "swing", target: "horse_1_tail", joint: "right", amount: "medium", cycle: 0.55, dir: "back", lag: 0.12, couple: "ride" },
    { op: "bob", target: "rider_1", amount: "small", cycle: 1.1, bounce: true, phase: 0.2, couple: "ride" },
    { op: "swing", target: "rider_1_arm", joint: "left", amount: "small", cycle: 0.55, couple: "ride" },
    { op: "emit", at: "horse_1_leg_bl:bottom", particle: "dust", density: "large", couple: "ride" },
    { op: "swing", group: ["boy_1_leg_near", "boy_1_leg_far", "boy_1_arm_near", "boy_1_arm_far"], amount: "large", cycle: 0.7, phase: [0, 0.5, 0.5, 0], couple: "ride" },
    { op: "bob", target: "boy_1", amount: "small", cycle: 1.4, bounce: true, lean: "forward", couple: "ride" },
    { op: "emit", at: "boy_1_leg_near:bottom", particle: "dust", density: "small", couple: "ride" },
    { id: "drive", op: "travel", target: "car_1", from: { x: 1.2, y: 0.85 }, to: { x: -0.25, y: 0.85 }, start: 0.19, end: 0.94, facing: "left" },
    { op: "spin", group: ["car_1_wheel_f", "car_1_wheel_b"], couple: "drive" },
    { op: "shake", target: "car_1", amount: "small", start: 0.19, end: 0.94 },
    { op: "emit", at: "car_1:right", particle: "smoke", density: "small", couple: "drive" },
  ],
};
/** Hand-measured rig matching DEMO_SVG (the pipeline measures it with Chrome instead). */
export const DEMO_SCRIPT: MotionClipScript = {
  scene: "demo-ky-binh",
  intent: "Kỵ binh phi nước đại dọc bờ sông, một cậu bé chạy theo, chiếc xe chạy ngược chiều; bụi tung sau vó ngựa.",
  temperament: "lively",
  duration: 8,
  clips: DEMO_RESPONSE.clips,
  rig: {
    width: 1280,
    height: 720,
    facing: "right",
    parts: [
      { id: "far_hills", box: { x: 0, y: 330, width: 2560, height: 150 } },
      { id: "trees", box: { x: 50, y: 371, width: 2440, height: 101 } },
      { id: "road_marks", box: { x: 30, y: 611, width: 2490, height: 72 } },
      { id: "horse_1", box: { x: 488, y: 432, width: 312, height: 244 } },
      { id: "horse_1_leg_fl", parent: "horse_1", joint: "top", box: { x: 662, y: 580, width: 22, height: 96 } },
      { id: "horse_1_leg_fr", parent: "horse_1", joint: "top", box: { x: 639, y: 580, width: 22, height: 96 } },
      { id: "horse_1_leg_bl", parent: "horse_1", joint: "top", box: { x: 524, y: 580, width: 22, height: 96 } },
      { id: "horse_1_leg_br", parent: "horse_1", joint: "top", box: { x: 544, y: 580, width: 22, height: 96 } },
      { id: "horse_1_head", parent: "horse_1", pivot: { x: 690, y: 562 }, box: { x: 660, y: 432, width: 140, height: 146 } },
      { id: "horse_1_mane", parent: "horse_1", pivot: { x: 708, y: 462 }, box: { x: 654, y: 458, width: 58, height: 74 } },
      { id: "horse_1_tail", parent: "horse_1", pivot: { x: 496, y: 546 }, box: { x: 440, y: 540, width: 60, height: 72 } },
      { id: "rider_1", parent: "horse_1", box: { x: 584, y: 396, width: 106, height: 180 } },
      { id: "rider_1_arm", parent: "rider_1", pivot: { x: 614, y: 462 }, box: { x: 608, y: 456, width: 88, height: 50 } },
      { id: "boy_1", box: { x: 283, y: 486, width: 38, height: 182 } },
      { id: "boy_1_leg_near", parent: "boy_1", pivot: { x: 300, y: 600 }, box: { x: 293, y: 600, width: 14, height: 62 } },
      { id: "boy_1_leg_far", parent: "boy_1", pivot: { x: 300, y: 600 }, box: { x: 293, y: 600, width: 14, height: 60 } },
      { id: "boy_1_arm_near", parent: "boy_1", pivot: { x: 300, y: 540 }, box: { x: 294, y: 540, width: 12, height: 54 } },
      { id: "boy_1_arm_far", parent: "boy_1", pivot: { x: 300, y: 540 }, box: { x: 294, y: 540, width: 12, height: 52 } },
      { id: "car_1", facing: "left", box: { x: 904, y: 505, width: 176, height: 107 } },
      { id: "car_1_wheel_f", parent: "car_1", box: { x: 923, y: 568, width: 44, height: 44 } },
      { id: "car_1_wheel_b", parent: "car_1", box: { x: 1023, y: 568, width: 44, height: 44 } },
      { id: "river", box: { x: 0, y: 478, width: 1280, height: 64 } },
    ],
  },
};
