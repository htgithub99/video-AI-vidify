import fs from "node:fs";
import path from "node:path";
import { MOTION_VIDEO_GENRE_TEXT } from "../src/constants/motionGenre.js";
import { motionScriptFindings } from "../src/lib/motionScriptFindings.js";
const out = path.resolve("scratch/motion-writing-live-20261101");
fs.mkdirSync(out, { recursive: true });
const original = JSON.parse(fs.readFileSync("storage/output/motion-video/productions/307a7dd7337f942bd3e7c0082f685de8.json", "utf8"));
const selected = process.argv.slice(2).filter((item) => ["pov", "witness", "chronicle", "verdict"].includes(item));
const genres = process.argv.includes("--report") ? [] : selected.length ? selected : ["verdict", "pov", "witness", "chronicle"];
const resume = process.argv.includes("--resume");
const review = process.argv.includes("--review");
const fresh = process.argv.includes("--fresh");
const attach = process.argv.includes("--attach");
const base = {
  source: original.input.source,
  language: "en",
  length: "5min",
  aspect: "16:9",
  drawingMode: "2d",
  characterMotion: false,
  multiVoice: false,
  visualSettings: { version: 1, mode: "remotion", engine: "remotion", profileId: "history" },
  aiExecution: { provider: "gemini-chat", model: "gemini-flash::medium", mode: "room-only", allowFallback: false, strictProvider: true, chromeHeadless: true },
  keepBrowser: true,
};
const save = (name: string, value: unknown) => fs.writeFileSync(path.join(out, name), JSON.stringify(value, null, 2));
const api = async (url: string, body?: unknown) => {
  const response = await fetch("http://127.0.0.1:3002/api/motion-video/" + url, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {});
  const data = await response.json();
  if (!response.ok || data.success === false) throw new Error(JSON.stringify(data));
  return data;
};
const runJob = async (genre: string, kind: string, body: any) => {
  const file = genre + "-" + kind;
  const jobFile = path.join(out, file + "-job.json");
  const priorJob = attach && fs.existsSync(jobFile) ? JSON.parse(fs.readFileSync(jobFile, "utf8")) : undefined;
  const started = priorJob?.id && priorJob.status === "rendering" ? { job: priorJob } : await api("story/" + kind, body);
  save(file + "-start.json", started);
  process.stdout.write(genre + " " + kind + ": " + started.job.id + "\n");
  let last = "";
  for (;;) {
    const { job } = await api("story/status/" + started.job.id);
    save(file + "-job.json", job);
    const summary = [job.status, job.stage, job.log?.at(-1)].join(" | ");
    if (summary !== last) {
      process.stdout.write(genre + " " + kind + ": " + summary + "\n");
      last = summary;
    }
    if (["completed", "error", "cancelled"].includes(job.status)) {
      const log = await api("story/logs/" + job.id + "?after=0");
      save(file + "-logs.json", log);
      if (job.status !== "completed") throw new Error(job.error || job.status);
      save(file + ".json", job.result);
      return job.result;
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
};
const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const gallery = () => {
  const summary = ["pov", "witness", "chronicle", "verdict"].flatMap((genre) => {
    const scriptFile = path.join(out, genre + "-script.json"),
      analysisFile = path.join(out, genre + "-analyze.json"),
      manualFile = path.join(out, genre + "-manual-review.json");
    if (!fs.existsSync(scriptFile) || !fs.existsSync(analysisFile)) return [];
    const script = JSON.parse(fs.readFileSync(scriptFile, "utf8")),
      analysis = JSON.parse(fs.readFileSync(analysisFile, "utf8"));
    return [
      {
        genre,
        chapters: analysis.chapters.length,
        beats: script.beats.length,
        targetSeconds: analysis.chapters.reduce((sum: number, chapter: any) => sum + chapter.targetSeconds, 0),
        editorialRequests: script.edit?.requests || 0,
        extraRequests: script.edit?.extraRequests || 0,
        remainingDetected: script.edit?.remaining?.length || 0,
        manual: fs.existsSync(manualFile) ? JSON.parse(fs.readFileSync(manualFile, "utf8")).status : "pending",
      },
    ];
  });
  fs.writeFileSync(path.join(out, "summary.json"), JSON.stringify(summary, null, 2));
  const table = `<table><thead><tr><th>Thể loại</th><th>Chương</th><th>Beat</th><th>Biên tập</th><th>Trong đó bổ sung</th><th>QA còn lại</th></tr></thead><tbody>${summary.map((row) => `<tr><td>${escape(row.genre)}</td><td>${row.chapters}</td><td>${row.beats}</td><td>${row.editorialRequests}</td><td>${row.extraRequests}</td><td>${row.remainingDetected}</td></tr>`).join("")}</tbody></table><p>Số biên tập tính cả các lượt sửa khi kiểm thử, gồm lượt phát hiện lỗi chưa đồng bộ mô tả cảnh. Không phải chi phí cố định cho video mới; không gồm các lượt gửi lại do Gemini lỗi.</p>`;
  const cards = ["pov", "witness", "chronicle", "verdict"]
    .map((genre) => {
      const file = path.join(out, genre + "-script.json");
      if (!fs.existsSync(file)) {
        const failed = path.join(out, genre + "-error.json");
        return fs.existsSync(failed) ? `<section><h2>${MOTION_VIDEO_GENRE_TEXT.vi.OPTIONS[genre as keyof typeof MOTION_VIDEO_GENRE_TEXT.vi.OPTIONS]}</h2><p>Chưa hoàn tất kiểm thử.</p><pre>${escape(fs.readFileSync(failed, "utf8"))}</pre></section>` : "";
      }
      const script = JSON.parse(fs.readFileSync(file, "utf8")),
        analysis = JSON.parse(fs.readFileSync(path.join(out, genre + "-analyze.json"), "utf8"));
      const manualFile = path.join(out, genre + "-manual-review.json");
      const manual = fs.existsSync(manualFile) ? JSON.parse(fs.readFileSync(manualFile, "utf8")) : { status: "pending", note: "Chưa ghi nhận kết luận đọc đối chiếu." };
      const errorFile = path.join(out, genre + "-error.json");
      const latestError = fs.existsSync(errorFile) ? fs.readFileSync(errorFile, "utf8") : "";
      return `<section><h2>${MOTION_VIDEO_GENRE_TEXT.vi.OPTIONS[genre as keyof typeof MOTION_VIDEO_GENRE_TEXT.vi.OPTIONS]}</h2>${latestError ? `<p>Lượt thử gần nhất chưa hoàn tất; nội dung bên dưới là bản đã lưu từ lượt trước.</p><pre>${escape(latestError)}</pre>` : ""}<p>${escape(analysis.title)} · ${analysis.chapters.length} chương · ${script.beats.length} beat · ${analysis.chapters.reduce((sum: number, c: any) => sum + c.targetSeconds, 0)} giây mục tiêu</p><p>Đọc đối chiếu: ${escape(manual.status)}</p><details><summary>Thông tin kiểm thử và QA</summary><pre>${escape(JSON.stringify({ model: base.aiExecution, edit: script.edit, writingPlan: analysis.writingPlan, manual }, null, 2))}</pre></details>${analysis.chapters
        .map(
          (chapter: any) =>
            `<h3>${escape(chapter.title)}</h3>${script.beats
              .filter((beat: any) => beat.chapterId === chapter.id)
              .map((beat: any) => `<p>${escape(beat.narration)}</p><details><summary>Phân cảnh · ${escape(beat.id)}</summary><pre>${escape(JSON.stringify({ action: beat.action, scenePlan: beat.scenePlan }, null, 2))}</pre></details>`)
              .join("")}`,
        )
        .join("")}</section>`;
    })
    .join("");
  fs.writeFileSync(
    path.join(out, "index.html"),
    `<!doctype html><html lang="vi"><meta charset="utf-8"><title>Kiểm thử bốn thể loại · 5 phút</title><style>body{background:#121820;color:#e9edf4;font:17px/1.7 system-ui;margin:0 auto;max-width:1080px;padding:32px}section{padding:24px;background:#1c2531;border-radius:16px;margin:24px 0}h1,h2,h3{line-height:1.3;color:#aaceff}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border:1px solid #3a4b60;padding:8px;text-align:left}details{margin:8px 0}</style><h1>Kiểm thử kịch bản 5 phút · Gemini 3.8 Flash Trung bình</h1><p>Phân tích/viết qua API thật; sửa lỗi phát hiện qua cùng hàm biên tập và luồng Gemini của tool. Cùng nguồn Nile; lưu JSON và nhật ký từng bước. Thời lượng là mục tiêu kịch bản, chưa đo bằng voice; chưa xuất MP4.</p>${table}${cards}</html>`,
  );
};
for (const genre of genres) {
  try {
    const id = "writing-live-20261101-" + genre + (review ? "-review-v2" : fresh ? "-retry-v2" : "");
    const body = { ...base, videoGenre: genre, productionId: id, editorialSessionId: id };
    save(genre + "-request.json", body);
    const analysisFile = path.join(out, genre + "-analyze.json");
    const scriptFile = path.join(out, genre + "-script.json");
    const analysis = resume && fs.existsSync(analysisFile) ? JSON.parse(fs.readFileSync(analysisFile, "utf8")) : await runJob(genre, "analyze", body);
    const priorFile = path.join(out, genre + "-script-job.json");
    const prior = resume && fs.existsSync(priorFile) ? JSON.parse(fs.readFileSync(priorFile, "utf8"))?.result : undefined;
    const draft = review ? JSON.parse(fs.readFileSync(path.join(out, genre + "-before-editor.json"), "utf8")) : prior;
    const script = resume && !review && fs.existsSync(scriptFile) ? JSON.parse(fs.readFileSync(scriptFile, "utf8")) : await runJob(genre, "script", { ...body, analysis, ...(draft?.beats?.length ? { beats: draft.beats, chapterDrafts: draft.chapterDrafts, resume: true } : {}) });
    const findings = motionScriptFindings(script.beats, analysis, base.language, base.source.text);
    save(genre + "-audit.json", {
      completed: true,
      targetSeconds: analysis.chapters.reduce((sum: number, c: any) => sum + c.targetSeconds, 0),
      spokenUnits: script.beats
        .map((beat: any) => beat.narration)
        .join(" ")
        .split(/\s+/u).length,
      findings: { ...findings, dropIds: [...findings.dropIds], dropRefs: [...findings.dropRefs] },
      edit: script.edit,
    });
    fs.rmSync(path.join(out, genre + "-error.json"), { force: true });
    gallery();
  } catch (error) {
    save(genre + "-error.json", { error: String(error) });
    process.stdout.write(genre + ": FAILED " + String(error) + "\n");
    gallery();
  }
}
gallery();
process.stdout.write("Results: " + out + "\n");
