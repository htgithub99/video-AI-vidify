import React from "react";
import _ from "lodash";
import { Type } from "lucide-react";
import { TEXT_IN_IMAGE_MODE_CONFIG } from "../../constants/config";
import { TextInImageMode } from "../../types";
import { SCENE_TEXT_GROUPS } from "../../constants/texts";
import { GroupedSelect } from "./GroupedSelect";

interface SceneTextModeSelectProps {
  value: TextInImageMode;
  onChange: (value: TextInImageMode) => void;
  language: "vi" | "en";
  label: string;
}

export const SceneTextModeSelect: React.FC<SceneTextModeSelectProps> = ({ value, onChange, language, label }) => {
  const groups = _.get(SCENE_TEXT_GROUPS, language, SCENE_TEXT_GROUPS.vi);
  const descriptions = _.get(TEXT_IN_IMAGE_MODE_CONFIG.DESCRIPTIONS, language, TEXT_IN_IMAGE_MODE_CONFIG.DESCRIPTIONS.vi);
  return <GroupedSelect value={value} onChange={onChange} label={label} icon={Type} groups={groups} descriptions={descriptions} />;
};
