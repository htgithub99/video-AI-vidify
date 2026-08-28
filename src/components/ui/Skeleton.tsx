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
                  <Skeleton variant="rectangular" className={cn("w-14 h-14 rounded-2xl shrink-0")} />
                  <div className={cn("space-y-2 w-full max-w-md")}>
                    <div className={cn("flex items-center gap-2")}>
                      <Skeleton variant="text" className={cn("w-36 h-3.5")} />
                      <Skeleton variant="rectangular" className={cn("w-16 h-4 rounded-md")} />
                    </div>
                    <Skeleton variant="text" className={cn("w-4/5 h-3")} />
                  </div>
                </div>
              </td>
              <td className={cn("py-4 px-4 text-center")}>
                <Skeleton variant="button" className={cn("h-6 w-16 mx-auto rounded-xl")} />
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
                  <Skeleton variant="button" className={cn("h-8 w-18 rounded-xl")} />
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

export const ProjectListSkeleton: FC<{ className?: string }> = ({ className }) => (
  <div className={cn("space-y-6 w-full max-w-7xl mx-auto", className)}>
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 sm:p-7 rounded-3xl shadow-lg")}>
      <div className={cn("space-y-2")}>
        <div className={cn("flex items-center gap-2.5")}>
          <Skeleton variant="rectangular" className={cn("w-9 h-9 rounded-xl")} />
          <Skeleton variant="text" className={cn("w-32 h-6")} />
        </div>
        <Skeleton variant="text" className={cn("w-64 h-3.5")} />
      </div>
      <Skeleton variant="button" className={cn("w-36 h-11 rounded-2xl")} />
    </div>

    <div className={cn("flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between glass-card p-4 rounded-2xl")}>
      <div className={cn("flex flex-wrap items-center gap-2")}>
        <Skeleton variant="button" className={cn("w-28 h-8 rounded-xl")} />
        <Skeleton variant="button" className={cn("w-24 h-8 rounded-xl")} />
        <Skeleton variant="button" className={cn("w-24 h-8 rounded-xl")} />
        <Skeleton variant="button" className={cn("w-32 h-8 rounded-xl")} />
      </div>
      <Skeleton variant="rectangular" className={cn("w-full sm:w-72 h-8 rounded-xl")} />
    </div>

    <ProjectTableSkeleton rows={4} />
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
        <Skeleton variant="button" className={cn("w-36 h-11 rounded-2xl")} />
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

export const AutoVideoStudioSkeleton: FC<{ className?: string }> = ({ className }) => (
  <div className={cn("h-full flex flex-col overflow-y-auto bg-slate-955", className)}>
    <div className={cn("flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0")}>
      <div className={cn("lg:col-span-7 h-auto lg:h-full p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-800 overflow-y-auto scrollbar-none")}>
        <div className={cn("glass-card rounded-3xl p-5 border border-slate-800/80 space-y-3")}>
          <div className={cn("flex justify-between items-center")}>
            <div className={cn("flex items-center gap-2")}>
              <Skeleton variant="rectangular" className={cn("w-6 h-6 rounded-lg")} />
              <Skeleton variant="text" className={cn("w-36 h-4")} />
            </div>
            <Skeleton variant="text" className={cn("w-28 h-4")} />
          </div>
          <Skeleton variant="rectangular" className={cn("h-28 w-full rounded-2xl")} />
          <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3")}>
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
          </div>
        </div>

        <div className={cn("glass-card rounded-3xl p-4 border border-slate-800/80 flex items-center justify-between gap-4")}>
          <div className={cn("flex items-center gap-3 flex-1")}>
            <Skeleton variant="rectangular" className={cn("w-10 h-10 rounded-xl")} />
            <div className={cn("space-y-1.5 flex-1")}>
              <Skeleton variant="text" className={cn("w-28 h-3.5")} />
              <Skeleton variant="text" className={cn("w-44 h-3")} />
            </div>
          </div>
          <Skeleton variant="button" className={cn("w-28 h-9 rounded-xl")} />
        </div>

        <div className={cn("bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-4")}>
          <div className={cn("flex items-center gap-2")}>
            <Skeleton variant="rectangular" className={cn("w-6 h-6 rounded-lg")} />
            <Skeleton variant="text" className={cn("w-44 h-4")} />
          </div>
          <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3")}>
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
          </div>
          <div className={cn("pt-2 border-t border-slate-800/80 space-y-3")}>
            <Skeleton variant="text" className={cn("w-36 h-4")} />
            <div className={cn("grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3")}>
              <Skeleton variant="rectangular" className={cn("h-16 w-full rounded-2xl")} />
              <Skeleton variant="rectangular" className={cn("h-16 w-full rounded-2xl")} />
              <Skeleton variant="rectangular" className={cn("h-16 w-full rounded-2xl")} />
              <Skeleton variant="rectangular" className={cn("h-16 w-full rounded-2xl")} />
            </div>
          </div>
        </div>

        <div className={cn("bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-4")}>
          <div className={cn("flex items-center gap-2")}>
            <Skeleton variant="rectangular" className={cn("w-6 h-6 rounded-lg")} />
            <Skeleton variant="text" className={cn("w-36 h-4")} />
          </div>
          <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3")}>
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
          </div>
          <div className={cn("pt-2 border-t border-slate-800/80 space-y-3")}>
            <Skeleton variant="text" className={cn("w-36 h-4")} />
            <div className={cn("grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3")}>
              <Skeleton variant="rectangular" className={cn("h-16 w-full rounded-2xl")} />
              <Skeleton variant="rectangular" className={cn("h-16 w-full rounded-2xl")} />
            </div>
          </div>
        </div>
      </div>

      <div className={cn("lg:col-span-5 h-auto lg:h-full p-5 space-y-5 flex flex-col justify-between overflow-y-auto scrollbar-none")}>
        <Skeleton variant="rectangular" className={cn("h-13 w-full rounded-2xl")} />

        <div className={cn("bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-3 h-48")}>
          <div className={cn("flex justify-between items-center")}>
            <Skeleton variant="text" className={cn("w-28 h-4")} />
            <Skeleton variant="rectangular" className={cn("w-16 h-5 rounded-full")} />
          </div>
          <div className={cn("space-y-2 pt-2")}>
            <Skeleton variant="text" className={cn("w-full h-3")} />
            <Skeleton variant="text" className={cn("w-5/6 h-3")} />
            <Skeleton variant="text" className={cn("w-4/6 h-3")} />
          </div>
        </div>

        <div className={cn("bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 flex-1 flex flex-col justify-between")}>
          <div className={cn("flex justify-between items-center")}>
            <Skeleton variant="text" className={cn("w-32 h-4")} />
            <Skeleton variant="circular" className={cn("w-4 h-4")} />
          </div>
          <Skeleton variant="rectangular" className={cn("aspect-video w-full rounded-2xl")} />
          <div className={cn("grid grid-cols-3 gap-2 pt-1")}>
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
            <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const PipelineWizardSkeleton: FC<{ className?: string }> = ({ className }) => (
  <div className={cn("flex-1 w-full h-full flex flex-col min-h-0 bg-slate-950 text-slate-100 font-sans overflow-hidden select-none", className)}>
    <div className={cn("h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 shadow-sm")}>
      <div className={cn("flex items-center gap-3")}>
        <Skeleton variant="button" className={cn("w-24 h-8 rounded-lg")} />
        <div className={cn("h-4 w-[1px] bg-slate-800")} />
        <Skeleton variant="text" className={cn("w-36 h-4")} />
      </div>
      <Skeleton variant="rectangular" className={cn("w-36 h-7 rounded-lg")} />
      <div className={cn("flex items-center gap-2")}>
        <Skeleton variant="rectangular" className={cn("w-8 h-8 rounded-lg")} />
        <Skeleton variant="rectangular" className={cn("w-8 h-8 rounded-lg")} />
      </div>
    </div>

    <div className={cn("flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 min-h-0 overflow-y-auto")}>
      <div className={cn("lg:col-span-4 space-y-3")}>
        <div className={cn("flex justify-between items-center pb-1")}>
          <Skeleton variant="text" className={cn("w-28 h-4")} />
          <Skeleton variant="rectangular" className={cn("w-14 h-5 rounded-md")} />
        </div>
        {_.map(_.range(4), (i) => (
          <div key={i} className={cn("p-3.5 rounded-2xl border border-slate-800 bg-slate-900/70 space-y-2")}>
            <div className={cn("flex justify-between items-center")}>
              <Skeleton variant="text" className={cn("w-20 h-3.5")} />
              <Skeleton variant="text" className={cn("w-12 h-3")} />
            </div>
            <Skeleton variant="text" className={cn("w-full h-3")} />
            <Skeleton variant="text" className={cn("w-3/4 h-3")} />
          </div>
        ))}
      </div>

      <div className={cn("lg:col-span-8 space-y-4")}>
        <div className={cn("glass-card rounded-3xl p-5 border border-slate-800/80 space-y-4")}>
          <Skeleton variant="rectangular" className={cn("aspect-video w-full rounded-2xl")} />
          <div className={cn("grid grid-cols-2 gap-3")}>
            <Skeleton variant="button" className={cn("w-full h-10 rounded-xl")} />
            <Skeleton variant="button" className={cn("w-full h-10 rounded-xl")} />
          </div>
          <div className={cn("space-y-2 pt-2")}>
            <Skeleton variant="text" className={cn("w-24 h-3.5")} />
            <Skeleton variant="rectangular" className={cn("h-20 w-full rounded-xl")} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const SettingsSkeleton: FC<{ className?: string }> = ({ className }) => (
  <div className={cn("flex-grow h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto space-y-6", className)}>
    <div className={cn("glass-card p-6 sm:p-7 rounded-3xl shadow-lg flex items-center justify-between gap-4")}>
      <div className={cn("flex items-center gap-4")}>
        <Skeleton variant="rectangular" className={cn("w-12 h-12 rounded-2xl")} />
        <div className={cn("space-y-2")}>
          <Skeleton variant="text" className={cn("w-44 h-5")} />
          <Skeleton variant="text" className={cn("w-64 h-3.5")} />
        </div>
      </div>
      <Skeleton variant="button" className={cn("w-28 h-9 rounded-2xl")} />
    </div>

    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6")}>
      <div className={cn("glass-card rounded-3xl p-6 shadow-md space-y-4")}>
        <div className={cn("flex items-center gap-3 border-b border-slate-800/80 pb-4")}>
          <Skeleton variant="rectangular" className={cn("w-8 h-8 rounded-xl")} />
          <Skeleton variant="text" className={cn("w-36 h-4")} />
        </div>
        <div className={cn("space-y-3")}>
          <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
          <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
          <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
          <Skeleton variant="rectangular" className={cn("h-10 w-full rounded-xl")} />
        </div>
      </div>

      <div className={cn("glass-card rounded-3xl p-6 shadow-md space-y-4")}>
        <div className={cn("flex items-center gap-3 border-b border-slate-800/80 pb-4")}>
          <Skeleton variant="rectangular" className={cn("w-8 h-8 rounded-xl")} />
          <Skeleton variant="text" className={cn("w-40 h-4")} />
        </div>
        <div className={cn("space-y-2")}>
          <Skeleton variant="rectangular" className={cn("h-12 w-full rounded-xl")} />
          <Skeleton variant="rectangular" className={cn("h-12 w-full rounded-xl")} />
        </div>
      </div>
    </div>
  </div>
);
