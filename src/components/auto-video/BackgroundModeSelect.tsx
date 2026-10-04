import { Layers } from "lucide-react";
import { BackgroundMode } from "../../types";
import { BACKGROUND_MODE_CONFIG } from "../../constants/config";
import { BACKGROUND_OPTION_GROUPS } from "../../constants/texts";
import { LocalizedGroupedSelect, type LocalizedGroupedSelectProps } from "../common/LocalizedGroupedSelect";
export const BackgroundModeSelect = (props: LocalizedGroupedSelectProps<BackgroundMode>) => <LocalizedGroupedSelect {...props} icon={Layers} groups={BACKGROUND_OPTION_GROUPS} descriptions={BACKGROUND_MODE_CONFIG.DESCRIPTIONS} />;
