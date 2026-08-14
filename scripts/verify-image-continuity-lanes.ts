import assert from "node:assert/strict";
import { createSceneContinuityKey, createThumbnailContinuityKey, distributeItemsByContinuity } from "../src/services/imageGenerationContinuityService.ts";
import { writeVerificationLog } from "./verificationLogger.ts";

const characters = [
  { id: "char_vu", name: "Vũ", narrativeRole: "protagonist" },
  { id: "char_you", name: "You", narrativeRole: "second_person_protagonist" },
  { id: "char_mentor", name: "Mentor", narrativeRole: "mentor" },
  { id: "char_client", name: "Client", narrativeRole: "client" },
] as never[];

assert.equal(createSceneContinuityKey({ characterIds: ["char_vu"] }, characters), "character:char_vu");
assert.equal(createSceneContinuityKey({ characterIds: ["char_you"] }, characters), "character:char_you");
assert.equal(createSceneContinuityKey({ characterIds: ["char_mentor"] }, characters), "characters:supporting");
assert.equal(createSceneContinuityKey({ characterIds: ["char_client"] }, characters), "characters:supporting");
assert.equal(createSceneContinuityKey({ characterIds: [] }, characters), "scene:environment");
assert.equal(createThumbnailContinuityKey(), "thumbnail");

const workerQueues = distributeItemsByContinuity([
  { sceneId: "sc_1", continuityKey: "character:char_vu" },
  { sceneId: "sc_2", continuityKey: "character:char_you" },
  { sceneId: "sc_3", continuityKey: "character:char_vu" },
  { sceneId: "sc_4", continuityKey: "characters:supporting" },
], 2);
const laneWorkers = workerQueues.flatMap((queue, workerIndex) => queue.map(item => ({ ...item, workerIndex })));
assert.equal(laneWorkers.find(item => item.sceneId === "sc_1")?.workerIndex, laneWorkers.find(item => item.sceneId === "sc_3")?.workerIndex);
assert.deepEqual(workerQueues.flatMap(queue => queue.filter(item => item.continuityKey === "character:char_vu").map(item => item.sceneId)), ["sc_1", "sc_3"]);

writeVerificationLog("Image continuity lane assertions passed");
