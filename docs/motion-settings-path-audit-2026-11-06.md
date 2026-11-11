# Kiểm tra cấu hình Video Motion theo từng đường chạy — 06/11/2026

> Đây là bản ghi trước khi sửa. Các điểm F1–F6 đã được đối ứng và kiểm chứng trong [báo cáo triển khai](D:/video-AI-vidify/docs/motion-settings-fixes-implementation-2026-11-06.md).

## Kết luận

Các thay đổi đưa chuyển động do AI viết vào kịch bản và prompt vẽ vẫn nhận cấu hình khi tạo lượt mới. Tuy nhiên, **không thể kết luận mọi cấu hình đều có hiệu lực giống nhau trên mọi đường chạy**. Đã tái hiện lỗi tái sử dụng audio khi bật kiểm tra giọng, lỗi gắn cấu hình hiện tại vào kết quả theo cấu hình cũ và lỗi so sánh encoder thực tế của Remotion. Nhánh viết kịch bản thủ công còn dùng “Cách kể” trong phân tích cũ.

Đợt này chỉ bổ sung script kiểm tra và báo cáo; không sửa mã chạy sản phẩm, không đổi dự án, không gọi AI/TTS thật, không xóa chat. Các kết quả fixture dưới đây xác nhận đường truyền và hành vi code; không chứng nhận chất lượng hình/giọng trên mọi tổ hợp AI.

## Dữ liệu thật được đối chiếu

Bản lưu dự án gần nhất tại thời điểm kiểm tra: [f82fe2c76c1ab22004a52e6147acdf2c.json](D:/video-AI-vidify/storage/output/motion-video/productions/f82fe2c76c1ab22004a52e6147acdf2c.json).

Giá trị trong `input` khớp các lựa chọn chính ở ảnh người dùng: Remotion/history, verdict, 12min, 1 phần, en, lively, giữ tên gốc, một giọng, ASR tắt, nhạc off, SFX bật, pacing medium, chuyển động bật, phụ đề bật, tự xuất bật, xóa chat trước xuất bật. Giá trị bổ sung: standard, 30 FPS, CPU, SFX volume 0.5. AI nội dung là Gemini Flash mức low; AI dựng cảnh là Gemini Flash mức medium; cả hai mở Chrome, tắt đổi nhà cung cấp.

`autoContinue` là lựa chọn giao diện, được chuyển thành `analyzeOnly` khi tạo lượt; không cần xuất hiện dưới cùng tên trong `input` backend.

## Bảng 19 tùy chọn trong ảnh

