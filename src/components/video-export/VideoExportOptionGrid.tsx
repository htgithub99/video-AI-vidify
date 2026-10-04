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
} from "../../constants/videoExportText";
import { FC } from "react";
import _ from "lodash";
import { LucideIcon } from "lucide-react";
import { Button } from "../ui/Button.js";
import { cn } from "../../lib/utils.js";
export type VideoExportOptionItem<T extends string | number> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};
export type VideoExportOptionSection<T extends string | number> = {
  key: string;
  label: string;
  options: VideoExportOptionItem<T>[];
};
export enum VideoExportOptionTone {
  PURPLE = "purple",
  INDIGO = "indigo",
  AMBER = "amber",
}
type VideoExportOptionGridProps<T extends string | number> = {
  label?: string;
  hint?: string;
  options?: VideoExportOptionItem<T>[];
  sections?: VideoExportOptionSection<T>[];
  value: T;
  columns?: 2 | 3 | 4;
  tone?: VideoExportOptionTone;
  disabled?: boolean;
  scrollableClassName?: string;
  onChange: (value: T) => void;
};
const TONE_CLASSNAMES: Record<VideoExportOptionTone, { active: string; idle: string; hint: string }> = {
  [VideoExportOptionTone.PURPLE]: {
    active: VIDEO_EXPORT_TEXT_BG_PURPLE_600_DARK_BG_PURPLE,
    idle: VIDEO_EXPORT_TEXT_BG_WHITE_DARK_BG_SLATE_950,
    hint: VIDEO_EXPORT_TEXT_TEXT_PURPLE_600_DARK_TEXT_PURPLE,
  },
  [VideoExportOptionTone.INDIGO]: {
    active: VIDEO_EXPORT_TEXT_BG_INDIGO_600_DARK_BG_INDIGO,
    idle: VIDEO_EXPORT_TEXT_BG_WHITE_DARK_BG_SLATE_950_2,
    hint: VIDEO_EXPORT_TEXT_TEXT_INDIGO_600_DARK_TEXT_INDIGO,
  },
  [VideoExportOptionTone.AMBER]: {
    active: VIDEO_EXPORT_TEXT_BG_PURPLE_600_DARK_BG_PURPLE,
    idle: VIDEO_EXPORT_TEXT_BG_WHITE_DARK_BG_SLATE_950,
    hint: VIDEO_EXPORT_TEXT_TEXT_PURPLE_600_DARK_TEXT_PURPLE,
  },
};
const COLUMN_CLASSNAMES: Record<2 | 3 | 4, string> = {
  2: VIDEO_EXPORT_TEXT_GRID_COLS_2,
  3: VIDEO_EXPORT_TEXT_GRID_COLS_3,
  4: VIDEO_EXPORT_TEXT_GRID_COLS_4,
};
export const VideoExportOptionGrid = <T extends string | number>({ label, hint, options = [], sections, value, columns = 3, tone = VideoExportOptionTone.PURPLE, disabled = false, scrollableClassName, onChange }: VideoExportOptionGridProps<T>): ReturnType<FC> => {
  const toneClassNames = TONE_CLASSNAMES[tone];
  const renderOptions = (items: VideoExportOptionItem<T>[]) => (
    <div className={cn("grid gap-1.5", COLUMN_CLASSNAMES[columns])}>
      {_.map(items, (option) => {
        const isSelected = option.value === value;
        const Icon = option.icon;
        return (
          <Button
            key={`${option.value}`}
            variant={VIDEO_EXPORT_TEXT_UNSTYLED}
            type={VIDEO_EXPORT_TEXT_BUTTON}
            disabled={disabled}
            title={option.label}
            onClick={() => onChange(option.value)}
            className={cn("h-8 px-2 rounded-xl border font-mono font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed", isSelected ? toneClassNames.active : toneClassNames.idle)}>
            {Icon && <Icon className={cn("w-3.5 h-3.5 shrink-0")} />}
            <span className={cn("truncate")}>{option.label}</span>
          </Button>
        );
      })}
    </div>
  );
  return (
    <div className={cn("space-y-1.5 pt-0.5")}>
      {label && (
        <div className={cn("flex items-center justify-between gap-2")}>
          <label className={cn("text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5")}>{label}</label>
          {hint && <span className={cn("text-[11px] font-mono font-bold truncate", toneClassNames.hint)}>{hint}</span>}
        </div>
      )}
      <div className={scrollableClassName}>
        {_.isEmpty(sections) ? (
          renderOptions(options)
        ) : (
          <div className={cn("space-y-2")}>
            {_.map(sections, (section) => (
              <div key={section.key} className={cn("space-y-1.5")}>
                <div className={cn("flex items-center gap-2")}>
                  <span className={cn("text-[9px] font-mono font-bold text-slate-600 dark:text-slate-500 shrink-0")}>{section.label}</span>
                  <span className={cn("h-px flex-1 bg-slate-200 dark:bg-slate-800/80")} />
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
