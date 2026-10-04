import { SOURCE_TEXT_AUTOVIDEOSTUDIOSKELETON, SOURCE_TEXT_DASHBOARDSKELETON, SOURCE_TEXT_PROJECTLISTSKELETON, SOURCE_TEXT_PROJECTTABLESKELETON, SOURCE_TEXT_SETTINGSSKELETON } from "../../constants/sourceText";
import { FC } from "react";
import { cn } from "../../lib/utils";
export const MinimalSpinnerLoading: FC<{ className?: string }> = ({ className }) => (
  <div className={cn("w-full h-full min-h-[220px] flex-1 flex items-center justify-center p-6 select-none", className)}>
    <div className={cn("loader-circle")} />
  </div>
);
export const PageLoadingSpinner: FC<{ className?: string }> = ({ className }) => (
  <div className={cn("flex items-center justify-center select-none", className)}>
    <div className={cn("loader-circle")} />
  </div>
);
type LoadingSkeletonProps = { className?: string };
const createLoadingSkeleton = <T extends LoadingSkeletonProps>(displayName: string): FC<T> => {
  const LoadingSkeleton: FC<T> = ({ className }) => <MinimalSpinnerLoading className={cn(className)} />;
  LoadingSkeleton.displayName = displayName;
  return LoadingSkeleton;
};
export interface ProjectTableSkeletonProps {
  rows?: number;
  className?: string;
}
export const ProjectTableSkeleton = createLoadingSkeleton<ProjectTableSkeletonProps>(SOURCE_TEXT_PROJECTTABLESKELETON);
export const ProjectListSkeleton = createLoadingSkeleton<ProjectTableSkeletonProps>(SOURCE_TEXT_PROJECTLISTSKELETON);
export const AutoVideoStudioSkeleton = createLoadingSkeleton<LoadingSkeletonProps>(SOURCE_TEXT_AUTOVIDEOSTUDIOSKELETON);
export const DashboardSkeleton = createLoadingSkeleton<LoadingSkeletonProps>(SOURCE_TEXT_DASHBOARDSKELETON);
export const SettingsSkeleton = createLoadingSkeleton<LoadingSkeletonProps>(SOURCE_TEXT_SETTINGSSKELETON);
