import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import type { FC } from "react";
import { Fragment } from "react";
import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "../constants/motionRemotionLayout.js";
import { MOTION_REMOTION_STAGING as S } from "../constants/motionRemotionStaging.js";
import { motionVectorSource } from "../lib/motionVectorAsset.js";
import { normalizeMotionRenderBehavior } from "../lib/motionRenderBehavior.js";
import { motionActorLocked, motionNodeFrame, motionSceneCameraScale, motionFrameSeconds, motionPropAngle, remotionSceneView } from "../lib/motionRemotionEffects.js";
import { remotionObjectIdentity } from "../lib/motionRemotionGeometry.js";
import { horrorCharacterFrame } from "../lib/motionHorrorCharacter.js";
import { remotionDetailNodes } from "../lib/motionRemotionVisibility.js";
import { compositionFrameSvg } from "../lib/motionSceneComposition.js";
import { SceneEffects } from "./SceneEffects.js";
import type { MotionRemotionSpec } from "../types/motionVisual.js";
export type StoryCompositionProps = { document: MotionRemotionSpec };
export const StoryComposition: FC<StoryCompositionProps> = ({ document }) => {
  const frame = useCurrentFrame(),
    { width, height } = useVideoConfig();
  const sourceScene = document.scenes.find((item) => frame >= item.startFrame && frame < item.endFrame);
  const scene = sourceScene && (sourceScene.composition ? sourceScene : { ...sourceScene, nodes: remotionDetailNodes(sourceScene) });
  const palette = V.PROFILES[document.profileId];
  const t = motionFrameSeconds(frame, document.fps),
    behavior = normalizeMotionRenderBehavior(document.renderBehavior, document.motion);
  const subtitle = document.subtitles.find((item) => t >= item.start && t < item.end);
  const scale = motionSceneCameraScale(behavior, t, sourceScene, document.width, document.height, document.fps, document.scenes, document.assets),
    w = document.width,
    h = document.height;
  const view = remotionSceneView(scene, w, h, document.assets);
  const night = L.NIGHT.test(scene?.time || ""),
    dusk = L.DUSK.test(scene?.time || "");
  const separateLighting = (document.assets[scene?.backgroundKey || ""]?.layerRevision || 0) >= L.REVISION;
  const compositionAsset = scene?.composition && document.assets[scene.composition.assetKey];
  const speakers = new Set(scene?.speaking?.filter((span) => frame >= span.startFrame && frame < span.endFrame).map((span) => span.entityId));
  return (
    <AbsoluteFill style={{ backgroundColor: palette.paper, color: palette.ink, fontFamily: "Arial, sans-serif", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: w, height: h, transform: `scale(${width / w},${height / h})`, transformOrigin: "top left" }}>
        <div style={{ position: "absolute", width: w, height: h, transform: `scale(${scale})`, transformOrigin: "center center" }}>
          <div style={{ position: "absolute", width: w, height: h, transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`, transformOrigin: "top left" }}>
            {compositionAsset && scene?.composition && <Img src={motionVectorSource(compositionFrameSvg(compositionAsset, scene.composition, (frame - scene.startFrame) / document.fps, behavior, speakers))} style={{ position: "absolute", width: w, height: h }} />}
            {!scene?.composition && scene?.backgroundKey && document.assets[scene.backgroundKey] && <Img src={motionVectorSource(document.assets[scene.backgroundKey].svg, true)} style={{ position: "absolute", width: w, height: h }} />}
            {!scene?.composition && scene && <SceneEffects document={document} scene={scene} frame={frame} behind />}
            {!scene?.composition &&
              scene?.nodes.map((node) => {
                if (node.kind === "label")
                  return (
                    <div key={node.id} style={{ position: "absolute", left: node.x, top: node.y, width: node.width, height: node.height, color: palette.ink, textAlign: "center", fontSize: Math.min(40, h * 0.045), fontWeight: 700, lineHeight: 1.1, textShadow: `0 1px 2px ${palette.paper}` }}>
                      {node.description}
                    </div>
                  );
                const asset = node.assetKey && document.assets[node.assetKey];
                if (!asset) return null;
                const locked = motionActorLocked(scene, node);
                const moving = motionNodeFrame(scene, node, document.assets, behavior, t);
                const sway = node.kind !== "character" && !locked && asset.anchors?.pivot && scene.effects?.find((e) => e.kind === "sway" && e.source === node.id);
                const angle = sway ? motionPropAngle(behavior, t, remotionObjectIdentity(node)) : 0;
                const pivot = asset.anchors?.pivot || asset.anchors?.base || { x: 0.5, y: 1 };
                return (
                  <Fragment key={node.id}>
                    <Img
                      src={motionVectorSource(horrorCharacterFrame(asset, t, node.kind === "character" && behavior.actors === "simple", node.entityId || node.id), !!document.assets[scene.backgroundKey || ""]?.space && (node.role === "fixture" || (node.kind === "prop" && S.MAT.test(node.description))))}
                      style={{ position: "absolute", left: node.x, top: moving.y, width: node.width, height: moving.height, transform: `rotate(${angle}deg)`, transformOrigin: `${pivot.x * 100}% ${pivot.y * 100}%` }}
                    />
                    <SceneEffects document={document} scene={scene} frame={frame} sourceId={node.id} />
                  </Fragment>
                );
              })}
            {!scene?.composition && scene && <SceneEffects document={document} scene={scene} frame={frame} />}
            {!scene?.composition && separateLighting && (night || dusk) && <div style={{ position: "absolute", inset: 0, backgroundColor: night ? L.COLORS.night : L.COLORS.dusk, opacity: night ? 0.24 : 0.12, pointerEvents: "none" }} />}
          </div>
        </div>
      </div>
      {subtitle && <div style={{ position: "absolute", left: "7%", right: "7%", bottom: "4%", color: "#fff", textAlign: "center", fontSize: Math.max(20, height * 0.04), fontWeight: 700, lineHeight: 1.25, textShadow: "0 2px 3px #000, 1px 0 2px #000, -1px 0 2px #000", whiteSpace: "pre-wrap" }}>{subtitle.text}</div>}
    </AbsoluteFill>
  );
};
