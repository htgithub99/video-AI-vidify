import { AppTab } from "../constants/enums";
import { DashboardSkeleton, ProjectListSkeleton, AutoVideoStudioSkeleton, SettingsSkeleton, PipelineWizardSkeleton } from "./ui/Skeleton";
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
      <div className="w-full h-full min-h-0 flex flex-col overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
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
