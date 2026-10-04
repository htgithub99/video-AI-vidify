import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
interface VideoExportSectionHeadingProps {
  step: string;
  title: string;
  icon: LucideIcon;
  titleClassName: string;
  iconClassName: string;
  children?: ReactNode;
}
export const VideoExportSectionHeading = ({ step, title, icon: Icon, titleClassName, iconClassName, children }: VideoExportSectionHeadingProps) => (
  <div className={cn("flex items-center gap-2.5 min-w-0")}>
    <span className={cn("w-6 h-6 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-black text-xs shadow-sm shadow-purple-500/20")}>{step}</span>
    <h3 className={titleClassName}>
      <Icon className={iconClassName} />
      <span>{title}</span>
      {children}
    </h3>
  </div>
);
