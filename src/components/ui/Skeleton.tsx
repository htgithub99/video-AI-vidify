import { FC, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "rectangular" | "circular" | "text" | "card" | "button";
}

export const MinimalSpinnerLoading: FC<{ className?: string }> = ({ className }) => (
  <div className={cn("w-full h-full min-h-[220px] flex-1 flex items-center justify-center p-6 select-none", className)}>
    <div className="relative flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-[2.5px] border-slate-700/20 border-t-[#38bdf8] border-r-[#a855f7] border-b-[#f43f5e] animate-spin" />
    </div>
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
