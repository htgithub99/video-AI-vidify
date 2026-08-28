import { FC } from "react";
import { AppTab } from "../constants/enums";
import { DashboardSkeleton, ProjectListSkeleton, AutoVideoStudioSkeleton, PipelineWizardSkeleton, SettingsSkeleton } from "./ui/Skeleton";
import _ from "lodash";

interface TabContentLoadingProps {
  activeTab?: AppTab | string;
}

export default function TabContentLoading({ activeTab }: TabContentLoadingProps) {
  if (_.isEqual(activeTab, AppTab.DASHBOARD)) {
    return <DashboardSkeleton />;
  }

  if (_.isEqual(activeTab, AppTab.PROJECTS)) {
    return (
      <div className="flex-grow h-full overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 w-full max-w-7xl mx-auto">
        <ProjectListSkeleton />
      </div>
    );
  }

  if (_.isEqual(activeTab, AppTab.SETTINGS)) {
    return <SettingsSkeleton />;
  }

  if (_.isEqual(activeTab, AppTab.STUDIO)) {
    return <PipelineWizardSkeleton />;
  }

  return <AutoVideoStudioSkeleton />;
}
