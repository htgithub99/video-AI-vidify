import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { MOTION_RENDER_BEHAVIOR as B } from "../../../constants/motionRenderBehavior.js";
import { remotionEffectGeometry, motionFrameSeconds } from "../lib/motionRemotionEffects.js";
import type { MotionRemotionSpec, MotionRemotionTimedScene } from "../../../types/motionVisual.js";
export const SceneEffects = ({ document, scene, frame, behind = false, sourceId }: { document: MotionRemotionSpec; scene: MotionRemotionTimedScene; frame: number; behind?: boolean; sourceId?: string }) => {
  const seconds = motionFrameSeconds(frame, document.fps),
    w = document.width,
    h = document.height;
  const effects = remotionEffectGeometry(scene, document.assets, w, h, document.renderBehavior, seconds).filter((e) => e.kind !== RT_MOTION.SWAY && (sourceId ? e.source === sourceId : behind ? e.kind === RT_MOTION.RAIN || e.kind === RT_MOTION.FOG : !e.source && e.kind !== RT_MOTION.RAIN && e.kind !== RT_MOTION.FOG));
  if (!effects.length) return null;
  return (
    <svg width={w} height={h} viewBox={`${RT_SHARED.VALUE_0_0}${w}${RT_SHARED.SYMBOL_36A9E7}${h}`} style={{ position: RT_MOTION.ABSOLUTE, left: 0, top: 0, pointerEvents: RT_MOTION.NONE, overflow: RT_SHARED.HIDDEN }}>
      {effects.map((e) => {
        const t = e.static ? 0 : seconds;
        const id = `${RT_MOTION.FX}${scene.id.replace(/[^a-z0-9_-]/gi, RT_SHARED.SYMBOL_3973E0)}${RT_SHARED.SYMBOL_3973E0}${e.id.replace(/[^a-z0-9_-]/gi, RT_SHARED.SYMBOL_3973E0)}`;
        if (e.kind === RT_MOTION.RAIN && e.region) {
          const r = e.region;
          return (
            <g key={e.id} opacity={e.intensity * 0.6}>
              <defs>
                <clipPath id={id}>
                  <rect {...r} />
                </clipPath>
              </defs>
              <g clipPath={`${RT_MOTION.URL}${id}${RT_SHARED.SYMBOL_BA5EC5}`} stroke={B.EFFECT.RAIN} strokeWidth={Math.max(1, h / 900)}>
                {Array.from({ length: B.EFFECT.RAIN_COUNT }, (_, i) => {
                  const x = r.x + ((i * 0.618033 + e.seed + t * 0.015) % 1) * r.width,
                    y = r.y + ((i * 0.414214 + e.seed + t * 0.36) % 1) * r.height;
                  return <line key={i} x1={x} y1={y} x2={x - h * 0.006} y2={y + h * 0.025} />;
                })}
              </g>
            </g>
          );
        }
        if (e.kind === RT_MOTION.FLAME) {
          const scale = 1 + 0.07 * Math.sin(t * 1.4 + e.seed * 6),
            size = Math.min(h * 0.02, e.height * 0.08);
          return (
            <g key={e.id} transform={`${RT_MOTION.TRANSLATE}${e.x}${RT_SHARED.SYMBOL_36A9E7}${e.y}${RT_MOTION.SCALE}${scale}${RT_SHARED.SYMBOL_BA5EC5}`}>
              <ellipse cy={-size * 0.35} rx={size * 2} ry={size * 2.5} fill={B.EFFECT.GLOW} opacity={0.08 * e.intensity} />
              <path d={`${RT_MOTION.M0_0_Q}${-size}${RT_SHARED.SYMBOL_36A9E7}${-size * 0.7}${RT_MOTION.VALUE_0_F4CEB8}${-size * 2.3}${RT_MOTION.Q}${size}${RT_SHARED.SYMBOL_36A9E7}${-size * 0.5}${RT_MOTION.VALUE_0_0}`} fill={B.EFFECT.FLAME} opacity={0.8} />
            </g>
          );
        }
        if (e.kind === RT_MOTION.FOG && e.region) {
          const r = e.region;
          return (
            <g key={e.id} opacity={0.07 * e.intensity}>
              <defs>
                <clipPath id={id}>
                  <rect {...r} />
                </clipPath>
              </defs>
              <g clipPath={`${RT_MOTION.URL}${id}${RT_SHARED.SYMBOL_BA5EC5}`}>
                {Array.from({ length: B.EFFECT.FOG_COUNT }, (_, i) => (
                  <ellipse key={i} cx={r.x + ((i * 0.31 + e.seed + t * 0.006) % 1) * r.width} cy={r.y + r.height * (0.35 + i * 0.13)} rx={r.width * 0.4} ry={r.height * 0.24} fill={B.EFFECT.FOG} />
                ))}
              </g>
            </g>
          );
        }
        if (e.kind === RT_SHARED.SMOKE || e.kind === RT_SHARED.STEAM) {
          const ground = e.direction === RT_SHARED.GROUND,
            sign = e.direction === RT_SHARED.LEFT ? -1 : 1,
            span = Math.min(w * 0.13, Math.max(e.width * 0.36, w * 0.025));
          return (
            <g key={e.id} fill={RT_MOTION.NONE} stroke={B.EFFECT.SMOKE} strokeWidth={Math.max(1.2, h * 0.002)}>
              {Array.from({ length: B.EFFECT.SMOKE_COUNT }, (_, i) => {
                const phase = (t * 0.09 + i / B.EFFECT.SMOKE_COUNT + e.seed) % 1,
                  dx = ground ? sign * phase * span : Math.sin(t * 0.6 + i) * span * 0.13 * phase,
                  dy = ground ? -Math.sin(phase * Math.PI) * h * 0.01 : -phase * Math.min(h * 0.13, e.height * 0.7);
                return <path key={i} d={`${RT_MOTION.M}${e.x + dx}${RT_SHARED.SYMBOL_36A9E7}${e.y + dy}${RT_MOTION.Q_8BCD42}${span * 0.06}${RT_SHARED.SYMBOL_36A9E7}${-h * 0.015}${RT_SHARED.SYMBOL_36A9E7}${span * 0.025}${RT_SHARED.SYMBOL_36A9E7}${-h * 0.027}`} opacity={(1 - phase) * e.intensity * 0.45} />;
              })}
            </g>
          );
        }
        return null;
      })}
    </svg>
  );
};
