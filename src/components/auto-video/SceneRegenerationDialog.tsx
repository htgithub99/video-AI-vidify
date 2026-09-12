import React, { useEffect, useMemo, useState } from "react";
import _ from "lodash";
import { Check, RefreshCw, Video } from "lucide-react";
import { cn } from "../../lib/utils";
import { StoryboardScene } from "../../types";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

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

const getSceneDescription = (scene: StoryboardScene): string =>
  _.trim(scene.spokenDialogue || scene.subtitle || scene.script || scene.visualIntent || scene.id);

export const SceneRegenerationDialog: React.FC<SceneRegenerationDialogProps> = ({
  isOpen,
  isProcessing,
  scenes,
  texts,
  onClose,
  onConfirm,
}) => {
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
    <Modal isOpen={isOpen} onClose={onClose} title={texts.sceneDialogTitle} maxWidth="lg">
      <div className={cn("space-y-4")}>
        {_.isEmpty(availableScenes) ? (
          <p className={cn("text-sm text-slate-700 dark:text-slate-300 font-medium")}>{texts.sceneEmpty}</p>
        ) : (
          <div className={cn("max-h-[55vh] space-y-2 overflow-y-auto pr-1 custom-scrollbar")}>
            {_.map(availableScenes, (scene, index) => {
              const isSelected = _.isEqual(selectedSceneId, scene.id);
              const description = getSceneDescription(scene);
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setSelectedSceneId(scene.id)}
                  title={description}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-purple-500 bg-purple-500/15 ring-1 ring-purple-500/40 shadow-sm"
                      : "border-amber-900/15 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 hover:border-purple-400 dark:hover:border-slate-500 hover:bg-amber-50/50 dark:hover:bg-slate-800/80 shadow-sm",
                  )}>
                  <span className={cn("flex items-start gap-3")}>
                    <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", isSelected ? "bg-purple-600 text-white" : "bg-purple-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300")}>
                      {isSelected ? <Check className={cn("h-4 w-4 stroke-[2.5]")} /> : <Video className={cn("h-4 w-4")} />}
                    </span>
                    <span className={cn("min-w-0")}>
                      <span className={cn("block text-xs font-bold text-[#0f172a] dark:text-slate-100")}>{`${texts.sceneLabel} ${index + 1}`}</span>
                      <span className={cn("mt-1 block truncate text-xs text-[#334155] dark:text-slate-300 font-normal")}>{description}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className={cn("flex justify-end gap-2 pt-2")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
            title={texts.sceneCancel}
            className={cn("text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white font-bold")}>
            {texts.sceneCancel}
          </Button>
          <Button
            variant="purple"
            size="sm"
            onClick={confirmSelection}
            disabled={isProcessing || _.isEmpty(selectedSceneId)}
            title={_.isEmpty(selectedSceneId) ? texts.sceneRequired : texts.sceneConfirm}
            className={cn("font-bold")}>
            <RefreshCw className={cn("h-4 w-4", { "animate-spin": isProcessing })} />
            {texts.sceneConfirm}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
