import React from "react";
import _ from "lodash";
import { ChevronDown, Layers } from "lucide-react";
import { BackgroundMode } from "../../types";
import { BACKGROUND_MODE_CONFIG } from "../../constants/config";

interface BackgroundModeSelectProps {
  value: BackgroundMode;
  onChange: (value: BackgroundMode) => void;
  language: "vi" | "en";
  label: string;
}

const BACKGROUND_OPTION_GROUPS = {
  vi: [
    {
      label: "Mặc định",
      options: [
        { value: "auto", label: "Tự động", desc: "AI học cách dựng nền từ ảnh mẫu và điều chỉnh theo từng cảnh" },
        { value: "minimal", label: "Nền tối giản", desc: "Nền gọn, chỉ giữ chi tiết cần thiết để kể chuyện" },
      ],
    },
    {
      label: "Nâng cao",
      options: [
        { value: "contextual", label: "Bối cảnh đầy đủ", desc: "Dựng đầy đủ địa điểm, kiến trúc và đạo cụ theo kịch bản" },
        { value: "transparent", label: "Không nền (Tách chủ thể)", desc: "Tách chủ thể để ghép nền ở bước hậu kỳ" },
      ],
    },
  ],
  en: [
    {
      label: "Default",
      options: [
        { value: "auto", label: "Automatic", desc: "AI learns reference environment and adapts per scene" },
        { value: "minimal", label: "Minimal", desc: "Clean background with only story-critical details" },
      ],
    },
    {
      label: "Advanced",
      options: [
        { value: "contextual", label: "Full Setting", desc: "Build full location, architecture and props" },
        { value: "transparent", label: "Transparent", desc: "Isolate subject for later compositing" },
      ],
    },
  ],
};

export const BackgroundModeSelect: React.FC<BackgroundModeSelectProps> = ({
  value,
  onChange,
  language,
  label,
}) => {
  const groups = _.get(BACKGROUND_OPTION_GROUPS, language, BACKGROUND_OPTION_GROUPS.vi);
  const descriptions = _.get(BACKGROUND_MODE_CONFIG.DESCRIPTIONS, language, BACKGROUND_MODE_CONFIG.DESCRIPTIONS.vi);
  const currentDesc = _.get(descriptions, value, "");

  return (
    <div className="space-y-1">
      <span
        className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block"
        title={currentDesc}
      >
        {label}
      </span>
      <div
        className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors"
        title={currentDesc}
      >
        <Layers className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as BackgroundMode)}
          className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
        >
          {_.map(groups, (group) => (
            <optgroup key={group.label} label={group.label} className="bg-slate-955 text-slate-400 font-bold">
              {_.map(group.options, (option) => (
                <option
                  key={option.value}
                  value={option.value}
                  title={option.desc}
                  className="bg-slate-955 text-slate-300 font-normal"
                >
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
      </div>
    </div>
  );
};
