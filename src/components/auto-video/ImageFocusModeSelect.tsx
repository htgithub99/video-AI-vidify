import React from "react";
import _ from "lodash";
import { Focus } from "lucide-react";
import { ImageFocusMode } from "../../types";
import { IMAGE_FOCUS_MODE_CONFIG } from "../../constants/config";
import { IMAGE_FOCUS_OPTION_GROUPS } from "../../constants/texts";
import { GroupedSelect } from "./GroupedSelect";

interface ImageFocusModeSelectProps {
  value: ImageFocusMode;
  onChange: (value: ImageFocusMode) => void;
  language: "vi" | "en";
  label: string;
}

export const ImageFocusModeSelect: React.FC<ImageFocusModeSelectProps> = ({ value, onChange, language, label }) => {
  const groups = _.get(IMAGE_FOCUS_OPTION_GROUPS, language, IMAGE_FOCUS_OPTION_GROUPS.vi);
  const descriptions = _.get(IMAGE_FOCUS_MODE_CONFIG.DESCRIPTIONS, language, IMAGE_FOCUS_MODE_CONFIG.DESCRIPTIONS.vi);
  return <GroupedSelect value={value} onChange={onChange} label={label} icon={Focus} groups={groups} descriptions={descriptions} />;
};
