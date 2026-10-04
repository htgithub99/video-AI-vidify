import { Focus } from "lucide-react";
import { ImageFocusMode } from "../../types";
import { IMAGE_FOCUS_MODE_CONFIG } from "../../constants/config";
import { IMAGE_FOCUS_OPTION_GROUPS } from "../../constants/texts";
import { LocalizedGroupedSelect, type LocalizedGroupedSelectProps } from "../common/LocalizedGroupedSelect";
export const ImageFocusModeSelect = (props: LocalizedGroupedSelectProps<ImageFocusMode>) => <LocalizedGroupedSelect {...props} icon={Focus} groups={IMAGE_FOCUS_OPTION_GROUPS} descriptions={IMAGE_FOCUS_MODE_CONFIG.DESCRIPTIONS} />;
