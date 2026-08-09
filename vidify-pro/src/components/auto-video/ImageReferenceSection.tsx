import _ from "lodash";
import { X } from "lucide-react";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import { ImageDeleteOverlay, ImageUploadZone } from "./ImageUploadZone";
import { AUTO_GENERATOR_SCENE_REFERENCE_CONFIG } from "../../constants/config";
import { REFACTOR_CONSTANTS } from "../../constants";
interface ImageReferenceSectionProps {
  referenceImages: string[];
  setReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
  sceneReferenceImages: string[];
  setSceneReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
  handleStyleFilesUpload: (files: FileList) => void;
  handleSceneReferenceFilesUpload: (files: FileList) => void;
  T: any;
}

export const ImageReferenceSection: React.FC<ImageReferenceSectionProps> = ({
  referenceImages,
  setReferenceImages,
  sceneReferenceImages,
  setSceneReferenceImages,
  handleStyleFilesUpload,
  handleSceneReferenceFilesUpload,
  T,
}) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <Tooltip
            content={T.styleUploadSub}
            position="top"
            className="w-full block"
          >
            <ImageUploadZone
              onUpload={handleStyleFilesUpload}
              hoverColor="emerald"
              title={T.styleUploadTitle}
              subtitle={T.styleUploadSub}
              hideSubtitle={true}
            />
          </Tooltip>
          {_.map(referenceImages, (imgBase64, idx) => (
            <div
              key={idx}
              className="relative w-full aspect-square rounded-xl group shadow-md overflow-hidden border border-slate-800/80 hover:border-emerald-500/30 transition-colors"
            >
              <img
                src={imgBase64}
                alt={`${REFACTOR_CONSTANTS.STYLE_REF_PREFIX}${idx + 1}`}
                className="w-full h-full object-cover rounded-xl"
              />
              <ImageDeleteOverlay
                onDelete={() =>
                  setReferenceImages((prev) =>
                    _.filter(prev, (_v, i) => !_.isEqual(i, idx)),
                  )
                }
                tooltip={T.deleteStyleImgTooltip}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <Tooltip
            content={T.sceneReferenceUploadSub}
            position="top"
            className="w-full block"
          >
            <ImageUploadZone
              onUpload={handleSceneReferenceFilesUpload}
              hoverColor="sky"
              title={T.sceneReferenceUploadTitle}
              subtitle={T.sceneReferenceUploadSub}
              hideSubtitle={true}
              uploadClass={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_CLASS}
              inputClass={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.INPUT_CLASS}
              contentClass={
                AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_CONTENT_CLASS
              }
              iconBoxClass={
                AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_ICON_BOX_CLASS
              }
              iconClass={
                AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_ICON_CLASS
              }
              titleClass={
                AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_TITLE_CLASS
              }
              subtitleClass={
                AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_SUBTITLE_CLASS
              }
            />
          </Tooltip>
          {_.map(sceneReferenceImages, (imgBase64, idx) => (
            <div
              key={idx}
              className={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.IMAGE_CARD_CLASS}
            >
              <img
                src={imgBase64}
                alt={`${T.sceneReferenceAlt} ${idx + 1}`}
                className={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.IMAGE_CLASS}
              />
              <div
                className={
                  AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.IMAGE_OVERLAY_CLASS
                }
              >
                <Button
                  type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON as any}
                  variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED as any}
                  onClick={() =>
                    setSceneReferenceImages((prev) =>
                      _.filter(prev, (_v, i) => !_.isEqual(i, idx)),
                    )
                  }
                  className={
                    AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.DELETE_BUTTON_CLASS
                  }
                  title={T.deleteSceneReferenceTooltip}
                >
                  <X
                    className={
                      AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.DELETE_ICON_CLASS
                    }
                  />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
