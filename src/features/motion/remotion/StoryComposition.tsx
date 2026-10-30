import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from "remotion";
import type { FC } from "react";
import { Fragment } from "react";
import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "../../../constants/motionRemotionLayout.js";
import { MOTION_REMOTION_STAGING as S } from "../../../constants/motionRemotionStaging.js";
import { motionVectorSource } from "../../../lib/motionVectorAsset.js";
import { normalizeMotionRenderBehavior } from "../../../lib/motionRenderBehavior.js";
import { motionActorLocked, motionNodeFrame, motionSceneCameraFrame, motionFrameSeconds, motionPropAngle, remotionSceneView } from "../lib/motionRemotionEffects.js";
import { remotionObjectIdentity } from "../../../lib/motionRemotionGeometry.js";
import { horrorCharacterFrame } from "../lib/motionHorrorCharacter.js";
import { remotionDetailNodes } from "../../../lib/motionRemotionVisibility.js";
import { compositionFrameSvg } from "../../../lib/motionSceneComposition.js";
import { SceneEffects } from "./SceneEffects.js";
import type { MotionRemotionSpec } from "../../../types/motionVisual.js";
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
  const camera = motionSceneCameraFrame(behavior, t, sourceScene, document.width, document.height, document.fps, document.scenes, document.assets),
    w = document.width,
    h = document.height;
  const view = remotionSceneView(scene, w, h, document.assets);
  const night = L.NIGHT.test(scene?.time || ""),
    dusk = L.DUSK.test(scene?.time || "");
  const separateLighting = (document.assets[scene?.backgroundKey || ""]?.layerRevision || 0) >= L.REVISION;
  const compositionAsset = scene?.composition && document.assets[scene.composition.assetKey];
  const speakers = new Set(scene?.speaking?.filter((span) => frame >= span.startFrame && frame < span.endFrame).map((span) => span.entityId));
  return (
    <AbsoluteFill style={{ backgroundColor: palette.paper, color: palette.ink, fontFamily: RT_MOTION.ARIAL_SANS_SERIF, overflow: RT_SHARED.HIDDEN }}>
      <div style={{ position: RT_MOTION.ABSOLUTE, width: w, height: h, transform: `${RT_MOTION.SCALE_0E0502}${width / w}${RT_SHARED.SYMBOL_D03502}${height / h}${RT_SHARED.SYMBOL_BA5EC5}`, transformOrigin: RT_MOTION.TOP_LEFT }}>
        <div style={{ position: RT_MOTION.ABSOLUTE, width: w, height: h, transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`, transformOrigin: RT_MOTION.CENTER_CENTER }}>
          <div style={{ position: RT_MOTION.ABSOLUTE, width: w, height: h, transform: `${RT_MOTION.TRANSLATE}${view.x}${RT_MOTION.PX}${view.y}${RT_MOTION.PX_SCALE}${view.scale}${RT_SHARED.SYMBOL_BA5EC5}`, transformOrigin: RT_MOTION.TOP_LEFT }}>
            {compositionAsset && scene?.composition && <Img src={motionVectorSource(compositionFrameSvg(compositionAsset, scene.composition, (frame - scene.startFrame) / document.fps, behavior, speakers))} style={{ position: RT_MOTION.ABSOLUTE, width: w, height: h }} />}
            {!scene?.composition && scene?.backgroundKey && document.assets[scene.backgroundKey] && <Img src={motionVectorSource(document.assets[scene.backgroundKey].svg, true)} style={{ position: RT_MOTION.ABSOLUTE, width: w, height: h }} />}
            {!scene?.composition && scene && <SceneEffects document={document} scene={scene} frame={frame} behind />}
            {!scene?.composition &&
              scene?.nodes.map((node) => {
                if (node.kind === RT_SHARED.LABEL)
                  return (
                    <div key={node.id} style={{ position: RT_MOTION.ABSOLUTE, left: node.x, top: node.y, width: node.width, height: node.height, color: palette.ink, textAlign: RT_SHARED.CENTER, fontSize: Math.min(40, h * 0.045), fontWeight: 700, lineHeight: 1.1, textShadow: `${RT_MOTION.VALUE_0_1PX_2PX}${palette.paper}` }}>
                      {node.description}
                    </div>
                  );
                const asset = node.assetKey && document.assets[node.assetKey];
                if (!asset) return null;
                const locked = motionActorLocked(scene, node);
                const moving = motionNodeFrame(scene, node, document.assets, behavior, t);
                const sway = node.kind !== RT_SHARED.CHARACTER && !locked && asset.anchors?.pivot && scene.effects?.find((e) => e.kind === RT_MOTION.SWAY && e.source === node.id);
                const angle = sway ? motionPropAngle(behavior, t, remotionObjectIdentity(node)) : 0;
                const pivot = asset.anchors?.pivot || asset.anchors?.base || { x: 0.5, y: 1 };
                return (
                  <Fragment key={node.id}>
                    <Img
                      src={motionVectorSource(horrorCharacterFrame(asset, t, node.kind === RT_SHARED.CHARACTER && behavior.actors === RT_SHARED.SIMPLE, node.entityId || node.id), !!document.assets[scene.backgroundKey || ""]?.space && (node.role === RT_SHARED.FIXTURE || (node.kind === RT_SHARED.PROP && S.MAT.test(node.description))))}
                      style={{ position: RT_MOTION.ABSOLUTE, left: node.x, top: moving.y, width: node.width, height: moving.height, transform: `${RT_MOTION.ROTATE}${angle}${RT_MOTION.DEG}`, transformOrigin: `${pivot.x * 100}${RT_MOTION.SYMBOL_84EE9A}${pivot.y * 100}${RT_SHARED.SYMBOL}` }}
                    />
                    <SceneEffects document={document} scene={scene} frame={frame} sourceId={node.id} />
                  </Fragment>
                );
              })}
            {!scene?.composition && scene && <SceneEffects document={document} scene={scene} frame={frame} />}
            {!scene?.composition && separateLighting && (night || dusk) && <div style={{ position: RT_MOTION.ABSOLUTE, inset: 0, backgroundColor: night ? L.COLORS.night : L.COLORS.dusk, opacity: night ? 0.24 : 0.12, pointerEvents: RT_MOTION.NONE }} />}
          </div>
        </div>
      </div>
      {subtitle && <div style={{ position: RT_MOTION.ABSOLUTE, left: RT_MOTION.VALUE_7, right: RT_MOTION.VALUE_7, bottom: RT_MOTION.VALUE_4, color: RT_MOTION.FFF, textAlign: RT_SHARED.CENTER, fontSize: Math.max(20, height * 0.04), fontWeight: 700, lineHeight: 1.25, textShadow: RT_MOTION.VALUE_0_2PX_3PX_000_1PX_0_2PX_000_1PX_0, whiteSpace: RT_MOTION.PRE_WRAP }}>{subtitle.text}</div>}
    </AbsoluteFill>
  );
};