| Tùy chọn | Khi tạo lượt mới | Khi thao tác với dữ liệu đã có / tiếp tục |
|---|---|---|
| Cách dựng | Chọn Remotion hoặc kho; chuẩn hóa adapter và dữ liệu hình | Đổi cách dựng dùng bản nháp riêng; không lấy hình kho để giả làm hình Remotion. Resume dùng adapter đã lưu |
| Kiểu hình | history / horror / explainer vào phân tích, lập cảnh và prompt vẽ | Đổi profile chuyển bản nháp, có thể dùng lại bản nháp tương thích; không tự chuyển phong cách SVG cũ |
| Thể loại | Vào phân tích, cấu trúc kịch bản, loại hình và định hướng âm thanh | Bước viết kịch bản có chặn khi thể loại khác phân tích; dựng lại hình từ kịch bản cũ vẫn theo phân tích cũ. Muốn đổi toàn bộ cần phân tích lại |
| Thời lượng | Là mục tiêu phân tích và độ dài kịch bản; không ép cắt lời cho đủ đúng 720 giây | Có Video DNA thì bước viết chặn thay đổi thời lượng chưa phân tích lại. Không tự kéo dài video đã dựng |
| Số phần | Chia theo chương và thời lượng toàn bộ; số phần thực tế không vượt số chương | Trước khi có script có thể chia lại phần đầu. Sau khi có script, đổi con số không chia lại ngay chuỗi đã lập; phần tiếp dùng `series.parts` đã có |
| Ngôn ngữ đọc | Vào phân tích, script và giọng thông qua `script.language` | Đổi dropdown không dịch script cũ và không đổi tiếng của audio cũ. Phải viết lại script phù hợp rồi tạo giọng |
| Tự động kịch bản | Bật: chạy pipeline. Tắt: nút đầu chỉ phân tích (`analyzeOnly=true`) | Nút viết script thủ công chỉ viết script; không mặc nhiên khởi động lại cả production. Resume giữ `analyzeOnly` đã lưu |
| Cách kể | Được lưu ở phân tích; writer lấy hooks/texture/mức giãn từ phân tích | **Có lệch trên đường thủ công:** payload gửi lựa chọn mới nhưng writer đọc `analysis.storytelling` cũ. Cần phân tích lại; UI chưa ngăn/thông báo đầy đủ |
| Đổi tên tránh bản quyền | Lập bản đồ tên trong phân tích, sau đó script/SEO dùng bản đồ đó | Đổi toggle sau phân tích không tự tạo/xóa bản đồ tên; `writeScript` không gửi lại cờ này. Cần phân tích lại |
| Kênh giọng | Gửi tham chiếu `id@updatedAt`; phân vai và giọng dùng kênh | Chọn kênh/mode giọng làm thay đổi cấu hình script và chữ ký giọng. Resume giữ tham chiếu đã lưu; chưa thử đổi nội dung kênh thật trong lúc đang chạy |
| Phân vai giọng | Bật: nhiều vai; tắt: một giọng. Có bước đồng bộ `voiceSettings` | Thay mode loại voiceTrack nhúng không tương thích và thay chữ ký giọng; không viết lại nội dung lời kể |
| Kiểm tra giọng | Cờ ASR đi đúng vào bước tạo giọng; tắt vẫn giữ kiểm tra file audio kỹ thuật | **Lỗi đã tái hiện:** bật sau khi đã có giọng không làm giọng cũ mất hiệu lực; xuất có thể dùng audio chưa qua ASR |
| Nhạc nền | OFF được loại trước render; mood/volume đi vào bước ghép cuối | Preview audio là lời + SFX, chưa có nhạc nền. Đổi nhạc làm render key thay đổi. Lượt đang chạy giữ snapshot nhạc lúc bắt đầu |
| Âm thanh cảnh (SFX) | Vào lập âm thanh cảnh, compile và ghép audio | Tắt bỏ SFX ở compile; key có cờ và volume. Bật không đảm bảo có tiếng nếu AI không lập cue hoặc thiếu thư viện; code có nhánh ghi log và tiếp tục |
| Nhịp đổi hình | Thưa/vừa/dày đi vào nhóm cảnh và hướng dẫn AI | ~14/9/6 giây là hướng dẫn mềm, không phải quota hay mốc cắt cứng. Đổi nhịp có thể lập lại nhóm/hình; không sửa phần lời kể |
| Chuyển động cảnh | Vào prompt vẽ và bộ phát; một nút điều khiển nhân vật + hiệu ứng + camera | Tắt khóa phát các kênh. Bật cho phép phát animation AI đã trả về; không tự tạo chân/tay/keyframe cho SVG cũ. Không bảo đảm mọi người trong cảnh đều chuyển động |
| Phụ đề | Vào compile; tắt thì bỏ subtitle track | Compile thủ công theo giá trị hiện tại. **Lỗi đã tái hiện:** kết quả production cũ có thể được gắn dấu đã khớp UI mới nếu đổi khi đang chạy/tiếp tục |
| Xuất video | Bật: render sau khi đủ hình và tiếng. Tắt: kết thúc ở preview | `buildScenes` thủ công có thể gọi xuất nếu autoExport bật. Resume dùng cờ autoExport đã lưu, không dùng thay đổi mới trên UI |
| Tự xóa chat Gemini | Gửi tới bước bàn giao Chrome trước render; tắt không yêu cầu dọn | Đây là cờ duy nhất được cập nhật cùng ID khi resume. Dọn có thể hoãn nếu Chrome còn tác vụ/chủ sở hữu khác; không phải xóa ngay bất chấp room đang làm |

