import React from "react";
import _ from "lodash";
import { Layers } from "lucide-react";
import { BackgroundMode } from "../../types";
import { BACKGROUND_MODE_CONFIG } from "../../constants/config";
import { BACKGROUND_OPTION_GROUPS } from "../../constants/texts";
import { GroupedSelect } from "./GroupedSelect";

interface BackgroundModeSelectProps {
  value: BackgroundMode;
  onChange: (value: BackgroundMode) => void;
  language: "vi" | "en";
  label: string;
}

export const BackgroundModeSelect: React.FC<BackgroundModeSelectProps> = ({ value, onChange, language, label }) => {
  const groups = _.get(BACKGROUND_OPTION_GROUPS, language, BACKGROUND_OPTION_GROUPS.vi);
  const descriptions = _.get(BACKGROUND_MODE_CONFIG.DESCRIPTIONS, language, BACKGROUND_MODE_CONFIG.DESCRIPTIONS.vi);
  return <GroupedSelect value={value} onChange={onChange} label={label} icon={Layers} groups={groups} descriptions={descriptions} />;
};
