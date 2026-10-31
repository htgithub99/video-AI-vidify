import { MUSIC_DOWNLOAD_RECOVERY as R } from "../../constants/musicDownloadRecovery.js";
import { AsyncTaskLimiter } from "../../../../lib/asyncTaskLimiter.js";
import { closeChatPlanningRoom, prepareChatPlanningRoom } from "../../../../server/services/chatUiPlanningService.js";
import { waitForMusicEvaluationRetry } from "../../../../server/services/chatUploadRecovery.js";
type RoomRequest = Parameters<typeof prepareChatPlanningRoom>[0];
const startupSlots = new AsyncTaskLimiter(R.STARTUP_CONCURRENCY);
export const prepareMusicEvaluationRoom = async (request: RoomRequest, onRetry: (error: unknown, attempt: number) => Promise<void>): Promise<void> => {
  for (let attempt = 1; ; attempt++) {
    request.signal?.throwIfAborted();
    try {
      await startupSlots.run(() => prepareChatPlanningRoom(request), request.signal);
      return;
    } catch (error) {
      request.signal?.throwIfAborted();
      const message = error instanceof Error ? error.message : String(error);
      if (attempt >= R.ROOM_ATTEMPTS || (!(error instanceof Error && error.name === R.TIMEOUT_ERROR_NAME) && !R.STARTUP_RETRY_PATTERN.test(message))) throw error;
      await onRetry(error, attempt + 1);
      await closeChatPlanningRoom(request);
      await waitForMusicEvaluationRetry(attempt - 1, request.signal);
    }
  }
};
