import sqlite3 from "sqlite3";
import _ from "lodash";
import { generateMockStoryboard } from "../src/lib/textProcessor.ts";
import { evaluateFallbackStoryboardQuality } from "../src/services/storyboardQualityService.ts";
import { resolveVisualConfig } from "../src/services/autoVideoConfigResolver.ts";

const PROJECT_ID = "proj_video2_auto_7nbmnnbxm";
const database = new sqlite3.Database("../vidify-lite/database.db");
const storedProject = await new Promise<any>((resolve, reject) =>
  database.get(
    "SELECT data FROM projects WHERE id = ?",
    [PROJECT_ID],
    (error, row: any) =>
      error ? reject(error) : resolve(JSON.parse(row?.data || "{}")),
  ),
);
database.close();
const project = _.defaultsDeep(storedProject, {
  input: { content: "Cuộc đời sẽ khác thế nào nếu bạn từng ngồi tù?" },
  config: { splitStrategy: "mixed_sentences" },
  visualConfig: {
    style: "cinematic editorial illustration",
    density: 5,
    aspectRatio: "16:9",
    characterConsistency: true,
  },
});

const narration = `Cánh cổng trại giam khép lại phía sau Nam, nhưng bản án của anh chưa kết thúc. Trong túi anh là vài giấy tờ, một địa chỉ cũ và câu hỏi khó nói thành lời: liệu xã hội có cho một người cơ hội bắt đầu lại? Những ngày đầu tự do không giống tự do. Nam phải học lại nhịp đường phố, cách dùng điện thoại và cách ngồi trước một nhà tuyển dụng mà không né tránh quãng trống trong hồ sơ. Khi quá khứ được hỏi đến, căn phòng bỗng im lặng. Cuộc phỏng vấn kết thúc bằng một lời hẹn không bao giờ quay lại.

Khó khăn tiếp theo là chỗ ở. Một chủ nhà đổi thái độ sau khi đọc giấy tờ; người thân muốn giúp nhưng vẫn giữ khoảng cách. Mỗi lần bị từ chối khiến Nam dễ tin rằng thay đổi là vô ích. Đây là lúc hậu quả của việc ngồi tù vượt khỏi cánh cửa nhà giam: cơ hội việc làm hẹp lại, quan hệ gia đình cần được xây dựng lại và những quy định tái hòa nhập có thể tiếp tục chi phối đời sống. Các tác động không giống nhau với mọi người, vì còn phụ thuộc nơi sống, thời gian thụ án và mạng lưới hỗ trợ.

Nhưng câu chuyện không chỉ có ngõ cụt. Nam tìm đến một chương trình hỗ trợ tái hòa nhập, nhận công việc nhỏ và lần đầu tự trả tiền thuê phòng. Không khoảnh khắc nào xóa được quá khứ; điều thay đổi là anh có một chuỗi lựa chọn mới để chứng minh mình đáng tin. Vì vậy, cuộc đời sau tù có thể khác hoàn toàn: tự do pháp lý trở lại trong một ngày, còn tự do xã hội phải được giành lại từng bước. Câu hỏi không chỉ là người từng ngồi tù có chịu thay đổi hay không, mà còn là cộng đồng có tạo ra một con đường thực tế để sự thay đổi ấy tồn tại hay không.`;
const chapters = _.map(_.split(narration, "\n\n"), (scriptSegment, index) => ({
  id: `ch_${index + 1}`,
  title: `Chương ${index + 1}`,
  scriptSegment,
}));
const storyboardResult = generateMockStoryboard(
  narration,
  chapters,
  true,
  project.visualConfig.style,
  project.visualConfig.density,
  120,
  project.config.splitStrategy || "mixed_sentences",
  project.visualConfig.aspectRatio,
);
const storyboardQa = evaluateFallbackStoryboardQuality(storyboardResult.scenes);
const visualResolution = resolveVisualConfig({
  ...project.visualConfig,
  characterConsistency: true,
  characterPrompt:
    "Vietnamese man named Nam in his late thirties, short black hair, lean build, worn navy jacket",
  characters: [
    {
      id: "character_1",
      name: "Nam",
      description:
        "Vietnamese man in his late thirties, short black hair, lean build, worn navy jacket",
      prompt:
        "Vietnamese man named Nam in his late thirties, short black hair, lean build, worn navy jacket",
    },
  ],
});
const completedScenes = _.map(storyboardResult.scenes, (scene, index) => ({
  ...scene,
  _start:
    index === 0
      ? 0
      : _.sumBy(_.take(storyboardResult.scenes, index), "duration"),
  _end: _.sumBy(_.take(storyboardResult.scenes, index + 1), "duration"),
  assetUrl: `/assets/projects/${PROJECT_ID}/images/${scene.id}.jpg`,
}));
const simulatedProject = {
  ...project,
  scriptRewritten: narration,
  chapters,
  storyboard: completedScenes,
  storyboardQa,
  visualConfig: visualResolution.config,
  seo: {
    titles: [{ text: project.input.content }],
    descriptions: [
      {
        text: "Một video essay về cuộc sống và hành trình tái hòa nhập sau khi ra tù.",
      },
    ],
    hashtags: ["#TaiHoaNhap"],
  },
  thumbnails: [
    {
      id: "thumb_1",
      imageUrl: `/assets/projects/${PROJECT_ID}/thumbnails/thumb_1.jpg`,
      approved: true,
    },
  ],
};
const renderReady =
  storyboardQa.passed &&
  !visualResolution.blocked &&
  visualResolution.config.characterConsistency &&
  _.every(
    completedScenes,
    (scene) =>
      scene.assetUrl && _.isFinite(scene._start) && _.isFinite(scene._end),
  ) &&
  !_.isEmpty(simulatedProject.seo) &&
  !_.isEmpty(simulatedProject.thumbnails);
const narrationWords = _.size(_.words(narration));
const alignedDuration = _.maxBy(completedScenes, "_end")?._end;
if (narrationWords < 255 || narrationWords > 345)
  throw new Error("Video 2 narration duration range failed");
if (alignedDuration !== 120)
  throw new Error("Video 2 voice timeline duration failed");
if (completedScenes.length > 40)
  throw new Error("Video 2 scene density is excessive");
if (!renderReady)
  throw new Error(
    `Video 2 end-to-end render gate failed: ${JSON.stringify({ storyboardPassed: storyboardQa.passed, visualBlocked: visualResolution.blocked, characterConsistency: visualResolution.config.characterConsistency, scenesReady: _.every(completedScenes, (scene) => scene.assetUrl && _.isFinite(scene._start) && _.isFinite(scene._end)), seoReady: !_.isEmpty(simulatedProject.seo), thumbnailsReady: !_.isEmpty(simulatedProject.thumbnails) })}`,
  );
process.stdout.write(
  JSON.stringify(
    {
      projectId: PROJECT_ID,
      words: narrationWords,
      chapters: chapters.length,
      scenes: completedScenes.length,
      storyboardQa,
      visualConfig: visualResolution.config,
      configIssues: visualResolution.issues,
      alignedDuration,
      seoReady: true,
      thumbnailReady: true,
      renderReady,
    },
    null,
    2,
  ),
);
