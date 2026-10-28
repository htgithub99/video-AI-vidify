import { RUNTIME_TEXT as RT_UI } from "../../constants/runtime/ui.js";
import { SOURCE_TEXT_AUTOVIDEOSTUDIOSKELETON, SOURCE_TEXT_DASHBOARDSKELETON, SOURCE_TEXT_PROJECTLISTSKELETON, SOURCE_TEXT_PROJECTTABLESKELETON, SOURCE_TEXT_SETTINGSSKELETON } from "../../constants/sourceText";
import { FC } from "react";
import { cn } from "../../lib/utils";
export const MinimalSpinnerLoading: FC<{ className?: string }> = ({ className }) => (
  <div className={cn(RT_UI.W_FULL_H_FULL_MIN_H_220PX_FLEX_1_FLEX, className)}>
    <div className={cn(RT_UI.LOADER_CIRCLE)} />
  </div>
);
export const PageLoadingSpinner: FC<{ className?: string }> = ({ className }) => (
  <div className={cn(RT_UI.FLEX_ITEMS_CENTER_JUSTIFY_CENTER_SELECT_NONE, className)}>
    <div className={cn(RT_UI.LOADER_CIRCLE)} />
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
