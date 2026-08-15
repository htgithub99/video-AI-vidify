import _ from "lodash";
import React from "react";
import { Tooltip } from "../ui/Tooltip";
import { ImageDeleteOverlay, ImageUploadZone } from "./ImageUploadZone";
import { AUTO_GENERATOR_SCENE_REFERENCE_CONFIG } from "../../constants/config";
import { REFACTOR_CONSTANTS } from "../../constants";
import { API_ROUTES } from "../../constants/apiRoutes";
import { safeSystemFetch } from "../../lib/shared-utils";

export interface ImageReferenceSectionProps {
  referenceImages: string[];
  setReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
  sceneReferenceImages: string[];
  setSceneReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
  handleStyleFilesUpload: (files: FileList) => void;
  handleSceneReferenceFilesUpload: (files: FileList) => void;
  T: Record<string, any>;
}

const deletePersistedAsset = (url: string): void => {
  if (!_.isString(url) || _.isEmpty(url)) return;
  const match = url.match(/\/assets\/projects\/([^/]+)\//);
  const projectId = _.nth(match, 1);
  if (!_.isEmpty(projectId)) {
    safeSystemFetch(API_ROUTES.PIPELINE_DELETE_ASSET_FILE, { assetUrl: url, projectId });
  }
};

interface ReferenceImageCardProps {
  imageSrc: string;
  altText: string;
  cardClassName?: string;
  imageClassName?: string;
  deleteTooltip: string;
  onDelete: () => void;
}

const ReferenceImageCard: React.FC<ReferenceImageCardProps> = ({
  imageSrc,
  altText,
  cardClassName = "relative w-full aspect-square rounded-xl group shadow-md overflow-hidden border border-slate-800/80 hover:border-emerald-500/30 transition-colors",
  imageClassName = "w-full h-full object-cover rounded-xl",
  deleteTooltip,
  onDelete,
}) => (
  <div className={cardClassName}>
    <img src={imageSrc} alt={altText} className={imageClassName} />
    <ImageDeleteOverlay onDelete={onDelete} tooltip={deleteTooltip} />
  </div>
);

export const ImageReferenceSection: React.FC<ImageReferenceSectionProps> = ({
  referenceImages,
  setReferenceImages,
  sceneReferenceImages,
  setSceneReferenceImages,
  handleStyleFilesUpload,
  handleSceneReferenceFilesUpload,
  T,
}) => {
  const handleRemoveStyleImage = (targetIndex: number) => {
    const targetUrl = _.nth(referenceImages, targetIndex);
    if (targetUrl) deletePersistedAsset(targetUrl);
    setReferenceImages((prev) => _.filter(prev, (_item, index) => !_.isEqual(index, targetIndex)));
  };

  const handleRemoveSceneImage = (targetIndex: number) => {
    const targetUrl = _.nth(sceneReferenceImages, targetIndex);
    if (targetUrl) deletePersistedAsset(targetUrl);
    setSceneReferenceImages((prev) => _.filter(prev, (_item, index) => !_.isEqual(index, targetIndex)));
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <Tooltip content={T.styleUploadSub} position="top" className="w-full block">
            <ImageUploadZone
              onUpload={handleStyleFilesUpload}
              hoverColor="emerald"
              title={T.styleUploadTitle}
              subtitle={T.styleUploadSub}
              hideSubtitle={true}
            />
          </Tooltip>
          {_.map(referenceImages, (imgBase64, index) => (
            <ReferenceImageCard
              key={index}
              imageSrc={imgBase64}
              altText={`${REFACTOR_CONSTANTS.STYLE_REF_PREFIX}${index + 1}`}
              deleteTooltip={T.deleteStyleImgTooltip}
              onDelete={() => handleRemoveStyleImage(index)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <Tooltip content={T.sceneReferenceUploadSub} position="top" className="w-full block">
            <ImageUploadZone
              onUpload={handleSceneReferenceFilesUpload}
              hoverColor="sky"
              title={T.sceneReferenceUploadTitle}
              subtitle={T.sceneReferenceUploadSub}
              hideSubtitle={true}
              uploadClass={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_CLASS}
              inputClass={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.INPUT_CLASS}
              contentClass={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_CONTENT_CLASS}
              iconBoxClass={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_ICON_BOX_CLASS}
              iconClass={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_ICON_CLASS}
              titleClass={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_TITLE_CLASS}
              subtitleClass={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_SUBTITLE_CLASS}
            />
          </Tooltip>
          {_.map(sceneReferenceImages, (imgBase64, index) => (
            <ReferenceImageCard
              key={index}
              imageSrc={imgBase64}
              altText={`${T.sceneReferenceAlt} ${index + 1}`}
              cardClassName={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.IMAGE_CARD_CLASS}
              imageClassName={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.IMAGE_CLASS}
              deleteTooltip={T.deleteSceneReferenceTooltip}
              onDelete={() => handleRemoveSceneImage(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
