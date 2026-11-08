import { escapeRegExp as escapeId } from "./regexUtils.js";
import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { MOTION_CLIP as M } from "../constants/motionClip.js";
import type { MotionClip, MotionClipBox, MotionClipScript, MotionRigPart } from "../types/motionClip.js";
export interface MotionClipProgram {
  issues: string[];
  frame: (seconds: number, base?: string) => string;
}
const TAU = Math.PI * 2;
const round = (value: number): number => Number(value.toFixed(3));
const hash = (value: string): number => {
  let seed = 2166136261;
  for (const c of value) seed = Math.imul(seed ^ c.charCodeAt(0), 16777619);
  seed = Math.imul(seed ^ (seed >>> 16), 0x85ebca6b);
  seed = Math.imul(seed ^ (seed >>> 13), 0xc2b2ae35);
  return ((seed ^ (seed >>> 16)) >>> 0) / 4294967296;
};
export const motionClipJointPoint = (box: MotionClipBox, joint: string = RT_MAINTENANCE.CENTER): { x: number; y: number } => ({ x: joint === RT_MAINTENANCE.LEFT ? box.x : joint === RT_MAINTENANCE.RIGHT ? box.x + box.width : box.x + box.width / 2, y: joint === RT_MAINTENANCE.TOP ? box.y : joint === RT_MAINTENANCE.BOTTOM ? box.y + box.height : box.y + box.height / 2 });
const targets = (clip: MotionClip): string[] => clip.group || (clip.target ? [clip.target] : []);
const idsOf = (svg: string): Set<string> => new Set([...svg.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)].map((match) => match[1]));
const appendToGroup = (svg: string, id: string, markup: string): string => {
  const open = svg.match(new RegExp(`${RT_MAINTENANCE.SVG_GROUP_ID_PREFIX}${escapeId(id)}${RT_MAINTENANCE.SVG_ID_ATTRIBUTE_SUFFIX}`));
  if (!open || open.index === undefined || /\/\s*>$/.test(open[0])) return svg;
  let depth = 1;
  const offset = open.index + open[0].length;
  for (const token of svg.slice(offset).matchAll(/<(\/?)g\b[^>]*?(\/?)>/g)) {
    if (token[1]) depth--;
    else if (!token[2]) depth++;
    if (!depth) return svg.slice(0, offset + token.index!) + markup + svg.slice(offset + token.index!);
  }
  return svg;
};
const inRange = (value: unknown, min: number, max: number): boolean => value === undefined || (typeof value === "number" && Number.isFinite(value) && value >= min && value <= max);
const inList = (value: unknown, list: readonly string[]): boolean => value === undefined || (typeof value === "string" && list.includes(value));
export const validateMotionClips = (script: MotionClipScript, svg: string): string[] => {
  const ids = idsOf(svg);
  const rig = new Set(script.rig.parts.map((part) => part.id));
  const issues: string[] = [];
  if (!Array.isArray(script.clips)) return [M.ISSUE.COUNT(0, M.MAX_CLIPS)];
  if (script.clips.length > M.MAX_CLIPS) issues.push(M.ISSUE.COUNT(script.clips.length, M.MAX_CLIPS));
  const [low, high] = M.PATH_RANGE;
  const parts = new Map(script.rig.parts.map((part) => [part.id, part]));
  script.clips.forEach((clip, index) => {
    if (!clip || typeof clip !== "object" || !(M.OPS as readonly string[]).includes(clip.op)) return issues.push(M.ISSUE.OP(index, String(clip?.op)));
    if ((clip.group !== undefined && !Array.isArray(clip.group)) || (clip.target !== undefined && typeof clip.target !== "string")) return issues.push(M.ISSUE.TARGET(index, String(clip.group ?? clip.target)));
    const list = targets(clip);
    if (clip.op === RT_MAINTENANCE.SCROLL)
      for (const id of list) {
        const part = parts.get(id);
        if (part && (part.canvas || part.box).width < M.SCROLL_MIN_WIDTH * script.rig.width) issues.push(M.ISSUE.SCROLL(index, id));
      }
    if (!M.EFFECT_OPS.includes(clip.op) && clip.op !== RT_MAINTENANCE.EMIT && !list.length) issues.push(M.ISSUE.TARGET(index, ""));
    for (const id of list) {
      if (typeof id !== "string" || !ids.has(id)) issues.push(M.ISSUE.TARGET(index, String(id)));
      else if (M.RIGGED_OPS.includes(clip.op) && !rig.has(id)) issues.push(M.ISSUE.RIG(index, id));
    }
    if (clip.group && Array.isArray(clip.phase) && clip.phase.length !== clip.group.length) issues.push(M.ISSUE.PHASE(index));
    for (const [field, ok] of [
      [RT_MAINTENANCE.AMOUNT, inList(clip.amount, M.LEVELS)],
      [RT_MAINTENANCE.DENSITY, inList(clip.density, M.LEVELS)],
      [RT_MAINTENANCE.SPEED, inList(clip.speed, M.SPEEDS)],
      [RT_MAINTENANCE.PARTICLE, inList(clip.particle, M.PARTICLES)],
      [RT_MAINTENANCE.DIR, inList(clip.dir, M.DIRS)],
      [RT_MAINTENANCE.JOINT, inList(clip.joint, M.SIDES)],
      [RT_MAINTENANCE.FACING, inList(clip.facing, [RT_MAINTENANCE.LEFT, RT_MAINTENANCE.RIGHT])],
      [RT_MAINTENANCE.LEAN, inList(clip.lean, [RT_MAINTENANCE.FORWARD, RT_MAINTENANCE.BACK])],
    ] as const)
      if (!ok) issues.push(M.ISSUE.ENUM(index, field));
    for (const [field, ok] of [
      [RT_MAINTENANCE.CYCLE, inRange(clip.cycle, 0.1, M.MAX_CYCLE)],
      [RT_MAINTENANCE.LAG, inRange(clip.lag, 0, 2)],
      [RT_MAINTENANCE.DEPTH, inRange(clip.depth, 0, 2)],
      [RT_MAINTENANCE.START, inRange(clip.start, 0, 1)],
      [RT_MAINTENANCE.END, inRange(clip.end, 0, 1) && (clip.end === undefined || clip.end > (clip.start ?? 0))],
      [RT_MAINTENANCE.PHASE, Array.isArray(clip.phase) ? clip.phase.every((value) => inRange(value, -1, 1)) : inRange(clip.phase, -1, 1)],
      [RT_MAINTENANCE.FROM, !clip.from || (inRange(clip.from.x, low, high) && inRange(clip.from.y, low, high))],
      [RT_MAINTENANCE.TO, !clip.to || (inRange(clip.to.x, low, high) && inRange(clip.to.y, low, high))],
    ] as const)
      if (!ok) issues.push(M.ISSUE.RANGE(index, field));
    if (clip.couple && !script.clips.some((other) => other?.id === clip.couple && other.op === RT_MAINTENANCE.TRAVEL)) issues.push(M.ISSUE.COUPLE(index, clip.couple));
    if (clip.op === RT_MAINTENANCE.FOLLOW && !script.clips.some((other) => other?.op !== RT_MAINTENANCE.FOLLOW && targets(other).includes(clip.parent || ""))) issues.push(M.ISSUE.PARENT(index, clip.parent || ""));
    if (clip.op === RT_MAINTENANCE.TRAVEL && clip.mode !== RT_MAINTENANCE.SCROLL_BACKGROUND && (!clip.from || !clip.to)) issues.push(M.ISSUE.PATH(index));
    if (clip.op === RT_MAINTENANCE.EMIT) {
      const [part, side] = (clip.at || "").split(RT_MAINTENANCE.COLON);
      if (!rig.has(part) || !(M.SIDES as readonly string[]).includes(side)) issues.push(M.ISSUE.ANCHOR(index, clip.at || ""));
    }
  });
  return issues;
};
export const compileMotionClips = (script: MotionClipScript, svg: string, durationSeconds?: number, effects = true): MotionClipProgram => {
  const issues = validateMotionClips(script, svg);
  const clips = issues.length ? [] : script.clips.filter((clip) => effects || !M.EFFECT_OPS.includes(clip.op));
  const { width: W, height: H } = script.rig;
  const duration = Math.max(0.5, durationSeconds ?? script.duration ?? M.TRAVEL_SECONDS);
  const rig = new Map<string, MotionRigPart>(script.rig.parts.map((part) => [part.id, part]));
  const gain = M.TEMPERAMENT[script.temperament || RT_MAINTENANCE.LIVELY];
  const travels = new Map(clips.filter((clip) => clip.op === RT_MAINTENANCE.TRAVEL && clip.id).map((clip) => [clip.id!, clip]));
  const startOf = (clip: MotionClip): number => (clip.start ?? 0) * duration;
  const endOf = (clip: MotionClip): number => (clip.end ?? 1) * duration;
  const canvasOf = (part: MotionRigPart): MotionClipBox => part.canvas || part.box;
  const screenSign = (clip: MotionClip, part?: MotionRigPart): number => ((clip.facing || part?.facing || script.rig.facing) === RT_MAINTENANCE.LEFT ? -1 : 1) * (part?.flip ? -1 : 1);
  const ramp = (clip: MotionClip, t: number): number => {
    const start = startOf(clip),
      end = endOf(clip);
    if (t < start || t > end) return 0;
    return Math.max(0, Math.min(1, (t - start) / M.RAMP, end >= duration ? 1 : (end - t) / M.RAMP));
  };
  const rampedSeconds = (clip: MotionClip, t: number): number => {
    const run = Math.min(t, endOf(clip)) - startOf(clip);
    if (run <= 0) return 0;
    return run < M.RAMP ? (run * run) / (2 * M.RAMP) : run - M.RAMP / 2;
  };
  const isPath = (clip: MotionClip): boolean => clip.mode !== RT_MAINTENANCE.SCROLL_BACKGROUND && !!clip.from && !!clip.to;
  const travelDelta = (clip: MotionClip, t: number): { x: number; y: number } => {
    const part = rig.get(clip.target || "");
    if (!part || !isPath(clip)) return { x: 0, y: 0 };
    const p = Math.min(1, Math.max(0, (t - startOf(clip)) / Math.max(0.001, endOf(clip) - startOf(clip))));
    const eased = p * p * (3 - 2 * p);
    const foot = motionClipJointPoint(canvasOf(part), RT_MAINTENANCE.BOTTOM);
    return { x: (clip.from!.x + (clip.to!.x - clip.from!.x) * eased) * W - foot.x, y: (clip.from!.y + (clip.to!.y - clip.from!.y) * eased) * H - foot.y };
  };
  const travelled = (clip: MotionClip, t: number): number => {
    if (isPath(clip)) return travelDelta(clip, t).x - travelDelta(clip, startOf(clip)).x;
    return M.SPEED[clip.speed || RT_MAINTENANCE.MEDIUM] * W * (clip.dir === RT_MAINTENANCE.LEFT ? -1 : 1) * rampedSeconds(clip, t);
  };
  const inheritedTravel = (id: string, t: number): { x: number; y: number } => {
    const out = { x: 0, y: 0 };
    for (let cursor: string | undefined = id, guard = 0; cursor && guard < 32; cursor = rig.get(cursor)?.parent, guard++) {
      for (const clip of clips) {
        if (clip.op !== RT_MAINTENANCE.TRAVEL || clip.target !== cursor) continue;
        const delta = travelDelta(clip, t);
        out.x += delta.x;
        out.y += delta.y;
      }
    }
    return out;
  };
  const activity = (clip: MotionClip, t: number): number => {
    const coupled = clip.couple ? travels.get(clip.couple) : undefined;
    return ramp(clip, t) * (coupled ? ramp(coupled, t) : 1);
  };
  const progress = (clip: MotionClip, t: number): number => {
    const cycle = Math.max(0.1, clip.cycle || M.CYCLE);
    const coupled = clip.couple ? travels.get(clip.couple) : undefined;
    if (!coupled) return t / cycle;
    return Math.abs(travelled(coupled, t)) / (M.SPEED[coupled.speed || RT_MAINTENANCE.MEDIUM] * W) / cycle;
  };
  const phaseOf = (clip: MotionClip, index: number): number => (Array.isArray(clip.phase) ? clip.phase[index] || 0 : clip.phase || 0);
  const toLocal = (part: MotionRigPart, delta: { x: number; y: number }): { x: number; y: number } => {
    const canvas = canvasOf(part);
    const sx = canvas.width ? part.box.width / canvas.width : 1,
      sy = canvas.height ? part.box.height / canvas.height : 1;
    return { x: delta.x * sx * (part.flip ? -1 : 1), y: delta.y * sy };
  };
  const transformOf = (clip: MotionClip, id: string, index: number, t: number): string | undefined => {
    const part = rig.get(id);
    const level = activity(clip, t);
    const lagged = t - (clip.lag || 0);
    const wave = Math.sin(TAU * (progress(clip, lagged) + phaseOf(clip, index)));
    switch (clip.op) {
      case RT_MAINTENANCE.SWING: {
        if (!part) return undefined;
        const pivot = part.pivot || motionClipJointPoint(part.box, clip.joint || part.joint || RT_MAINTENANCE.TOP);
        const bias = clip.dir === RT_MAINTENANCE.BACK ? -0.7 : 0;
        return `${RT_MAINTENANCE.ROTATE}${round(M.SWING[clip.amount || RT_MAINTENANCE.MEDIUM] * gain * level * (wave + bias) * screenSign(clip, part))}${RT_MAINTENANCE.SPACE}${round(pivot.x)}${RT_MAINTENANCE.SPACE}${round(pivot.y)}${RT_MAINTENANCE.CLOSE_PAREN}`;
      }
      case RT_MAINTENANCE.BOB: {
        const scale = part ? toLocal(part, { x: 0, y: 1 }).y : 1;
        const amplitude = M.BOB[clip.amount || RT_MAINTENANCE.MEDIUM] * H * gain * level * scale;
        const offset = clip.bounce ? -Math.abs(wave) * amplitude : wave * amplitude;
        const foot = part ? motionClipJointPoint(part.box, RT_MAINTENANCE.BOTTOM) : undefined;
        const lean = clip.lean && foot ? `${RT_MAINTENANCE.ROTATE}${round((clip.lean === RT_MAINTENANCE.FORWARD ? 3 : -3) * level * screenSign(clip, part))}${RT_MAINTENANCE.SPACE}${round(foot.x)}${RT_MAINTENANCE.SPACE}${round(foot.y)}${RT_MAINTENANCE.CLOSE_PAREN_SPACE}` : "";
        return `${lean}${RT_MAINTENANCE.TRANSLATE_0}${round(offset)}${RT_MAINTENANCE.CLOSE_PAREN}`;
      }
      case RT_MAINTENANCE.SPIN: {
        if (!part) return undefined;
        const pivot = part.pivot || motionClipJointPoint(part.box, RT_MAINTENANCE.CENTER);
        const coupled = clip.couple ? travels.get(clip.couple) : undefined;
        const radius = Math.max(1, Math.min(canvasOf(part).width, canvasOf(part).height) / 2);
        const angle = coupled ? (travelled(coupled, t) / radius) * (180 / Math.PI) * (part.flip ? -1 : 1) : M.SPIN[clip.speed || RT_MAINTENANCE.MEDIUM] * t * (clip.dir === RT_MAINTENANCE.CCW ? -1 : 1);
        return `${RT_MAINTENANCE.ROTATE}${round(angle % 360)}${RT_MAINTENANCE.SPACE}${round(pivot.x)}${RT_MAINTENANCE.SPACE}${round(pivot.y)}${RT_MAINTENANCE.CLOSE_PAREN}`;
      }
      case RT_MAINTENANCE.TRAVEL: {
        if (!part) return undefined;
        const delta = toLocal(part, travelDelta(clip, t));
        return delta.x || delta.y ? `${RT_MAINTENANCE.TRANSLATE}${round(delta.x)}${RT_MAINTENANCE.SPACE}${round(delta.y)}${RT_MAINTENANCE.CLOSE_PAREN}` : undefined;
      }
      case RT_MAINTENANCE.SCROLL: {
        if (!part) return undefined;
        const tile = Math.max(1, Math.abs(toLocal(part, { x: W, y: 0 }).x));
        const coupled = clip.couple ? travels.get(clip.couple) : undefined;
        const distance = coupled ? Math.abs(travelled(coupled, t)) : M.SPEED[clip.speed || RT_MAINTENANCE.SLOW] * W * t;
        const shift = Math.abs(toLocal(part, { x: distance * (clip.depth ?? 1), y: 0 }).x) % tile;
        return `${RT_MAINTENANCE.TRANSLATE}${round(clip.dir === RT_MAINTENANCE.RIGHT ? shift - tile : -shift)}${RT_MAINTENANCE.VALUE_0}`;
      }
      case RT_MAINTENANCE.SHAKE: {
        const amplitude = M.SHAKE[clip.amount || RT_MAINTENANCE.SMALL] * H * level,
          seed = hash(id) * 10;
        return `${RT_MAINTENANCE.TRANSLATE}${round(amplitude * Math.sin(t * 37 + seed) * Math.cos(t * 13))}${RT_MAINTENANCE.SPACE}${round(amplitude * Math.sin(t * 29 + seed * 2))}${RT_MAINTENANCE.CLOSE_PAREN}`;
      }
      case RT_MAINTENANCE.PULSE: {
        if (!part) return undefined;
        const c = motionClipJointPoint(part.box, RT_MAINTENANCE.CENTER);
        const scale = 1 + M.PULSE[clip.amount || RT_MAINTENANCE.SMALL] * level * (0.5 + 0.5 * wave);
        return `${RT_MAINTENANCE.TRANSLATE}${round(c.x)}${RT_MAINTENANCE.SPACE}${round(c.y)}${RT_MAINTENANCE.SCALE}${round(scale)}${RT_MAINTENANCE.TRANSLATE_2}${round(-c.x)}${RT_MAINTENANCE.SPACE}${round(-c.y)}${RT_MAINTENANCE.CLOSE_PAREN}`;
      }
      case RT_MAINTENANCE.FOLLOW: {
        const leader = clips.find((other) => other.op !== RT_MAINTENANCE.FOLLOW && targets(other).includes(clip.parent || ""));
        return leader ? transformOf(leader, clip.parent!, 0, lagged) : undefined;
      }
    }
    return undefined;
  };
  const overlays = (t: number): { inside: Map<string, string>; top: string } => {
    const inside = new Map<string, string>();
    let top = "";
    clips.forEach((clip, index) => {
      if (clip.op === RT_MAINTENANCE.FLOW && clip.target) {
        const part = rig.get(clip.target);
        if (!part) return;
        const box = part.box;
        const count = M.DENSITY[clip.density || RT_MAINTENANCE.MEDIUM];
        const sign = (clip.dir === RT_MAINTENANCE.LEFT ? -1 : 1) * (part.flip ? -1 : 1);
        const speed = Math.abs(toLocal(part, { x: M.SPEED[clip.speed || RT_MAINTENANCE.MEDIUM] * W, y: 0 }).x) * sign;
        const stroke = round(Math.max(1.5, toLocal(part, { x: 0, y: H * 0.004 }).y));
        const lines = Array.from({ length: count }, (_, i) => {
          const seed = hash(`${clip.target}${i}`);
          const length = box.width * (0.05 + seed * 0.08);
          const span = box.width + length;
          const travel = (((seed * span + speed * t * (0.7 + seed * 0.6)) % span) + span) % span;
          const x = box.x - length + travel;
          const y = box.y + box.height * ((i + 0.5) / count) + Math.sin(t * 1.3 + seed * 9) * box.height * 0.02;
          const opacity = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2 + seed * 20));
          return `${RT_MAINTENANCE.PATH_D_M}${round(x)}${RT_MAINTENANCE.SPACE}${round(y)}${RT_MAINTENANCE.H}${round(length)}${RT_MAINTENANCE.STROKE_FFFFFF_STROKE_WIDTH}${stroke}${RT_MAINTENANCE.STROKE_LINECAP_ROUND_FILL_NONE_OPACITY}${round(opacity)}${RT_MAINTENANCE.SVG_SELF_CLOSING_SUFFIX}`;
        }).join("");
        const clipId = `${clip.target}${RT_MAINTENANCE.MOTION_FLOW}${index}`;
        inside.set(clip.target, `${inside.get(clip.target) || ""}${RT_MAINTENANCE.CLIPPATH_ID}${clipId}${RT_MAINTENANCE.RECT_X}${round(box.x)}${RT_MAINTENANCE.Y}${round(box.y)}${RT_MAINTENANCE.WIDTH}${round(box.width)}${RT_MAINTENANCE.HEIGHT}${round(box.height)}${RT_MAINTENANCE.CLIPPATH_G_CLIP_PATH_URL}${clipId}${RT_MAINTENANCE.SVG_TRANSFORM_SUFFIX}${lines}${RT_MAINTENANCE.SVG_GROUP_END}`);
      }
      if (clip.op === RT_MAINTENANCE.EMIT && clip.at) {
        const [partId, side] = clip.at.split(RT_MAINTENANCE.COLON);
        const part = rig.get(partId);
        if (!part) return;
        const style = M.PARTICLE[clip.particle || RT_MAINTENANCE.DUST];
        const count = M.DENSITY[clip.density || RT_MAINTENANCE.MEDIUM];
        const coupled = clip.couple ? travels.get(clip.couple) : undefined;
        const moving = coupled ? Math.sign(travelled(coupled, Math.max(t, startOf(coupled) + 0.1)) || 0) : 0;
        const back = moving ? -moving : clip.dir === RT_MAINTENANCE.LEFT ? -1 : clip.dir === RT_MAINTENANCE.RIGHT ? 1 : -screenSign(clip, part);
        const anchor = motionClipJointPoint(canvasOf(part), side);
        const circles: string[] = [];
        for (let i = 0; i < count; i++) {
          const seed = hash(`${clip.at}${i}`);
          const age = (((t / style.life + i / count) % 1) + 1) % 1;
          const born = t - age * style.life;
          const strength = born < 0 ? 0 : activity(clip, born);
          if (strength <= 0) continue;
          const moved = inheritedTravel(partId, born);
          const x = anchor.x + moved.x + back * age * style.drift * W * (0.6 + seed * 0.8) + (seed - 0.5) * canvasOf(part).width * 0.9;
          const y = anchor.y + moved.y - age * style.rise * H * (0.5 + seed) + style.gravity * H * age * age;
          const r = (style.from + (style.to - style.from) * age) * H;
          circles.push(`${RT_MAINTENANCE.CIRCLE_CX}${round(x)}${RT_MAINTENANCE.CY}${round(y)}${RT_MAINTENANCE.R}${round(r)}${RT_MAINTENANCE.FILL}${style.color}${RT_MAINTENANCE.OPACITY}${round(style.opacity * (1 - age) * strength)}${RT_MAINTENANCE.SVG_SELF_CLOSING_SUFFIX}`);
        }
        if (circles.length) top += `${RT_MAINTENANCE.SVG_GROUP_START}${circles.join("")}${RT_MAINTENANCE.SVG_GROUP_END}`;
      }
    });
    return { inside, top };
  };
  const frame = (seconds: number, base = svg): string => {
    if (!clips.length) return base;
    const t = Math.max(0, Math.min(seconds, duration));
    const transforms = new Map<string, string[]>();
    const attrs = new Map<string, Record<string, string>>();
    for (const clip of clips) {
      targets(clip).forEach((id, index) => {
        if (clip.op === RT_MAINTENANCE.REVEAL) {
          const p = Math.min(1, Math.max(0, (t - startOf(clip)) / Math.max(0.1, endOf(clip) - startOf(clip))));
          attrs.set(id, { pathLength: RT_MAINTENANCE.VALUE_1, "stroke-dasharray": RT_MAINTENANCE.VALUE_1, "stroke-dashoffset": String(round(1 - p)) });
          return;
        }
        const value = transformOf(clip, id, index, t);
        if (value) transforms.set(id, [...(transforms.get(id) || []), value]);
      });
    }
    const extra = overlays(t);
    let out = base.replace(/<([\w:-]+)\b[^<>]*>/g, (tag) => {
      const id = tag.match(/\sid\s*=\s*["']([^"']+)["']/)?.[1];
      if (!id) return tag;
      let next = tag;
      const moves = transforms.get(id);
      if (moves?.length) {
        const value = moves.join(RT_MAINTENANCE.SPACE);
        next = /\stransform\s*=\s*["']/.test(next) ? next.replace(/\stransform\s*=\s*(["'])(.*?)\1/, (_m, quote: string, base: string) => `${RT_MAINTENANCE.TRANSFORM}${quote}${base}${RT_MAINTENANCE.SPACE}${value}${quote}`) : next.replace(/\s*(\/?)>$/, (_m, close: string) => `${RT_MAINTENANCE.TRANSFORM_2}${value}${RT_MAINTENANCE.DOUBLE_QUOTE}${close}${RT_MAINTENANCE.CLOSE_TAG}`);
      }
      for (const [name, value] of Object.entries(attrs.get(id) || {})) next = next.replace(new RegExp(`${RT_MAINTENANCE.S}${name}${RT_MAINTENANCE.S_S_1}`), "").replace(/\s*(\/?)>$/, (_m, close: string) => `${RT_MAINTENANCE.SPACE}${name}${RT_MAINTENANCE.ATTRIBUTE_EQUALS_QUOTE}${value}${RT_MAINTENANCE.DOUBLE_QUOTE}${close}${RT_MAINTENANCE.CLOSE_TAG}`);
      return next;
    });
    for (const [id, markup] of extra.inside) out = appendToGroup(out, id, markup);
    return extra.top ? out.replace(/<\/svg>\s*$/, `${extra.top}${RT_MAINTENANCE.SVG}`) : out;
  };
  return { issues, frame };
};
const programs = new WeakMap<object, Map<string, MotionClipProgram>>();
const frames = new WeakMap<MotionClipProgram, Map<string, string>>();
export const motionClipFrameSvg = (motion: MotionClipScript, svg: string, seconds: number, durationSeconds: number, base?: string, effects = true): string => {
  let byDuration = programs.get(motion);
  if (!byDuration) programs.set(motion, (byDuration = new Map()));
  const programKey = `${durationSeconds.toFixed(3)}${RT_MAINTENANCE.PIPE_SEPARATOR}${svg.length}${RT_MAINTENANCE.PIPE_SEPARATOR}${effects}`;
  let program = byDuration.get(programKey);
  if (!program) byDuration.set(programKey, (program = compileMotionClips(motion, svg, durationSeconds, effects)));
  const time = Math.round(Math.max(0, seconds) / M.FRAME_STEP) * M.FRAME_STEP;
  if (base !== undefined && base !== svg) return program.frame(time, base);
  let cache = frames.get(program);
  if (!cache) frames.set(program, (cache = new Map()));
  const key = time.toFixed(4);
  const known = cache.get(key);
  if (known !== undefined) return known;
  const rendered = program.frame(time);
  if (cache.size >= M.FRAME_CACHE) cache.clear();
  cache.set(key, rendered);
  return rendered;
};
