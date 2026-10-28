import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "../../../lib/utils";
interface VideoExportSectionHeadingProps {
  step: string;
  title: string;
  icon: LucideIcon;
  titleClassName: string;
  iconClassName: string;
  children?: ReactNode;
}
export const VideoExportSectionHeading = ({ step, title, icon: Icon, titleClassName, iconClassName, children }: VideoExportSectionHeadingProps) => (
  <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2_5_MIN_W_0)}>
    <span className={cn(RT_SHARED.W_6_H_6_ROUNDED_XL_BG_PURPLE_500_15)}>{step}</span>
    <h3 className={titleClassName}>
      <Icon className={iconClassName} />
      <span>{title}</span>
      {children}
    </h3>
  </div>
);
