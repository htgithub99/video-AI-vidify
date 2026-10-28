import { RUNTIME_TEXT as RT_VIDEO_EXPORT } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import {
  VIDEO_EXPORT_TEXT_BG_INDIGO_600_DARK_BG_INDIGO,
  VIDEO_EXPORT_TEXT_BG_PURPLE_600_DARK_BG_PURPLE,
  VIDEO_EXPORT_TEXT_BG_WHITE_DARK_BG_SLATE_950,
  VIDEO_EXPORT_TEXT_BG_WHITE_DARK_BG_SLATE_950_2,
  VIDEO_EXPORT_TEXT_BUTTON,
  VIDEO_EXPORT_TEXT_GRID_COLS_2,
  VIDEO_EXPORT_TEXT_GRID_COLS_3,
  VIDEO_EXPORT_TEXT_GRID_COLS_4,
  VIDEO_EXPORT_TEXT_TEXT_INDIGO_600_DARK_TEXT_INDIGO,
  VIDEO_EXPORT_TEXT_TEXT_PURPLE_600_DARK_TEXT_PURPLE,
  VIDEO_EXPORT_TEXT_UNSTYLED,
} from "../../../constants/videoExportText";
import { FC } from "react";
import _ from "lodash";
import { LucideIcon } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { cn } from "../../../lib/utils.js";
export type VideoExportOptionItem<T extends string | number> = { value: T; label: string; icon?: LucideIcon };
export type VideoExportOptionSection<T extends string | number> = { key: string; label: string; options: VideoExportOptionItem<T>[] };
export enum VideoExportOptionTone {
  PURPLE = "purple",
  INDIGO = "indigo",
  AMBER = "amber",
}
type VideoExportOptionGridProps<T extends string | number> = { label?: string; hint?: string; options?: VideoExportOptionItem<T>[]; sections?: VideoExportOptionSection<T>[]; value: T; columns?: 2 | 3 | 4; tone?: VideoExportOptionTone; disabled?: boolean; scrollableClassName?: string; onChange: (value: T) => void };
const TONE_CLASSNAMES: Record<VideoExportOptionTone, { active: string; idle: string; hint: string }> = {
  [VideoExportOptionTone.PURPLE]: { active: VIDEO_EXPORT_TEXT_BG_PURPLE_600_DARK_BG_PURPLE, idle: VIDEO_EXPORT_TEXT_BG_WHITE_DARK_BG_SLATE_950, hint: VIDEO_EXPORT_TEXT_TEXT_PURPLE_600_DARK_TEXT_PURPLE },
  [VideoExportOptionTone.INDIGO]: { active: VIDEO_EXPORT_TEXT_BG_INDIGO_600_DARK_BG_INDIGO, idle: VIDEO_EXPORT_TEXT_BG_WHITE_DARK_BG_SLATE_950_2, hint: VIDEO_EXPORT_TEXT_TEXT_INDIGO_600_DARK_TEXT_INDIGO },
  [VideoExportOptionTone.AMBER]: { active: VIDEO_EXPORT_TEXT_BG_PURPLE_600_DARK_BG_PURPLE, idle: VIDEO_EXPORT_TEXT_BG_WHITE_DARK_BG_SLATE_950, hint: VIDEO_EXPORT_TEXT_TEXT_PURPLE_600_DARK_TEXT_PURPLE },
};
const COLUMN_CLASSNAMES: Record<2 | 3 | 4, string> = { 2: VIDEO_EXPORT_TEXT_GRID_COLS_2, 3: VIDEO_EXPORT_TEXT_GRID_COLS_3, 4: VIDEO_EXPORT_TEXT_GRID_COLS_4 };
export const VideoExportOptionGrid = <T extends string | number>({ label, hint, options = [], sections, value, columns = 3, tone = VideoExportOptionTone.PURPLE, disabled = false, scrollableClassName, onChange }: VideoExportOptionGridProps<T>): ReturnType<FC> => {
  const toneClassNames = TONE_CLASSNAMES[tone];
  const renderOptions = (items: VideoExportOptionItem<T>[]) => (
    <div className={cn(RT_VIDEO_EXPORT.GRID_GAP_1_5, COLUMN_CLASSNAMES[columns])}>
      {_.map(items, (option) => {
        const isSelected = option.value === value;
        const Icon = option.icon;
        return (
          <Button key={`${option.value}`} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} disabled={disabled} title={option.label} onClick={() => onChange(option.value)} className={cn(RT_VIDEO_EXPORT.H_8_PX_2_ROUNDED_XL_BORDER_FONT_MONO_FONT, isSelected ? toneClassNames.active : toneClassNames.idle)}>
            {Icon && <Icon className={cn(RT_SHARED.W_3_5_H_3_5_SHRINK_0)} />}
            <span className={cn(RT_SHARED.TRUNCATE)}>{option.label}</span>
          </Button>
        );
      })}
    </div>
  );
  return (
    <div className={cn(RT_VIDEO_EXPORT.SPACE_Y_1_5_PT_0_5)}>
      {label && (
        <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2)}>
          <label className={cn(RT_VIDEO_EXPORT.TEXT_XS_FONT_MEDIUM_TEXT_SLATE_700_DARK_TEXT_SLATE)}>{label}</label>
          {hint && <span className={cn(RT_VIDEO_EXPORT.TEXT_11PX_FONT_MONO_FONT_BOLD_TRUNCATE, toneClassNames.hint)}>{hint}</span>}
        </div>
      )}
      <div className={scrollableClassName}>
        {_.isEmpty(sections) ? (
          renderOptions(options)
        ) : (
          <div className={cn(RT_SHARED.SPACE_Y_2)}>
            {_.map(sections, (section) => (
              <div key={section.key} className={cn(RT_SHARED.SPACE_Y_1_5)}>
                <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2)}>
                  <span className={cn(RT_VIDEO_EXPORT.TEXT_9PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_600_DARK)}>{section.label}</span>
                  <span className={cn(RT_VIDEO_EXPORT.H_PX_FLEX_1_BG_SLATE_200_DARK_BG_SLATE)} />
                </div>
                {renderOptions(section.options)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