Nguồn chính: [UI](D:/video-AI-vidify/src/features/motion/components/MotionVideoCreator.tsx:380), [payload tạo/tiếp tục](D:/video-AI-vidify/src/features/motion/hooks/useMotionStudio.ts:764), [phân tích/viết/compile](D:/video-AI-vidify/src/features/motion/server/services/motionProductionActions.ts:137), [chia phần](D:/video-AI-vidify/src/lib/motionParts.ts:7), [nhịp đổi hình](D:/video-AI-vidify/src/constants/motionScenePacing.ts:54).

## Cấu hình bổ sung

| Nhóm | Đường đi / kết luận |
|---|---|
| Tỷ lệ | Vào phân tích, kích thước prompt vẽ, compile và render. Có 16:9, 9:16, 1:1, 4:5. Remotion chặn spec/render khác tỷ lệ; đổi tỷ lệ cần hình tương thích, không chỉ kéo giãn MP4 |
| FPS | Vào compile và số frame render; Remotion chặn FPS spec khác options. UI hỗ trợ 24/25/30/60 |
| Chất lượng | Chọn kích thước đầu ra và CRF ở render; không thay nội dung SVG/animation. Dự án thật đang lưu standard |
| Encoder | Remotion luôn gửi CPU và dùng x264; GPU trực tiếp bị backend từ chối. Kho hình có lựa chọn encoder riêng. **Có lỗi key với raw AUTO và CPU thực tế**, xem dưới |
| Volume SFX/nhạc | Tách riêng; SFX vào compile/mix, nhạc vào export. Đã kiểm tra payload giá trị khác mặc định 0.27 và 0.19. Nhạc OFF vẫn loại bỏ dù volume lưu > 0 |
| AI nội dung | Provider/model/mode/headless/fallback riêng, dùng phân tích/viết/lập cảnh/giọng và SEO theo đường tương ứng. Thay giữa lượt không cập nhật snapshot production đang chạy |
| AI vẽ | Provider/model/headless riêng; giao diện giới hạn room-only. Một lần vẽ Remotion ép `singleResponse=true`, `strictProvider=true`, `allowFallback=false` |
| Toggle đổi nhà cung cấp AI vẽ | Payload UI có gửi, nhưng nhánh vẽ một lần ghi đè thành false. Đây là giới hạn của chính sách một lần vẽ hiện tại; UI vẫn cho bật nên dễ hiểu nhầm. Không nên tự bật fallback trở lại vì sẽ đi ngược yêu cầu một lần vẽ |
| QA ảnh | Remotion ẩn nút review và nhánh vẽ không gọi QA/director/sửa keyframe. Kho cũ giữ cơ chế review riêng. Kiểm tra cấu trúc dữ liệu/file để xuất vẫn còn |
| Chrome dự phòng toàn ứng dụng | Setting lưu ở backend chung, không phụ thuộc state của riêng Video Motion. Wrapper nhận đúng lỗi quota Gemini Flash, chờ tác vụ nhận/lưu xong trước đổi Chrome. OFF, chưa chuẩn bị profile, profile dự phòng cũng hết quota có đường lỗi riêng. Không xử lý quota ChatGPT bằng setting Flash này |

Nguồn: [AI settings](D:/video-AI-vidify/src/features/motion/components/MotionAiSettings.tsx:9), [chuẩn hóa AI](D:/video-AI-vidify/src/features/motion/lib/motionSceneAi.ts:20), [ép một phản hồi](D:/video-AI-vidify/src/features/motion/server/services/remotion/scenePipeline.ts:122), [render](D:/video-AI-vidify/src/features/motion/server/services/motionRenderService.ts:424), [Chrome dự phòng](D:/video-AI-vidify/src/server/services/chromeBackupService.ts:42), [đóng/mở profile dự phòng](D:/video-AI-vidify/src/server/services/imageGeneratorService.ts:4706).

## Các đường chạy đã lần theo

