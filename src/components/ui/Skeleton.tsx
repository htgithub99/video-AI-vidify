import { FC, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "rectangular" | "circular" | "text" | "card" | "button";
}

export const MinimalSpinnerLoading: FC<{ className?: string }> = ({ className }) => (
  <div className={cn("w-full h-full min-h-[220px] flex-1 flex items-center justify-center p-6 select-none", className)}>
    <div className="loader-circle" />
  </div>
);

export const PageLoadingSpinner: FC<{ className?: string }> = ({ className }) => (
  <div className={cn("flex items-center justify-center select-none", className)}>
    <div className="loader-circle" />
  </div>
);

type LoadingSkeletonProps = { className?: string };

const createLoadingSkeleton = <T extends LoadingSkeletonProps>(displayName: string): FC<T> => {
  const LoadingSkeleton: FC<T> = ({ className }) => <MinimalSpinnerLoading className={className} />;
  LoadingSkeleton.displayName = displayName;
  return LoadingSkeleton;
};

export const Skeleton = createLoadingSkeleton<SkeletonProps>("Skeleton");

export const SkeletonText = createLoadingSkeleton<{ lines?: number; className?: string }>("SkeletonText");

export const SkeletonCard = createLoadingSkeleton<LoadingSkeletonProps>("SkeletonCard");

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

export const ProjectTableSkeleton = createLoadingSkeleton<ProjectTableSkeletonProps>("ProjectTableSkeleton");

export const ProjectListSkeleton = createLoadingSkeleton<ProjectTableSkeletonProps>("ProjectListSkeleton");

export const PipelineSkeleton = createLoadingSkeleton<LoadingSkeletonProps>("PipelineSkeleton");

export const PipelineWizardSkeleton = createLoadingSkeleton<LoadingSkeletonProps>("PipelineWizardSkeleton");

export const AutoVideoStudioSkeleton = createLoadingSkeleton<LoadingSkeletonProps>("AutoVideoStudioSkeleton");

export const DashboardSkeleton = createLoadingSkeleton<LoadingSkeletonProps>("DashboardSkeleton");

export const VoiceDialogSkeleton = createLoadingSkeleton<LoadingSkeletonProps>("VoiceDialogSkeleton");

export const VoiceGridSkeleton = createLoadingSkeleton<{ count?: number; className?: string }>("VoiceGridSkeleton");

export const LogPanelSkeleton = createLoadingSkeleton<LoadingSkeletonProps>("LogPanelSkeleton");

export const PreviewPanelSkeleton = createLoadingSkeleton<LoadingSkeletonProps>("PreviewPanelSkeleton");

export const TimelineSkeleton = createLoadingSkeleton<LoadingSkeletonProps>("TimelineSkeleton");

export const MediaGridSkeleton = createLoadingSkeleton<{ count?: number; className?: string }>("MediaGridSkeleton");

export const SettingsSkeleton = createLoadingSkeleton<LoadingSkeletonProps>("SettingsSkeleton");
