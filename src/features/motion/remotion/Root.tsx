import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { Composition, registerRoot } from "remotion";
import { StoryComposition, type StoryCompositionProps } from "./StoryComposition.js";
import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
const Root = () => (
  <Composition
    id={V.COMPOSITION_ID}
    component={StoryComposition}
    durationInFrames={30}
    fps={30}
    width={1280}
    height={720}
    defaultProps={{ document: { engine: RT_SHARED.REMOTION, version: 1, title: "", aspect: RT_SHARED.VALUE_16_9, fps: 30, duration: 1, width: 1280, height: 720, motion: false, profileId: RT_SHARED.HISTORY, assets: {}, scenes: [], subtitles: [] } }}
    calculateMetadata={({ props }: { props: StoryCompositionProps }) => ({ durationInFrames: Math.ceil(props.document.duration * props.document.fps), fps: props.document.fps, width: props.document.width, height: props.document.height })}
  />
);
registerRoot(Root);