1. **Tạo mới tự động:** snapshot UI → production store → phân tích → chia phần → script → dựng cảnh và tạo giọng song song → đủ dữ liệu → compile → tùy chọn render. SEO chạy nhánh riêng; không mang tùy chọn hậu kỳ để viết lại SVG.
2. **Tạo mới với tự động kịch bản OFF:** chỉ phân tích và chia phần; không tự tạo giọng/hình/render.
3. **Viết script thủ công / viết tiếp chương:** dùng phân tích hiện có; nhận visual settings và ngôn ngữ hiện tại nhưng storytelling vẫn từ phân tích. Có chặn đổi genre và một số ràng buộc Video DNA.
4. **Dựng cảnh thủ công / dựng riêng cảnh:** dùng script + analysis + visual settings hiện tại; AI lập actionPlan rồi AI vẽ một phản hồi. Có thể dùng cache nếu tương thích. Tạo lại riêng cảnh là yêu cầu rõ ràng, khác resume thông thường.
5. **Giọng thủ công / tái sử dụng giọng:** chữ ký theo script, vai, kênh, định hướng. ASR chưa thuộc điều kiện giọng cũ còn hiệu lực.
6. **Compile/preview:** dùng FPS/tỷ lệ/chuyển động/phụ đề/SFX; bỏ phản hồi compile thủ công nếu key đã đổi. Nhạc nền đến bước export mới ghép.
7. **Xuất thủ công:** bảo đảm có cảnh, compile và giọng; gửi option xuất hiện tại. Remotion gửi CPU.
8. **Tiếp tục production:** đọc snapshot đã lưu; chỉ bổ sung cờ dọn chat mới. Bỏ qua bước đã hoàn thành. Hình hỏng đã nhận phản hồi không tự gọi lại AI, theo chính sách mới một lần vẽ.
9. **Reload/khôi phục:** IndexedDB giữ state và bản nháp. Nhánh khôi phục bản nháp có đối chiếu aspect/FPS/phụ đề/behavior/audio; nhánh `applyProduction` đang có điều kiện yếu hơn và gây lỗi bên dưới.
10. **Đổi mode/profile/pacing:** tách bản nháp; pacing có logic giữ phần gen và kiểm tra lại nhóm. Chuyển động bật lại không đồng nghĩa viết lại mọi cảnh đã lưu.
11. **Phần tiếp theo:** chọn chương từ series cũ, mang dữ liệu nhận diện hình dùng chung rồi tạo production mới với các cấu hình UI hiện tại. Đây là lượt mới cho phần sau, không cập nhật ngược phần đã xuất.
12. **SEO/thumbnail:** nhận script, analysis và ngôn ngữ; tên từ bản đồ trong analysis. Không có nhánh lấy động tác AI mới để viết lại hình/video đã xuất.

## Các điểm cần sửa, tách khỏi hành vi có chủ đích

### F1 — Kết quả snapshot cũ được đánh dấu khớp UI mới

Mức ưu tiên cao. `applyProduction` gán `compilationKey` từ state hiện tại thay vì so sánh với cấu hình đã tạo ra kết quả; chữ ký render cũng được ghép với state hiện tại và chỉ một phần renderSettings backend trả về.

Tái hiện trên Chrome thật, fixture backend: bắt đầu với phụ đề OFF → trong lúc production đang chạy đổi thành ON → nhận spec không có phụ đề → cả compilation key và render key đều được đánh dấu khớp UI ON. Resume sau khi người dùng đổi lựa chọn có cùng nguyên nhân.

Bằng chứng: [applyProduction](D:/video-AI-vidify/src/features/motion/hooks/useMotionStudio.ts:607), [renderSettings trả về](D:/video-AI-vidify/src/features/motion/server/services/motionProductionService.ts:81), trường `resultAcceptanceMismatch` trong verification JSON.

Hướng sửa an toàn: lưu/trả về cấu hình hiệu lực đủ để đối chiếu; nhận và giữ output cũ nhưng đánh dấu chưa khớp khi UI đã đổi. Dùng chung tiêu chuẩn với khôi phục bản nháp. Không gọi AI hoặc giảm chất lượng.

### F2 — Bật kiểm tra giọng nhưng vẫn xuất giọng chưa kiểm

Mức ưu tiên cao. Tạo giọng với ASR OFF → bật ON → `voiceValid` vẫn true → xuất không tạo job giọng mới. `motionVoiceSignature` và điều kiện render không xét mức kiểm tra ASR.

