import React, { FC, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";
import _ from "lodash";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "rectangular" | "circular" | "text" | "card" | "button";
}

export const Skeleton: FC<SkeletonProps> = ({ className, variant = "rectangular", ...props }) => {
  const variantStyles = {
    rectangular: "rounded-2xl",
    circular: "rounded-full",
    text: "rounded-lg h-4 w-full",
    card: "rounded-3xl h-48 w-full",
    button: "rounded-xl h-10 w-28",
  };

  return <div aria-hidden="true" className={cn("skeleton-shimmer relative overflow-hidden bg-slate-850/80 border border-slate-800/40 select-none", variantStyles[variant], className)} {...props} />;
};

export const SkeletonText: FC<{ lines?: number; className?: string }> = ({ lines = 2, className }) => (
  <div className={cn("space-y-2 w-full", className)}>
    {_.map(_.range(lines), (index) => (
      <Skeleton key={index} variant="text" className={cn(index === lines - 1 && lines > 1 ? "w-3/4" : "w-full")} />
    ))}
  </div>
);

export const SkeletonCard: FC<{ className?: string }> = ({ className }) => (
  <div className={cn("glass-card rounded-3xl p-6 space-y-4 border border-slate-800/80", className)}>
    <div className={cn("flex items-center gap-3")}>
      <Skeleton variant="circular" className={cn("w-12 h-12 shrink-0")} />
      <div className={cn("space-y-2 flex-1")}>
        <Skeleton variant="text" className={cn("w-1/3 h-4")} />
        <Skeleton variant="text" className={cn("w-2/3 h-3")} />
      </div>
    </div>
    <Skeleton variant="rectangular" className={cn("h-24 w-full")} />
    <div className={cn("flex justify-end gap-2 pt-2")}>
      <Skeleton variant="button" className={cn("w-20 h-8")} />
      <Skeleton variant="button" className={cn("w-24 h-8")} />
    </div>
  </div>
);

export interface SkeletonWrapperProps {
  isLoading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
}

export const SkeletonWrapper: FC<SkeletonWrapperProps> = ({ isLoading, skeleton, children, className }) => {
  if (isLoading) {
    return <div className={cn("w-full animate-in fade-in duration-200", className)}>{skeleton}</div>;
  }
  return <>{children}</>;
};

export interface ProjectTableSkeletonProps {
  rows?: number;
  className?: string;
}

