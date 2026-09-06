import { FC } from "react";
import { cn } from "../../lib/utils";

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

export interface ProjectTableSkeletonProps {
  rows?: number;
  className?: string;
}

export const ProjectTableSkeleton = createLoadingSkeleton<ProjectTableSkeletonProps>("ProjectTableSkeleton");

export const ProjectListSkeleton = createLoadingSkeleton<ProjectTableSkeletonProps>("ProjectListSkeleton");

export const PipelineWizardSkeleton = createLoadingSkeleton<LoadingSkeletonProps>("PipelineWizardSkeleton");

export const AutoVideoStudioSkeleton = createLoadingSkeleton<LoadingSkeletonProps>("AutoVideoStudioSkeleton");

export const DashboardSkeleton = createLoadingSkeleton<LoadingSkeletonProps>("DashboardSkeleton");

export const SettingsSkeleton = createLoadingSkeleton<LoadingSkeletonProps>("SettingsSkeleton");
