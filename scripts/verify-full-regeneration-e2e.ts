import assert from "node:assert/strict";
import { compileImagePrompt } from "../src/services/imagePromptCompilerService.ts";
import { clearProjectImageOutputs } from "../src/services/projectRegenerationService.ts";
import { createThumbnailGenerationPrompt } from "../src/services/thumbnailPromptService.ts";
import { BackgroundMode, ImageFocusMode, TextInImageMode } from "../src/types.ts";
import { ThumbnailLayoutId, ThumbnailTypographyId } from "../src/constants/thumbnail.ts";

// 1. Kiểm tra dọn dẹp state và làm sạch referencePrompt khi tạo lại ảnh
const mockProject: any = {
  id: "video_1",
  name: "Dự án video 1",
  visualConfig: {
    style: "Flat stick-figure illustration",
    referencePrompt: "Line art: clean uniform black outlines. Palette: flat monochrome line work with isolated pastel accent spots. Rendering: flat filled vectors with no shading or texture. Strict character visual lock: Female stick figure. A female stickfigure character facing an industrial hazard",
    referenceImages: ["/assets/projects/video_1/images/ref.png"],
    styleBackgroundMode: BackgroundMode.Contextual,
    styleTextInImageMode: TextInImageMode.NoText,
    imageFocusMode: ImageFocusMode.Default,
    aspectRatio: "16:9",
  },
  storyboard: [
    {
      id: "sc_1",
      script: "Một người phụ nữ đứng trước khu vực nguy hiểm trong nhà máy",
      prompt: "Line art: clean black lines. A female worker facing an industrial hazard on the factory floor",
      assetUrl: "/assets/projects/video_1/images/sc_1.png",
      assetStatus: "completed",
    },
  ],
  thumbnails: [
    {
      id: "th_1",
      imageUrl: "/assets/projects/video_1/images/thumb_1.png",
    },
  ],
};

const regeneratedProject = clearProjectImageOutputs(mockProject);

// referencePrompt phải được reset về style tinh gọn
assert.equal(regeneratedProject.visualConfig.referencePrompt, "Flat stick-figure illustration");
assert.equal(regeneratedProject.storyboard[0].assetUrl, undefined);
assert.equal(regeneratedProject.thumbnails.length, 0);
assert.equal(regeneratedProject.storyboard[0].prompt, "");

// Prompt của phân cảnh phải sạch hoàn toàn nhãn lý thuyết
assert.doesNotMatch(regeneratedProject.storyboard[0].prompt, /Line art:|Palette:|Rendering:|Strict character visual lock:/);

// 2. Kiểm tra biên dịch Prompt Phân cảnh mới (Cinematic Shot Progression + Không dính nhãn thừa)
const compiledScenePrompt = compileImagePrompt(regeneratedProject.storyboard[0], {
  aspectRatio: "16:9",
  targetStyle: regeneratedProject.visualConfig.style,
});
assert.doesNotMatch(compiledScenePrompt, /Line art:|Palette:|Rendering:/);
assert.doesNotMatch(compiledScenePrompt, /industrial hazard/i);
assert.match(compiledScenePrompt, /Scene depicting:/);
assert.ok(compiledScenePrompt.includes("--ar 16:9"));

// 3. Kiểm tra Prompt Thumbnail theo ma trận tò mò CTR
const mockThumbnail = {
  id: "th_1",
  prompt: "A worried worker looking at a warning sign with high tension in the factory",
  style: "Flat stick-figure illustration",
  hasText: true,
  textText: "HIỂM NGUY CẬN KỀ",
  layoutId: ThumbnailLayoutId.SoloLeftArrowRight,
  typographyId: ThumbnailTypographyId.CondensedImpact,
  subjectFocus: "Worried worker",
};

const thumbPrompt = createThumbnailGenerationPrompt(mockThumbnail, mockThumbnail.style, "16:9", true);
assert.ok(thumbPrompt.includes("HIỂM NGUY CẬN KỀ"));
assert.ok(thumbPrompt.includes("--ar 16:9"));
assert.doesNotMatch(thumbPrompt, /Line art:|Palette:|Rendering:/);

process.stdout.write("Full Regeneration & Cinematic Prompt E2E Verification Passed!\n");
