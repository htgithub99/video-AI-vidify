import { AssetAcceptance, QaStatus, ThumbnailItem } from "../types";

export const acceptGeneratedThumbnail = (thumbnail: ThumbnailItem): ThumbnailItem => {
  const hasImage = Boolean(thumbnail.imageUrl);
  return { ...thumbnail, qa: undefined, qaStatus: QaStatus.Unavailable, acceptance: hasImage ? AssetAcceptance.AcceptedWithWarning : AssetAcceptance.Rejected, approved: hasImage, };
};
