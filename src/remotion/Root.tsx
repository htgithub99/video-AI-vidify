import { Composition, registerRoot } from "remotion";
import { StoryComposition, type StoryCompositionProps } from "./StoryComposition.js";
import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
const Root = () => (
  <Composition
    id={V.COMPOSITION_ID}
    component={StoryComposition}
    durationInFrames={30}
    fps={30}
    width={1280}
    height={720}
    defaultProps={{ document: { engine: "remotion", version: 1, title: "", aspect: "16:9", fps: 30, duration: 1, width: 1280, height: 720, motion: false, profileId: "history", assets: {}, scenes: [], subtitles: [] } }}
    calculateMetadata={({ props }: { props: StoryCompositionProps }) => ({ durationInFrames: Math.ceil(props.document.duration * props.document.fps), fps: props.document.fps, width: props.document.width, height: props.document.height })}
  />
);
registerRoot(Root);
