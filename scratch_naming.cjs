const fs = require('fs');
const path = require('path');

// Fix 1: pipelineController.ts missing imports
const pPath = path.join(__dirname, 'src/server/controllers/pipelineController.ts');
let pContent = fs.readFileSync(pPath, 'utf-8');
let pMod = false;
if (!pContent.includes("import { PIPELINE_LOGS")) {
  pContent = pContent.replace("import { BACKEND_MESSAGES }", "import { BACKEND_MESSAGES, PIPELINE_LOGS }");
  pMod = true;
}
if (!pContent.includes("import { AI_FALLBACKS")) {
  pContent = `import { AI_FALLBACKS, AI_INSTRUCTIONS } from '../../constants/ai_fallbacks.js';\n` + pContent;
  pMod = true;
}
if (pMod) {
  fs.writeFileSync(pPath, pContent);
  console.log("Fixed pipelineController.ts imports");
}

// Fix 2: usePipelineWizard.ts file naming rule
const wPath = path.join(__dirname, 'src/components/pipeline/usePipelineWizard.ts');
let wContent = fs.readFileSync(wPath, 'utf-8');
let wMod = false;

if (wContent.includes("const itemFileName = `scene_image_${sc.id}.jpg`;")) {
  wContent = wContent.replace(/const itemFileName = `scene_image_\$\{sc\.id\}\.jpg`;/g, "const itemFileName = `${index + 1}_image.jpg`;");
  wMod = true;
}
if (wContent.includes("const filename = `audio_scene_${sc.id}.wav`;")) {
  wContent = wContent.replace(/const filename = `audio_scene_\$\{sc\.id\}\.wav`;/g, "const filename = `${index + 1}_voice.wav`;");
  wMod = true;
}
// Also update the local_material_path generation in capcutSchema
if (wContent.includes("local_material_path: `C:/CapCut/User Data/Drafts/${folderKey}/Resources/scene_image_${timing.id}.jpg`")) {
  wContent = wContent.replace(/local_material_path: `C:\/CapCut\/User Data\/Drafts\/\$\{folderKey\}\/Resources\/scene_image_\$\{timing\.id\}\.jpg`/g, "local_material_path: `C:/CapCut/User Data/Drafts/${folderKey}/Resources/${index + 1}_image.jpg`");
  wMod = true;
}


if (wMod) {
  fs.writeFileSync(wPath, wContent);
  console.log("Fixed usePipelineWizard.ts naming rules");
}
