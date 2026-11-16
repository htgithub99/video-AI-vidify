import { StudioCard } from "../../../components/ui/Studio.js";
import * as MR from "../../../constants/motionRuntime.js";
import type { FC, ReactNode } from "react";
export const MotionMetricCard: FC<{ children: ReactNode }> = ({ children }) => <StudioCard className={MR.P_3_ROUNDED_XL_BG_SLATE_950_60_BORDER_BORDER_PURPLE_500_}>{children}</StudioCard>;
