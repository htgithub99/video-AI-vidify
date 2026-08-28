import { Skeleton, SkeletonText } from "./ui/Skeleton";
import { cn } from "../lib/utils";

export default function TabContentLoading() {
  return (
    <div aria-busy="true" aria-label="Loading workspace..." className={cn("h-full flex flex-col bg-slate-955 p-4 sm:p-6 space-y-6 overflow-hidden animate-in fade-in duration-200")}>
      
      <div className={cn("glass-card rounded-3xl p-6 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4")}>
        <div className={cn("flex items-center gap-4 w-full sm:w-auto")}>
          <Skeleton variant="circular" className={cn("w-12 h-12 shrink-0")} />
          <div className={cn("space-y-2 flex-1 min-w-[200px]")}>
            <Skeleton variant="text" className={cn("w-40 h-4")} />
            <Skeleton variant="text" className={cn("w-64 h-3")} />
          </div>
        </div>
        <div className={cn("flex items-center gap-3 w-full sm:w-auto justify-end")}>
          <Skeleton variant="button" className={cn("w-28 h-9")} />
          <Skeleton variant="button" className={cn("w-32 h-9")} />
        </div>
      </div>

      <div className={cn("flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0")}>
        
        <div className={cn("lg:col-span-7 space-y-4")}>
          <div className={cn("glass-card rounded-3xl p-5 border border-slate-800/80 space-y-4")}>
            <div className={cn("flex justify-between items-center")}>
              <Skeleton variant="text" className={cn("w-32 h-4")} />
              <Skeleton variant="text" className={cn("w-20 h-4")} />
            </div>
            <Skeleton variant="rectangular" className={cn("h-28 w-full")} />
            <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3")}>
              <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
              <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
              <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
              <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
            </div>
          </div>

          <div className={cn("glass-card rounded-3xl p-5 border border-slate-800/80 space-y-3")}>
            <Skeleton variant="text" className={cn("w-44 h-4")} />
            <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-2.5")}>
              <Skeleton variant="rectangular" className={cn("h-16 w-full rounded-2xl")} />
              <Skeleton variant="rectangular" className={cn("h-16 w-full rounded-2xl")} />
              <Skeleton variant="rectangular" className={cn("h-16 w-full rounded-2xl")} />
              <Skeleton variant="rectangular" className={cn("h-16 w-full rounded-2xl")} />
            </div>
          </div>
        </div>

        <div className={cn("lg:col-span-5 space-y-4")}>
          <div className={cn("glass-card rounded-3xl p-5 border border-slate-800/80 space-y-4")}>
            <div className={cn("flex justify-between items-center")}>
              <Skeleton variant="text" className={cn("w-28 h-4")} />
              <Skeleton variant="circular" className={cn("w-6 h-6")} />
            </div>
            <Skeleton variant="rectangular" className={cn("aspect-video w-full rounded-2xl")} />
            <SkeletonText lines={2} />
            <Skeleton variant="rectangular" className={cn("h-12 w-full rounded-2xl")} />
          </div>
        </div>
      </div>
    </div>
  );
}