export const ProjectTableSkeleton: FC<ProjectTableSkeletonProps> = ({ rows = 4, className }) => (
  <div className={cn("glass-card rounded-3xl shadow-lg overflow-hidden border border-slate-800/80", className)}>
    <div className={cn("overflow-x-auto")}>
      <table className={cn("w-full border-collapse text-left")}>
        <thead>
          <tr className={cn("border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase font-black tracking-wider bg-slate-955/60")}>
            <th className={cn("py-4 px-6 min-w-[280px]")}>
              <Skeleton variant="text" className={cn("w-32 h-3.5")} />
            </th>
            <th className={cn("py-4 px-4 text-center min-w-[100px]")}>
              <Skeleton variant="text" className={cn("w-16 h-3.5 mx-auto")} />
            </th>
            <th className={cn("py-4 px-4 text-center min-w-[120px]")}>
              <Skeleton variant="text" className={cn("w-20 h-3.5 mx-auto")} />
            </th>
            <th className={cn("py-4 px-4 min-w-[140px]")}>
              <Skeleton variant="text" className={cn("w-24 h-3.5")} />
            </th>
            <th className={cn("py-4 px-6 text-right min-w-[150px]")}>
              <Skeleton variant="text" className={cn("w-20 h-3.5 ml-auto")} />
            </th>
          </tr>
        </thead>
        <tbody className={cn("divide-y divide-slate-800/60")}>
          {_.map(_.range(rows), (i) => (
            <tr key={i} className={cn("border-b border-slate-800/60")}>
              <td className={cn("py-4 px-6")}>
                <div className={cn("flex items-center gap-4")}>
                  <Skeleton variant="rectangular" className={cn("w-24 h-14 rounded-2xl shrink-0")} />
                  <div className={cn("space-y-2 w-full max-w-md")}>
                    <Skeleton variant="text" className={cn("w-1/2 h-3.5")} />
                    <Skeleton variant="text" className={cn("w-4/5 h-3")} />
                  </div>
                </div>
              </td>
              <td className={cn("py-4 px-4 text-center")}>
                <Skeleton variant="button" className={cn("h-6 w-20 mx-auto rounded-xl")} />
              </td>
              <td className={cn("py-4 px-4 text-center")}>
                <div className={cn("flex items-center justify-center gap-3")}>
                  <Skeleton variant="circular" className={cn("w-4 h-4")} />
                  <Skeleton variant="circular" className={cn("w-4 h-4")} />
                  <Skeleton variant="circular" className={cn("w-4 h-4")} />
                </div>
              </td>
              <td className={cn("py-4 px-4")}>
                <Skeleton variant="text" className={cn("w-28 h-3.5")} />
              </td>
              <td className={cn("py-4 px-6 text-right")}>
                <div className={cn("flex items-center justify-end gap-2")}>
                  <Skeleton variant="button" className={cn("h-8 w-20 rounded-xl")} />
                  <Skeleton variant="button" className={cn("h-8 w-8 rounded-xl")} />
                  <Skeleton variant="button" className={cn("h-8 w-8 rounded-xl")} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export interface VoiceGridSkeletonProps {
  count?: number;
  className?: string;
}

export const VoiceGridSkeleton: FC<VoiceGridSkeletonProps> = ({ count = 6, className }) => (
  <div className={cn("grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3.5 p-4", className)}>
    {_.map(_.range(count), (i) => (
      <div key={i} className={cn("flex items-start gap-3.5 p-4 rounded-2xl border border-slate-800/80 bg-slate-900/60")}>
        <Skeleton variant="rectangular" className={cn("w-11 h-11 rounded-2xl shrink-0")} />
        <div className={cn("flex-1 space-y-2.5 min-w-0")}>
          <div className={cn("flex justify-between items-center")}>
            <Skeleton variant="text" className={cn("w-28 h-4")} />
            <Skeleton variant="rectangular" className={cn("w-5 h-5 rounded-lg shrink-0")} />
          </div>
          <Skeleton variant="text" className={cn("w-full h-3")} />
          <div className={cn("flex gap-1.5 pt-1")}>
            <Skeleton variant="button" className={cn("w-14 h-5 rounded-full")} />
            <Skeleton variant="button" className={cn("w-16 h-5 rounded-full")} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const DashboardSkeleton: FC<{ className?: string }> = ({ className }) => (
  <div className={cn("space-y-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8", className)}>
    <div className={cn("glass-card rounded-3xl p-6 sm:p-8 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6")}>
      <div className={cn("space-y-3 w-full md:w-2/3")}>
        <Skeleton variant="text" className={cn("w-48 h-6")} />
        <Skeleton variant="text" className={cn("w-full max-w-md h-4")} />
        <Skeleton variant="text" className={cn("w-3/4 max-w-sm h-3.5")} />
      </div>
      <div className={cn("flex gap-3 w-full md:w-auto")}>
        <Skeleton variant="button" className={cn("w-32 h-11 rounded-2xl")} />
        <Skeleton variant="button" className={cn("w-32 h-11 rounded-2xl")} />
      </div>
    </div>

    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5")}>
      {_.map(_.range(3), (i) => (
        <div key={i} className={cn("glass-card rounded-3xl p-6 border border-slate-800/80 space-y-4")}>
          <div className={cn("flex items-center justify-between")}>
            <Skeleton variant="text" className={cn("w-28 h-4")} />
            <Skeleton variant="circular" className={cn("w-8 h-8")} />
          </div>
          <Skeleton variant="text" className={cn("w-20 h-8")} />
          <Skeleton variant="rectangular" className={cn("h-2 w-full rounded-full")} />
        </div>
      ))}
    </div>
  </div>
);