Bằng chứng: [voiceValid](D:/video-AI-vidify/src/features/motion/hooks/useMotionStudio.ts:1036), [dùng lại giọng lúc render](D:/video-AI-vidify/src/features/motion/hooks/useMotionStudio.ts:1240), trường `asrReuse`.

Hướng sửa: ghi trạng thái ASR thực tế của track, kiểm tra khi ON; không làm audio đã được kiểm mất hiệu lực khi chỉ tắt ASR. Không đổi lời kể hoặc mặc nhiên tạo lại toàn bộ cảnh.

### F3 — “Cách kể” thay đổi nhưng writer dùng phân tích cũ

Tái hiện payload thực: lựa chọn `plain`, `analysis.storytelling=lively`; bước viết dùng `motionStorytellingPreset(analysis.storytelling)` cho hooks và texture. Đổi tên cũng gắn với bản đồ ở bước phân tích, không có cơ chế áp dụng ngay từ toggle sau đó.

Bằng chứng: [payload script](D:/video-AI-vidify/src/features/motion/hooks/useMotionStudio.ts:828), [writer](D:/video-AI-vidify/src/features/motion/server/services/motionStoryService.ts:2032), trường `storytellingConflict`.

Hướng sửa: đối chiếu lựa chọn với phân tích và chỉ rõ cần phân tích lại, hoặc thiết kế cập nhật phân tích có kiểm soát. Không ghi đè một trường rồi coi chương/độ dài/bản đồ tên cũ đã đồng bộ.

### F4 — CPU thực tế và AUTO lưu trong state làm báo video cũ sai

Tái hiện: state.encoder=AUTO; Remotion UI hiển thị CPU, payload gửi CPU; backend trả renderSettings.encoder=CPU; chữ ký output dùng CPU nhưng key hiện tại dùng AUTO. Kết quả đúng vẫn `renderedVideoStale=true`.

Bằng chứng: [key render](D:/video-AI-vidify/src/features/motion/lib/motionVisualDraft.ts:52), [payload](D:/video-AI-vidify/src/features/motion/hooks/useMotionStudio.ts:1261), [nhận kết quả](D:/video-AI-vidify/src/features/motion/hooks/useMotionStudio.ts:626), trường `effectiveEncoderMismatch`.

Hướng sửa: chuẩn hóa encoder hiệu lực theo adapter trước khi tính key. Không thay encoder thật, CRF, FPS hoặc kích thước video.

### F5 — UI đổi nhà cung cấp AI vẽ chưa phản ánh chính sách một lần vẽ

Control cho bật nhưng draw request ghi đè OFF. Cần thể hiện rõ giới hạn/ẩn hoặc vô hiệu hóa đúng scope Remotion một lần vẽ. Không tự phục hồi retry/fallback chất lượng vì yêu cầu mới là không vẽ lại tự động.

### F6 — Lịch sử/phán quyết vẫn có hướng dẫn dễ sinh hình cán cân

Thể loại verdict hiện nói hình theo nội dung thực tế; không bắt mọi cảnh có cán cân. Tuy nhiên profile history còn `DEVICE comparison: a brass balance scale or a wooden ledger ...`; horror cũng gợi ý wooden balance/offering tray. Chỉ dẫn này áp dụng khi chọn cảnh comparison nên vẫn có thể kéo cảnh so sánh về hình cán cân dù nguồn không nói tới nó.

Bằng chứng: [history comparison](D:/video-AI-vidify/src/constants/motionProfiles/history/artDirection.ts:15), [horror comparison](D:/video-AI-vidify/src/constants/motionProfiles/horror/artDirection.ts:18). Cần làm hướng dẫn comparison trung tính theo nội dung, không cấm đồ vật có thật được nguồn yêu cầu. Chưa sửa trong đợt audit này.

## Kiểm chứng đã chạy

