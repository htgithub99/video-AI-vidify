import { Type } from "lucide-react";
import { TextInImageMode } from "../../../types";
import { TEXT_IN_IMAGE_MODE_CONFIG } from "../../../constants/config";
import { SCENE_TEXT_GROUPS } from "../../../constants/texts";
import { LocalizedGroupedSelect, type LocalizedGroupedSelectProps } from "../../../components/common/LocalizedGroupedSelect";
export const SceneTextModeSelect = (props: LocalizedGroupedSelectProps<TextInImageMode>) => <LocalizedGroupedSelect {...props} icon={Type} groups={SCENE_TEXT_GROUPS} descriptions={TEXT_IN_IMAGE_MODE_CONFIG.DESCRIPTIONS} />;
