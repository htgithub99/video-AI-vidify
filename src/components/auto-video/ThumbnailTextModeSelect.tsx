import React from "react";
import _ from "lodash";
import { Type } from "lucide-react";
import { THUMBNAIL_TEXT_MODE_CONFIG } from "../../constants/config";
import { ThumbnailTextMode } from "../../types";
import { THUMBNAIL_TEXT_GROUPS } from "../../constants/texts";
import { GroupedSelect } from "./GroupedSelect";

interface ThumbnailTextModeSelectProps {
  value: ThumbnailTextMode;
  onChange: (value: ThumbnailTextMode) => void;
  language: "vi" | "en";
  label: string;
}

export const ThumbnailTextModeSelect: React.FC<ThumbnailTextModeSelectProps> = ({ value, onChange, language, label }) => {
  const groups = _.get(THUMBNAIL_TEXT_GROUPS, language, THUMBNAIL_TEXT_GROUPS.vi);
  const descriptions = _.get(THUMBNAIL_TEXT_MODE_CONFIG.DESCRIPTIONS, language, THUMBNAIL_TEXT_MODE_CONFIG.DESCRIPTIONS.vi);
  return <GroupedSelect value={value} onChange={onChange} label={label} icon={Type} groups={groups} descriptions={descriptions} />;
};
