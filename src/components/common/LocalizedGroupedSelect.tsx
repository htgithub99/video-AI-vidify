import { type LucideIcon } from "lucide-react";
import _ from "lodash";
import { type Lang } from "../../lib/lang";
import { GroupedSelect, type SelectOptionGroup } from "../auto-video/GroupedSelect";
export interface LocalizedGroupedSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  language: Lang;
  label: string;
}
interface Props<T extends string> extends LocalizedGroupedSelectProps<T> {
  icon: LucideIcon;
  groups: Record<Lang, readonly SelectOptionGroup[]>;
  descriptions: Record<Lang, Partial<Record<T, string>>>;
}
export const LocalizedGroupedSelect = <T extends string>({ language, groups, descriptions, ...props }: Props<T>) => <GroupedSelect {...props} groups={_.get(groups, language, groups.vi)} descriptions={_.get(descriptions, language, descriptions.vi)} />;
