import { MOTION_RENDER_BEHAVIOR as B } from "../constants/motionRenderBehavior.js";
import { remotionEffectGeometry, motionFrameSeconds } from "../lib/motionRemotionEffects.js";
import type { MotionRemotionSpec, MotionRemotionTimedScene } from "../types/motionVisual.js";
export const SceneEffects = ({ document, scene, frame, behind = false, sourceId }: { document: MotionRemotionSpec; scene: MotionRemotionTimedScene; frame: number; behind?: boolean; sourceId?: string }) => {
  const seconds = motionFrameSeconds(frame, document.fps),
    w = document.width,
    h = document.height;
  const effects = remotionEffectGeometry(scene, document.assets, w, h, document.renderBehavior, seconds).filter((e) => e.kind !== "sway" && (sourceId ? e.source === sourceId : behind ? e.kind === "rain" || e.kind === "fog" : !e.source && e.kind !== "rain" && e.kind !== "fog"));
  if (!effects.length) return null;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", overflow: "hidden" }}>
      {effects.map((e) => {
        const t = e.static ? 0 : seconds;
        const id = `fx-${scene.id.replace(/[^a-z0-9_-]/gi, "-")}-${e.id.replace(/[^a-z0-9_-]/gi, "-")}`;
        if (e.kind === "rain" && e.region) {
          const r = e.region;
          return (
            <g key={e.id} opacity={e.intensity * 0.6}>
              <defs>
                <clipPath id={id}>
                  <rect {...r} />
                </clipPath>
              </defs>
              <g clipPath={`url(#${id})`} stroke={B.EFFECT.RAIN} strokeWidth={Math.max(1, h / 900)}>
                {Array.from({ length: B.EFFECT.RAIN_COUNT }, (_, i) => {
                  const x = r.x + ((i * 0.618033 + e.seed + t * 0.015) % 1) * r.width,
                    y = r.y + ((i * 0.414214 + e.seed + t * 0.36) % 1) * r.height;
                  return <line key={i} x1={x} y1={y} x2={x - h * 0.006} y2={y + h * 0.025} />;
                })}
              </g>
            </g>
          );
        }
        if (e.kind === "flame") {
          const scale = 1 + 0.07 * Math.sin(t * 1.4 + e.seed * 6),
            size = Math.min(h * 0.02, e.height * 0.08);
          return (
            <g key={e.id} transform={`translate(${e.x} ${e.y}) scale(${scale})`}>
              <ellipse cy={-size * 0.35} rx={size * 2} ry={size * 2.5} fill={B.EFFECT.GLOW} opacity={0.08 * e.intensity} />
              <path d={`M0 0 Q${-size} ${-size * 0.7} 0 ${-size * 2.3} Q${size} ${-size * 0.5} 0 0`} fill={B.EFFECT.FLAME} opacity={0.8} />
            </g>
          );
        }
        if (e.kind === "fog" && e.region) {
          const r = e.region;
          return (
            <g key={e.id} opacity={0.07 * e.intensity}>
              <defs>
                <clipPath id={id}>
                  <rect {...r} />
                </clipPath>
              </defs>
              <g clipPath={`url(#${id})`}>
                {Array.from({ length: B.EFFECT.FOG_COUNT }, (_, i) => (
                  <ellipse key={i} cx={r.x + ((i * 0.31 + e.seed + t * 0.006) % 1) * r.width} cy={r.y + r.height * (0.35 + i * 0.13)} rx={r.width * 0.4} ry={r.height * 0.24} fill={B.EFFECT.FOG} />
                ))}
              </g>
            </g>
          );
        }
        if (e.kind === "smoke" || e.kind === "steam") {
          const ground = e.direction === "ground",
            sign = e.direction === "left" ? -1 : 1,
            span = Math.min(w * 0.13, Math.max(e.width * 0.36, w * 0.025));
          return (
            <g key={e.id} fill="none" stroke={B.EFFECT.SMOKE} strokeWidth={Math.max(1.2, h * 0.002)}>
              {Array.from({ length: B.EFFECT.SMOKE_COUNT }, (_, i) => {
                const phase = (t * 0.09 + i / B.EFFECT.SMOKE_COUNT + e.seed) % 1,
                  dx = ground ? sign * phase * span : Math.sin(t * 0.6 + i) * span * 0.13 * phase,
                  dy = ground ? -Math.sin(phase * Math.PI) * h * 0.01 : -phase * Math.min(h * 0.13, e.height * 0.7);
                return <path key={i} d={`M${e.x + dx} ${e.y + dy} q${span * 0.06} ${-h * 0.015} ${span * 0.025} ${-h * 0.027}`} opacity={(1 - phase) * e.intensity * 0.45} />;
              })}
            </g>
          );
        }
        return null;
      })}
    </svg>
  );
};
