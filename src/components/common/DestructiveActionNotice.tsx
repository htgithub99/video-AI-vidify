import { RUNTIME_TEXT as RT_UI } from "../../constants/runtime/ui.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../constants/runtime/shared.js";
import { AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";
interface DestructiveActionNoticeProps {
  children: React.ReactNode;
  className?: string;
  iconClassName?: string;
}
export const DestructiveActionNotice = ({ children, className, iconClassName }: DestructiveActionNoticeProps) => (
  <div className={cn(RT_UI.P_3_ROUNDED_XL_BG_ROSE_500_10_BORDER_BORDER, className)}>
    <AlertTriangle className={cn(RT_SHARED.W_4_H_4_SHRINK_0, iconClassName)} />
    <span>{children}</span>
  </div>
);
