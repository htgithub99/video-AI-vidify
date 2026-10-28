import { RUNTIME_TEXT as RT_VIDEO_GENERATION } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { SOURCE_TEXT_BUTTON, SOURCE_TEXT_GHOST, SOURCE_TEXT_LG, SOURCE_TEXT_PURPLE, SOURCE_TEXT_SM, SOURCE_TEXT_UNSTYLED } from "../../../constants/sourceText";
import React, { useEffect, useMemo, useState } from "react";
import _ from "lodash";
import { Check, RefreshCw, Video } from "lucide-react";
import { cn } from "../../../lib/utils";
import { StoryboardScene } from "../../../types";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
interface SceneRegenerationTexts {
  sceneDialogTitle: string;
  sceneLabel: string;
  sceneEmpty: string;
  sceneCancel: string;
  sceneConfirm: string;
  sceneRequired: string;
}
interface SceneRegenerationDialogProps {
  isOpen: boolean;
  isProcessing: boolean;
  scenes: StoryboardScene[];
  texts: SceneRegenerationTexts;
  onClose: () => void;
  onConfirm: (sceneId: string) => Promise<void>;
}
const getSceneDescription = (scene: StoryboardScene): string => _.trim(scene.spokenDialogue || scene.subtitle || scene.script || scene.visualIntent || scene.id);
export const SceneRegenerationDialog: React.FC<SceneRegenerationDialogProps> = ({ isOpen, isProcessing, scenes, texts, onClose, onConfirm }) => {
  const availableScenes = useMemo(() => _.filter(scenes, (scene) => !_.isEmpty(scene.id)), [scenes]);
  const [selectedSceneId, setSelectedSceneId] = useState("");
  useEffect(() => {
    if (!isOpen) setSelectedSceneId("");
  }, [isOpen]);
  const confirmSelection = async () => {
    if (_.isEmpty(selectedSceneId)) return;
    await onConfirm(selectedSceneId);
    onClose();
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={texts.sceneDialogTitle} maxWidth={SOURCE_TEXT_LG}>
      <div className={cn(RT_VIDEO_GENERATION.SPACE_Y_4)}>
        {_.isEmpty(availableScenes) ? (
          <p className={cn(RT_VIDEO_GENERATION.TEXT_SM_TEXT_SLATE_700_DARK_TEXT_SLATE_300_FONT)}>{texts.sceneEmpty}</p>
        ) : (
          <div className={cn(RT_VIDEO_GENERATION.MAX_H_55VH_SPACE_Y_2_OVERFLOW_Y_AUTO_PR)}>
            {_.map(availableScenes, (scene, index) => {
              const isSelected = _.isEqual(selectedSceneId, scene.id);
              const description = getSceneDescription(scene);
              return (
                <Button
                  variant={SOURCE_TEXT_UNSTYLED}
                  key={scene.id}
                  type={SOURCE_TEXT_BUTTON}
                  onClick={() => setSelectedSceneId(scene.id)}
                  title={description}
                  className={cn(RT_VIDEO_GENERATION.W_FULL_ROUNDED_XL_BORDER_P_3_TEXT_LEFT_TRANSITION, { "border-purple-500 bg-purple-500/15 ring-1 ring-purple-500/40 shadow-sm": isSelected, "border-amber-900/15 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 hover:border-purple-400 dark:hover:border-slate-500 hover:bg-amber-50/50 dark:hover:bg-slate-800/80 shadow-sm": !isSelected })}>
                  <span className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_START_GAP_3)}>
                    <span className={cn(RT_VIDEO_GENERATION.MT_0_5_FLEX_H_8_W_8_SHRINK_0, { "bg-purple-600 text-white": isSelected, "bg-purple-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300": !isSelected })}>{isSelected ? <Check className={cn(RT_VIDEO_GENERATION.H_4_W_4_STROKE_2_5)} /> : <Video className={cn(RT_VIDEO_GENERATION.H_4_W_4)} />}</span>
                    <span className={cn(RT_SHARED.MIN_W_0)}>
                      <span className={cn(RT_VIDEO_GENERATION.BLOCK_TEXT_XS_FONT_BOLD_TEXT_0F172A_DARK_TEXT_SLATE)}>{`${texts.sceneLabel}${RT_SHARED.SYMBOL_36A9E7}${index + 1}`}</span>
                      <span className={cn(RT_VIDEO_GENERATION.MT_1_BLOCK_TRUNCATE_TEXT_XS_TEXT_334155_DARK_TEXT)}>{description}</span>
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>
        )}
        <div className={cn(RT_VIDEO_GENERATION.FLEX_JUSTIFY_END_GAP_2_PT_2)}>
          <Button variant={SOURCE_TEXT_GHOST} size={SOURCE_TEXT_SM} onClick={onClose} disabled={isProcessing} title={texts.sceneCancel} className={cn(RT_VIDEO_GENERATION.TEXT_SLATE_700_HOVER_TEXT_SLATE_900_DARK_TEXT_SLATE)}>
            {texts.sceneCancel}
          </Button>
          <Button variant={SOURCE_TEXT_PURPLE} size={SOURCE_TEXT_SM} onClick={confirmSelection} disabled={isProcessing || _.isEmpty(selectedSceneId)} title={_.isEmpty(selectedSceneId) ? texts.sceneRequired : texts.sceneConfirm} className={cn(RT_VIDEO_GENERATION.FONT_BOLD)}>
            <RefreshCw className={cn(RT_VIDEO_GENERATION.H_4_W_4, { "animate-spin": isProcessing })} />
            {texts.sceneConfirm}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
