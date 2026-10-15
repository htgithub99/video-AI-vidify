import type { FC } from "react";
import { MOTION_TEXT_UNSTYLED } from "../../constants/motionRuntime.js";
import { MOTION_SCENE_LIBRARY_STYLES as S } from "../../constants/motionSceneLibrary.js";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
export const MotionSceneFilterChip: FC<{ active: boolean; label: string; count: number; onClick: () => void }> = ({ active, label, count, onClick }) => (
  <Button variant={MOTION_TEXT_UNSTYLED} onClick={onClick} className={cn(S.FILTER_CHIP, active ? S.FILTER_CHIP_ACTIVE : S.FILTER_CHIP_INACTIVE)}>
    <span>{label}</span>
    <span className={S.FILTER_CHIP_COUNT}>{count}</span>
  </Button>
);
