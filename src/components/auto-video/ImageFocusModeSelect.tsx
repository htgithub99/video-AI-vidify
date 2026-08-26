import React from "react";
import _ from "lodash";
import { ChevronDown, Focus } from "lucide-react";
import { ImageFocusMode } from "../../types";
import { IMAGE_FOCUS_MODE_CONFIG } from "../../constants/config";

interface ImageFocusModeSelectProps {
  value: ImageFocusMode;
  onChange: (value: ImageFocusMode) => void;
  language: "vi" | "en";
  label: string;
}

const IMAGE_FOCUS_OPTION_GROUPS = {
  vi: [
    {
      label: "Tự động",
      options: [
        { value: "default", label: "Tự động", desc: "AI chọn trọng tâm bố cục phù hợp nhất với từng cảnh" },
      ],
    },
    {
      label: "Trọng tâm chủ thể",
      options: [
        { value: "portrait", label: "Chủ thể nổi bật", desc: "Ưu tiên làm nổi bật một nhân vật/chủ thể chính trong khung hình" },
        { value: "action", label: "Hành động", desc: "Ưu tiên hành động và cử chỉ rõ ràng, sinh động của nhân vật" },
      ],
    },
    {
      label: "Không gian & Nghệ thuật",
      options: [
        { value: "landscape", label: "Toàn cảnh", desc: "Ưu tiên không gian bối cảnh rộng, toàn cảnh điện ảnh" },
        { value: "conceptual", label: "Nghệ thuật", desc: "Ưu tiên cách thể hiện nghệ thuật, biểu tượng và chiều sâu cảm xúc" },
      ],
    },
  ],
  en: [
    {
      label: "Automatic",
      options: [
        { value: "default", label: "Auto", desc: "AI chooses focus adaptively per scene" },
      ],
    },
    {
      label: "Subject Focus",
      options: [
        { value: "portrait", label: "Subject Focus", desc: "Prioritize one main subject prominently" },
        { value: "action", label: "Action", desc: "Prioritize clear and dynamic action" },
      ],
    },
    {
      label: "Setting & Artistic",
      options: [
        { value: "landscape", label: "Wide Scene", desc: "Prioritize wide cinematic environment" },
        { value: "conceptual", label: "Artistic", desc: "Prioritize artistic and symbolic expression" },
      ],
    },
  ],
};

export const ImageFocusModeSelect: React.FC<ImageFocusModeSelectProps> = ({
  value,
  onChange,
  language,
  label,
}) => {
  const groups = _.get(IMAGE_FOCUS_OPTION_GROUPS, language, IMAGE_FOCUS_OPTION_GROUPS.vi);
  const descriptions = _.get(IMAGE_FOCUS_MODE_CONFIG.DESCRIPTIONS, language, IMAGE_FOCUS_MODE_CONFIG.DESCRIPTIONS.vi);
  const currentDesc = _.get(descriptions, value as keyof typeof descriptions, "");

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
        <Focus className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as ImageFocusMode)}
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
