import { AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";
interface DestructiveActionNoticeProps {
  children: React.ReactNode;
  className?: string;
  iconClassName?: string;
}
export const DestructiveActionNotice = ({ children, className, iconClassName }: DestructiveActionNoticeProps) => (
  <div className={cn("p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold flex items-center gap-2", className)}>
    <AlertTriangle className={cn("w-4 h-4 shrink-0", iconClassName)} />
    <span>{children}</span>
  </div>
);
