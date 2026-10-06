import { FC, useEffect, useRef } from "react";
import { MOTION_TEXT_0B1220, MOTION_TEXT_151C28, MOTION_TEXT_2D, MOTION_TEXT_RGBA_0_0_0_0, MOTION_TEXT_RGBA_251_191_36_0_16, MOTION_TEXT_WALK } from "../../constants/motionRuntime.js";
import { cn } from "../../lib/utils";
import type { MotionEngineGlobal } from "./motionApi";
import { MotionThumbnail } from "./MotionThumbnail.js";
export const MotionCharacterLive: FC<{ ME: MotionEngineGlobal; character: unknown; action?: string; className?: string; height?: number; facing?: number; walkInPlace?: boolean }> = ({ ME, character, action = MOTION_TEXT_WALK, className, height = 260, facing = 1 }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(height * 0.9),
      h = height;
    c.width = w * dpr;
    c.height = h * dpr;
    const g = c.getContext(MOTION_TEXT_2D)!;
    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      const t = (performance.now() - t0) / 1000;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, c.width, c.height);
      const grd = g.createRadialGradient(c.width / 2, c.height * 0.88, 4, c.width / 2, c.height * 0.88, c.width * 0.45);
      grd.addColorStop(0, MOTION_TEXT_RGBA_251_191_36_0_16);
      grd.addColorStop(1, MOTION_TEXT_RGBA_0_0_0_0);
      g.fillStyle = grd;
      g.fillRect(0, 0, c.width, c.height);
      g.translate(c.width / 2, c.height * 0.9);
      const s = (h / 260) * dpr * 1.05;
      try {
        ME.drawCharacter(g, character, { action, t, phase: t * 5.2, scale: s, facing });
      } catch {}
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [ME, character, action, height, facing]);
  return <canvas ref={ref} className={cn("block mx-auto", className)} style={{ width: Math.round(height * 0.9), height }} />;
};
export const MotionLazyThumb: FC<{ load: () => Promise<string>; className?: string; alt: string; deps: unknown[] }> = ({ load, className, alt, deps }) => (
  <MotionThumbnail load={load} deps={deps} alt={alt} lazy className={cn("relative flex items-center justify-center overflow-hidden", className)} imageClassName="max-w-full max-h-full object-contain select-none pointer-events-none" draggable={false} placeholder={<div className="w-6 h-6 rounded-full border-2 border-slate-700 border-t-purple-400 animate-spin" />} />
);
type Stage3D = { canvas: HTMLCanvasElement | OffscreenCanvas; render: (t?: number, o?: { yaw?: number; action?: string }) => unknown; dispose: () => void };
export const MotionLive3D: FC<{ ME: MotionEngineGlobal; kind: "character" | "asset"; item: unknown; action?: string; height?: number; width?: number; spin?: boolean; className?: string }> = ({ ME, kind, item, action = MOTION_TEXT_WALK, height = 280, width, spin = true, className }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const w = width || Math.round(height * 0.9);
  useEffect(() => {
    const c = ref.current;
    const T3 = (ME as unknown as { T3?: { ok: boolean; hasWebGL: () => boolean; stage: (k: string, id: unknown, o: Record<string, unknown>) => Stage3D | null } }).T3;
    if (!c || !T3?.ok || !T3.hasWebGL()) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(w * dpr);
    c.height = Math.round(height * dpr);
    let stage: Stage3D | null = null;
    try {
      stage = T3.stage(kind, item, { width: c.width, height: c.height, action, yaw: -0.5, bg: MOTION_TEXT_0B1220, ground: MOTION_TEXT_151C28 });
    } catch {
      stage = null;
    }
    if (!stage) return;
    const g = c.getContext(MOTION_TEXT_2D)!;
    let raf = 0;
    let last = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;
      last = now;
      const t = (now - t0) / 1000;
      try {
        const out = stage!.render(t, { yaw: spin ? -0.5 + Math.sin(t * 0.45) * 0.9 : undefined, action });
        if (out) {
          g.clearRect(0, 0, c.width, c.height);
          g.drawImage(stage!.canvas as CanvasImageSource, 0, 0);
        }
      } catch {
        cancelAnimationFrame(raf);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      stage?.dispose();
    };
  }, [ME, kind, item, action, height, w, spin]);
  return <canvas ref={ref} className={cn("block mx-auto rounded-lg", className)} style={{ width: w, height }} />;
};