| Kiểm chứng | Kết quả và phạm vi |
|---|---|
| `npx tsx scripts/audit-motion-settings-chrome.ts` | Đạt: Chrome cài thật, mở cửa sổ; 19 control của Creator thật, gửi lựa chọn và đảo các toggle, IndexedDB thật/pagehide/reload; gọi các đường thủ công qua hook thật; tái hiện F1/F2/F4. Backend fixture, không AI/TTS/MP4 thật |
| `npx tsx scripts/audit-motion-settings-runner.ts` | Đạt: 16 tổ hợp (3 profile Remotion + kho) × 4 genre; theo dõi cấu hình tới analyze/script/scenes/voice/compile/render, autoExport ON/OFF, analyzeOnly, từ chối GPU Remotion, resume giữ snapshot và tái sử dụng bước đã xong. Phụ thuộc AI/media được inject |
| `npm run test:motion-script-intent` | Đạt: writer/editor giữ motionIntent nguyên văn; 96 case + 45 unit/profile; pipeline 18 cảnh, tối đa 5 worker vẽ; QA/repair 0; giữ animation, resume và tạo riêng cảnh |
| `verify-motion-render-behavior.ts` | Đạt: 2 trạng thái master motion, hai adapter, Canvas/frame, FPS, liên kết và 4 tỷ lệ; không gọi AI thật |
| `verify-motion-visual-drafts.ts` | Đạt: đổi mode, profile/pack riêng, 18 cảnh, cache/khôi phục/reload và từ chối khác nội dung; API giả lập |
| `verify-motion-scene-ai-settings.ts` | Đạt: lựa chọn AI riêng, reload và payload. Đây là bài browser tự động bổ trợ; bài Chrome mở cửa sổ chính là audit phía trên |
| `verify-chrome-backup.ts` | Đạt: DOM quota/retry fixture trên Chrome, Flash/Flash-Lite, switch đồng thời, lưu trước đóng, OFF/chưa chuẩn bị/hết quota dự phòng/hủy. Không gây hết quota tài khoản thật |
| `verify-motion-production-runner.ts` | Chưa đạt toàn bài: dừng ở assertion còn đòi chuỗi “Chưa đủ hình”, code hiện trả “Chưa đủ dữ liệu để xuất video…”. Không tính phần chưa chạy phía sau là đã đạt |
| `verify-motion-scene-pacing.ts` | Chưa đạt: fixture vẽ không được chấp nhận theo contract một lần vẽ hiện tại, dừng ở cảnh `b0:0`. Chưa kết luận đây là lỗi runtime pacing; cần cập nhật fixture theo contract rồi kiểm lại |
| `npx tsc --noEmit` và `git diff --check` | Đạt trên mã nguồn hiện tại; TypeScript của repo không bao gồm thư mục scripts, hai script audit đã được chạy trực tiếp bằng tsx |

Không dùng việc script audit tái hiện thành công một lỗi để gọi lỗi đó “đã sửa”. Chưa chạy toàn bộ tổ hợp với AI thật hoặc xuất video đầy đủ cho mỗi cấu hình; chưa thể cam kết 100% chất lượng mọi kiểu hình/thể loại.

Tệp bằng chứng:

- [Chrome verification](D:/video-AI-vidify/scratch/motion-settings-audit-20261106/verification.json)
- [Payload từng request](D:/video-AI-vidify/scratch/motion-settings-audit-20261106/requests.json)
- [Ma trận runner](D:/video-AI-vidify/scratch/motion-settings-audit-20261106/runner-verification.json)
- [Cấu hình dự án thật đã đối chiếu](D:/video-AI-vidify/scratch/motion-settings-audit-20261106/real-project-settings.json)
- [Ảnh Chrome kiểm thử](D:/video-AI-vidify/scratch/motion-settings-audit-20261106/settings-chrome.png)

## Thứ tự sửa đề xuất

1. Sửa F1 và F4 bằng một cơ chế so sánh cấu hình hiệu lực thống nhất cho automatic/manual/resume/reload.
2. Sửa F2 bằng điều kiện ASR thực tế của audio được dùng lại.
3. Sửa F3 và thông báo phụ thuộc giai đoạn của genre/length/language/rename/parts; không âm thầm đổi kịch bản đã có.
4. Đồng bộ UI với chính sách một lần vẽ (F5); làm prompt comparison trung tính (F6).
5. Cập nhật các fixture cũ còn lệch contract, rồi kiểm lại trên Chrome thật với dữ liệu cảnh đã chạy. Không thêm QA ảnh, không sửa động tác bằng code, không tự vẽ lại hàng loạt.
