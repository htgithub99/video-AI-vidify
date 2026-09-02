import assert from "node:assert/strict";
import _ from "lodash";
import { generatePlanningWithChatUi } from "../src/server/services/chatUiPlanningService.ts";
import { closeActiveBrowser } from "../src/server/services/imageGeneratorService.ts";
import { SecurityConstants } from "../src/constants/security.ts";
import { requestContext } from "../src/server/utils/requestContext.ts";
import { AiPlanningChatModel, AiPlanningFallbackProvider } from "../src/types.ts";
import { CINEMATIC_POLICY_CONFIG } from "../src/constants/cinematicConstants.ts";

const projectId = `live_room_pool_${Date.now()}`;
const workerIndexes = _.range(CINEMATIC_POLICY_CONFIG.PLANNING_WORKER_COUNT);

try {
  const responses = await requestContext.run({ licenseKey: SecurityConstants.DEFAULT_LICENSE_KEY }, () =>
    Promise.all(
      _.map(workerIndexes, async (workerIndex) => {
        const sceneId = `pool_scene_${workerIndex}`;
        const response = await generatePlanningWithChatUi({
          provider: AiPlanningFallbackProvider.GeminiChat,
          model: AiPlanningChatModel.GeminiFlashLite,
          prompt: `Return exactly this JSON array with no Markdown and no extra text: [{"id":"${sceneId}","worker":${workerIndex},"status":"ok"}]`,
          projectId,
          workerId: `worker-${workerIndex}`,
          chromeHeadless: false,
          expectedSceneIds: [sceneId],
        });
        return JSON.parse(response.text);
      }),
    ),
  );
  assert.equal(responses.length, CINEMATIC_POLICY_CONFIG.PLANNING_WORKER_COUNT);
  _.forEach(responses, (response, workerIndex) => {
    assert.equal(response[0]?.id, `pool_scene_${workerIndex}`);
    assert.equal(response[0]?.worker, workerIndex);
    assert.equal(response[0]?.status, "ok");
  });
  process.stdout.write(`${responses.length} parallel Gemini room workers passed.\n`);
} finally {
  await closeActiveBrowser();
}
