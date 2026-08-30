import { FC, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "rectangular" | "circular" | "text" | "card" | "button";
}

export const MinimalSpinnerLoading: FC<{ className?: string }> = ({ className }) => (
  <div className={cn("w-full h-full min-h-[220px] flex-1 flex items-center justify-center p-6 select-none", className)}>
    <div className="relative w-[52px] h-[52px] rounded-full flex items-center justify-center bg-[conic-gradient(from_0deg,#3b82f6,#a855f7,#ec4899,#3b82f6)] animate-spin shadow-[0_0_24px_rgba(168,85,247,0.35)]">
      <div className="w-[44px] h-[44px] rounded-full bg-[#1F1F1F] dark:bg-[#1F1F1F] transition-colors" />
    </div>
  </div>
);

export const PageLoadingSpinner: FC<{ className?: string }> = ({ className }) => (
  <div className={cn("flex flex-col items-center justify-center gap-4 select-none", className)}>
    <div className="relative w-[52px] h-[52px] rounded-full flex items-center justify-center bg-[conic-gradient(from_0deg,#3b82f6,#a855f7,#ec4899,#3b82f6)] animate-spin shadow-[0_0_24px_rgba(168,85,247,0.35)]">
      <div className="w-[44px] h-[44px] rounded-full bg-[#1F1F1F] dark:bg-[#1F1F1F] transition-colors" />
    </div>
    <span className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase animate-pulse">Đang tải không gian làm việc...</span>
  </div>
);

export const Skeleton: FC<SkeletonProps> = ({ className }) => <MinimalSpinnerLoading className={className} />;

export const SkeletonText: FC<{ lines?: number; className?: string }> = ({ className }) => <MinimalSpinnerLoading className={className} />;

export const SkeletonCard: FC<{ className?: string }> = ({ className }) => <MinimalSpinnerLoading className={className} />;

export interface SkeletonWrapperProps {
  isLoading: boolean;
  skeleton?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const SkeletonWrapper: FC<SkeletonWrapperProps> = ({ isLoading, children, className }) => {
  if (isLoading) {
    return <MinimalSpinnerLoading className={className} />;
  }
  return <>{children}</>;
};

export interface ProjectTableSkeletonProps {
  rows?: number;
  className?: string;
}

export const ProjectTableSkeleton: FC<ProjectTableSkeletonProps> = ({ className }) => <MinimalSpinnerLoading className={className} />;

export const ProjectListSkeleton: FC<ProjectTableSkeletonProps> = ({ className }) => <MinimalSpinnerLoading className={className} />;

export const PipelineSkeleton: FC<{ className?: string }> = ({ className }) => <MinimalSpinnerLoading className={className} />;

export const PipelineWizardSkeleton: FC<{ className?: string }> = ({ className }) => <MinimalSpinnerLoading className={className} />;

export const AutoVideoStudioSkeleton: FC<{ className?: string }> = ({ className }) => <MinimalSpinnerLoading className={className} />;

export const DashboardSkeleton: FC<{ className?: string }> = ({ className }) => <MinimalSpinnerLoading className={className} />;

export const VoiceDialogSkeleton: FC<{ className?: string }> = ({ className }) => <MinimalSpinnerLoading className={className} />;

export const VoiceGridSkeleton: FC<{ count?: number; className?: string }> = ({ className }) => <MinimalSpinnerLoading className={className} />;

export const LogPanelSkeleton: FC<{ className?: string }> = ({ className }) => <MinimalSpinnerLoading className={className} />;

export const PreviewPanelSkeleton: FC<{ className?: string }> = ({ className }) => <MinimalSpinnerLoading className={className} />;

export const TimelineSkeleton: FC<{ className?: string }> = ({ className }) => <MinimalSpinnerLoading className={className} />;

export const MediaGridSkeleton: FC<{ count?: number; className?: string }> = ({ className }) => <MinimalSpinnerLoading className={className} />;

export const SettingsSkeleton: FC<{ className?: string }> = ({ className }) => <MinimalSpinnerLoading className={className} />;
