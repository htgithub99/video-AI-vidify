import type { ComponentProps } from "react";
import AutoVideoGenerator from "../video-generation/components/AutoVideoGenerator.js";
export default function AutoVideoScreen(props: ComponentProps<typeof AutoVideoGenerator>) {
  return <AutoVideoGenerator {...props} />;
}
