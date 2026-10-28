import { StudioCard } from "../../../components/ui/Studio.js";
import * as MR from "../../../constants/motionRuntime.js";
import type { FC, ReactNode } from "react";
export const MotionMetricCard: FC<{ children: ReactNode }> = ({ children }) => <StudioCard className={MR.MOTION_TEXT_P_3_ROUNDED_XL_BG_F8FAFC_DARK_BG_SLATE_950_60_BORDER_BORDER_SLATE}>{children}</StudioCard>;
