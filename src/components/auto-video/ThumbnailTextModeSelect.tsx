import { Type } from "lucide-react";
import { ThumbnailTextMode } from "../../types";
import { THUMBNAIL_TEXT_MODE_CONFIG } from "../../constants/config";
import { THUMBNAIL_TEXT_GROUPS } from "../../constants/texts";
import { LocalizedGroupedSelect, type LocalizedGroupedSelectProps } from "../common/LocalizedGroupedSelect";
export const ThumbnailTextModeSelect = (props: LocalizedGroupedSelectProps<ThumbnailTextMode>) => <LocalizedGroupedSelect {...props} icon={Type} groups={THUMBNAIL_TEXT_GROUPS} descriptions={THUMBNAIL_TEXT_MODE_CONFIG.DESCRIPTIONS} />;
