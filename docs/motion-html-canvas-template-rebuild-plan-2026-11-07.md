# Kế hoạch thay luồng dựng cảnh Video Motion bằng HTML Canvas

Ngày: 07/11/2026. Trạng thái: đã triển khai nhánh runtime HTML Canvas trong source; phạm vi nghiệm thu và giới hạn thực tế ghi tại [báo cáo triển khai](motion-html-canvas-implementation-2026-11-07.md).

## 1. Mục tiêu và quyết định kiến trúc

Thay luồng AI dựng SVG/layers/animations bằng luồng AI trả một tài liệu HTML hoàn chỉnh, dùng HTML5 Canvas và Vanilla JavaScript, đúng hướng mẫu người dùng cung cấp.

Luồng đích:

```text
Nguồn + phong cách đã chọn
  → AI viết kịch bản và mẫu mô tả mục 0–4 cho từng nhịp hình
  → AI phân cảnh và trả mẫu mục 0–4 hoàn chỉnh cho từng cảnh
  → code ghép mẫu với chỉ dẫn xuất HTML và giao ước phát theo thời gian
  → AI trả toàn bộ HTML của một cảnh trong một phản hồi
  → lưu phản hồi gốc và dùng HTML để phát/dựng frame thực tế
  → khi thực thi lỗi: tạo lại toàn bộ cảnh từ prompt gốc đến khi chạy được
  → ghép các cảnh với giọng, phụ đề, nhạc, SFX → MP4
```

Đây là thay renderer cảnh, dữ liệu cảnh và orchestration, không chỉ thay câu chữ prompt. Nhánh mới không đi qua renderer SVG, bộ đo cơ thể, hệ rig hoặc bộ chấm điểm cũ.

Phạm vi là bước tạo hình/chuyển động của Video Motion, cho cả ba profile hiện tại: `history`, `horror`, `explainer`. Những thành phần biên tập lời kể, tạo giọng, SEO và chế độ ghép kho không bị xóa chỉ vì chúng dùng chung các module với Video Motion.

## 2. Cách hiểu chính xác yêu cầu một lần và thử lại

- Mỗi lần gửi là một yêu cầu tạo TOÀN BỘ cảnh: HTML, hình, chuyển động, biểu cảm, hiệu ứng và tương tác cùng trong một phản hồi.
- Kết quả chạy được đầu tiên được giữ. Không có lượt thứ hai để bổ sung motion, lượt review, lượt chấm điểm, lượt sửa đẹp hoặc chọn bản tốt nhất.
- Nếu gửi/nhận hoặc thực thi cảnh bị lỗi, tạo lại toàn bộ cảnh từ cùng prompt đã đóng băng. Không gửi bản HTML hỏng để patch, không thêm danh sách lỗi hình vào prompt.
- Số lần thử lại khi lỗi không có trần cố định 1/3/5 lần. Lặp đến khi thực thi được, người dùng dừng hoặc phải chờ điều kiện ngoài như đăng nhập/quota.
- Một cảnh chỉ có một yêu cầu sinh nội dung đang chạy. Timeout chưa biết kết quả phải tìm/đọc lại phản hồi ở room cũ trước khi xác định cần gửi lần mới.
- Lỗi ghi file: ghi lại phản hồi đã có, không gọi AI. Lỗi Chrome/FFmpeg/hệ thống: chạy lại với HTML đã có trước, không tự quy thành lỗi HTML.

“Thành công” có nghĩa vận hành: lấy được phản hồi và thực thi giao ước phát cảnh để dựng frame thực tế mà không phát sinh lỗi. Nó không có nghĩa code đã xác nhận hình đẹp, đủ người, đúng khớp, đủ động tác hay đúng lịch sử. Cảnh trống, nhân vật trượt hoặc sai biểu cảm nhưng không gây lỗi thực thi sẽ không bị code phát hiện và tạo lại theo chất lượng. Đây là hệ quả trực tiếp của việc bỏ toàn bộ QA hình và chuyển động.

## 3. Hiện trạng đã đối chiếu với source

| Vị trí | Hiện trạng | Việc cần làm cho nhánh mới |
| --- | --- | --- |
| `src/features/motion/server/services/motionStoryService.ts` | Viết `motionIntent`, có chèn `brief.frame` và kiểm trường motion | Đổi sang mô tả mẫu 0–4; bỏ chèn frame và các gate hình/motion cũ |
| `src/constants/motionPrompt.ts`, `motionWriting.ts`, `motionActionAuthoring.ts` | Còn chỉ dẫn SVG, khung nhân vật, động tác giản lược/ảnh tĩnh và actionPlan cũ | Viết lại chỉ dẫn cho chuỗi hình và chuyển động bằng HTML Canvas |
| `src/constants/motionRemotionPrompts.ts` | Phân cảnh theo `nodes`, enum người/vật, unit, stance, số người theo shot | Thay output phân cảnh mới bằng mẫu hoàn chỉnh; không dùng enum giải phẫu làm gate |
| `src/lib/motionSceneBrief.ts` | Ghép khung người, vật, thú, unit, rig/ID và watch-outs | Nhánh mới không import hoặc gọi bộ ghép brief này |
| `src/features/motion/server/services/remotion/scenePipeline.ts` | Guard phân cảnh, sheet vật, identity theo SVG, score và rewrite | Thay bằng pipeline template + HTML + retry lỗi |
| `src/constants/motionSceneScore.ts` | Tối đa 3 lượt; ngưỡng 80; giữ bản tốt nhất | Gỡ khỏi đường tạo cảnh mới, bỏ điểm/ngưỡng/best |
| `src/lib/motionSceneComposition.ts` | Chuẩn hóa/sửa SVG, kiểm group/keyframe/channel, dựng SVG theo frame | Không áp dụng lên artifact HTML |
| `src/features/motion/server/services/remotion/storyCompiler.ts`, `sceneKeys.ts` | Compile/readiness theo composition SVG và geometry | Thêm đường compile/status/hash theo artifact HTML |
| `src/features/motion/remotion/StoryComposition.tsx` | Phát SVG/layer qua Remotion | HTML dùng player Canvas riêng; SVG chỉ phục vụ dữ liệu legacy |
| `src/features/motion/server/services/motionRemotionRenderService.ts` | Render Remotion, có cutout inspector và validate SVG | HTML dùng renderer Chrome/Canvas riêng, không chạy các inspector này |
| `src/features/motion/server/services/motionRenderService.ts`, `motionRemotionSegmentCache.ts` | Export/cache/ghép segment phụ thuộc spec Remotion | Tách giao diện segment dùng chung, thêm nguồn HTML Canvas |
| `src/features/motion/components/MotionRemotionScenes.tsx` và player/still | Hiển thị điểm, trạng thái và preview theo SVG | Dùng renderer của artifact; bỏ UI điểm/QA/best cho cảnh mới |

Một số log/tài liệu cũ nói chỉ một lượt, nhưng source hiện tại vẫn có score/rewrite tối đa ba lượt. Triển khai phải thay đường gọi thực tế và log tương ứng, không chỉ đổi mô tả giao diện.

## 4. Dữ liệu ở bước viết kịch bản

### 4.1. Một nguồn chỉ dẫn cảnh duy nhất

Thêm `sceneTemplateDraft` dạng chuỗi trên mỗi nhịp hình của kịch bản. Chuỗi này có đủ các tiêu đề mục 0–4 của mẫu. Giữ trong JSON phản hồi kịch bản hiện có để ánh xạ với narration và ID nhịp.

Không duy trì song song `motionIntent`, `actionPlan` và một mẫu mới cùng làm chỉ dẫn cho cảnh mới. Những trường cũ chỉ được đọc ở dự án legacy. Với dự án mới, phần hành động nằm trong mục 3 của template.

Ví dụ vỏ dữ liệu, phần nội dung giữa dấu ngoặc do AI viết đầy đủ:

```json
{
  "id": "beat_001",
  "narration": "Lời dẫn của nhịp.",
  "utterances": [],
  "sceneTemplateDraft": "0. CHỦ ĐỀ & LOẠI PHÂN CẢNH:\n...\n1. QUY CHUẨN ĐỒ HỌA:\n...\n2. BỐI CẢNH 3 LỚP (LAYERS & CAMERA):\n...\n3. HỆ THỐNG NHÂN VẬT & CƠ CHẾ HOẠT ĐỘNG:\n...\n4. GIAO DIỆN ĐẶC TRƯNG & TƯƠNG TÁC (UI & OVERLAYS):\n..."
}
```

Dấu `...` ở ví dụ tài liệu không được xuất hiện để thay nội dung trong phản hồi production; prompt yêu cầu AI viết đủ.

### 4.2. Nội dung AI phải viết

| Mục | Nội dung cần có |
| --- | --- |
| 0 | Tên, loại cảnh, tông màu, sự việc được minh họa, thời điểm/bối cảnh |
| 1 | Quy chuẩn phong cách đã chọn bằng chữ; nét, màu, dáng tổng thể, cách biểu cảm |
| 2 | Hậu cảnh/trung cảnh/tiền cảnh; vị trí tương đối; vật tĩnh; hiệu ứng và camera |
| 3 | Các chủ thể thực sự xuất hiện, danh tính/ngoại hình/trang phục, số lượng thể hiện, hành động từng chủ thể, tiếp xúc, biểu cảm và trạng thái đầu–diễn biến–cuối |
| 4 | Chữ xuất hiện nguyên văn, thẻ/chú thích/bản đồ nếu cần, tương tác khi xem thử, diễn biến tự chạy khi xuất video |

- Phần hành động phải tách chuyển động toàn thân/phương tiện với chuyển động tương đối của các bộ phận.
- Các pha có thể dùng đầu/giữa/cuối hoặc phần trăm tiến độ, vì thời lượng giọng có thể chưa được biết.
- Nêu chủ thể đứng yên, hoạt động lặp và sự kiện xảy ra một lần.
- Nhóm 1/2, đơn vị đặc biệt, gag, mini-map và thẻ giấy là mục có thể ghi “không có/không dùng”. Không bắt AI thêm quân, vũ khí hoặc joke để điền mẫu.
- Mô tả số cá thể cần thấy trong hình không được biến thành khẳng định số quân lịch sử chưa có trong nguồn.
- Narration và utterances chỉ chứa lời đọc. Template không được đọc thành tiếng.
- Những sửa đổi biên tập làm thay đổi sự việc phải sửa mẫu mô tả bị ảnh hưởng trong cùng phản hồi biên tập. Nếu không ảnh hưởng thì giữ nguyên văn.

### 4.3. Thay đổi dữ liệu liên quan

Mở rộng type, schema hướng dẫn AI, phần normalize/lưu/checkpoint/editor/export project để giữ nguyên chuỗi `sceneTemplateDraft`; không trim theo giới hạn pose/camera và không tự viết bù nội dung.

JSON chỉ là vỏ lưu/đọc dữ liệu. Bỏ bộ đánh giá “đủ hành động/đúng khớp/đúng format hình” bằng code ở đường mới. Lỗi đọc JSON là lỗi dữ liệu thực tế của bước viết/phân cảnh, xử lý tại chính bước đó trước khi gửi tạo HTML.

## 5. Dữ liệu ở bước phân cảnh

AI phân cảnh nhận lời dẫn, mẫu nháp và thông tin nhận dạng bằng chữ của các nhịp liên quan. Trong cùng lượt phân cảnh, AI trả mẫu hoàn chỉnh cho từng cảnh.

Vỏ đề xuất:

```json
{
  "scenes": [
    {
      "id": "scene_001",
      "sourceBeatIds": ["beat_001"],
      "fromLineId": "line_001",
      "toLineId": "line_002",
      "sceneTemplate": "Toàn bộ mục 0–4, đã điền đầy đủ riêng cho cảnh này.",
      "continuityIn": "Nhận dạng và trạng thái đầu liên quan, bằng chữ.",
      "continuityOut": "Trạng thái cuối đã được kịch bản dự kiến, bằng chữ."
    }
  ]
}
```

- AI quyết định tách/ghép cảnh theo các dòng đã có. Mẫu cuối chỉ chứa sự việc nằm trong phạm vi lời dẫn của cảnh.
- Khi tách một nhịp thành nhiều cảnh, mỗi cảnh có mẫu riêng, đầu–diễn biến–cuối riêng. Không lặp nguyên diễn biến toàn nhịp trong mọi cảnh con.
- Khi ghép nhịp, AI viết một mẫu liền mạch cho phần lời được phủ; giữ các mốc cần đồng bộ.
- Mỗi mẫu cuối tự đủ thông tin để gửi dựng độc lập. Danh tính, trang phục và mốc địa điểm cần thiết được viết vào mẫu, không đợi cảnh trước vẽ xong để lấy SVG mẫu.
- Không cần `nodes`, `stance`, `unit`, `animal`, `object.class`, box, socket hoặc rig để dựng cảnh mới. ID cảnh và dòng nguồn phục vụ timeline/lưu dữ liệu; không phải ID nhóm hình bắt AI phải vẽ theo.
- Code giữ nguyên nội dung AI trả về; không suy từ động từ lời dẫn để bổ sung hành động, dựng khung, giới hạn số người hay sửa tư thế.
- `continuityOut` là ý đồ tác giả, không phải kết luận đã kiểm hình AI thực sự vẽ.

## 6. Cùng template cho cả ba kiểu hình

Giữ ba lựa chọn hiện tại: Lịch sử, Truyện ma, Giải thích. Dùng cùng các bước viết → phân cảnh → tạo HTML → phát → xuất.

Mục 1 được viết bằng mô tả phong cách bằng chữ của lựa chọn đang dùng. Ví dụ lịch sử có thể dùng đầu to/nét viền/màu bệt theo mẫu; truyện ma giữ đặc điểm mặt nạ/thân áo liền nếu đó là phong cách đang chọn; giải thích ưu tiên cách trình bày sáng rõ. Thể loại không tự áp đặt đồ vật, hành động hoặc số nhân vật.

Đây là áp dụng cùng MẪU VÀ CƠ CHẾ cho ba kiểu hình, giữ danh tính ba lựa chọn. Không tự biến cả ba lựa chọn thành cùng một ngoại hình OverSimplified. Bỏ các tham chiếu sang frame SVG, thông số khớp, tỉ lệ giải phẫu cưỡng chế và câu “use approved frame geometry” trong mô tả phong cách mới.

Phải tách bộ mô tả chữ mới khỏi `V.PROFILES[...].direction`/`brief.frame` cũ vì các chuỗi này đang chứa hoặc nối đến quy chuẩn và frame cũ. Không import nguyên bộ artDirection cũ rồi lọc vài trường.

## 7. Ghép prompt tạo cảnh

Tạo builder nhỏ, thuần dữ liệu, ví dụ `buildMotionHtmlPrompt`. Chỉ ghép:

1. Chỉ dẫn đầu ra: một khối HTML hoàn chỉnh, từ `<!DOCTYPE html>` đến `</html>`, không giải thích, không rút gọn code.
2. Yêu cầu dùng HTML5 Canvas và Vanilla JS.
3. Nguyên văn `sceneTemplate` mục 0–4 do AI phân cảnh trả.
4. Phụ lục vận hành: kích thước thiết kế/xuất, FPS cài đặt, thời lượng, seed, chế độ chuyển động và dữ liệu đồng bộ lời thoại nếu có.
5. Giao ước JavaScript để host gọi phát tại một thời điểm bất kỳ.

Không nối thêm `motionSceneBrief`, khung người/vật/thú, ví dụ SVG, thư viện unit, object sheet, rig, watch-outs, score checklist hoặc phản hồi lỗi hình. Cũng không bọc prompt HTML bằng schema “phải trả JSON SVG” của `requestMotionAiContract` cũ.

Lưu cả prompt cuối cùng và phiên bản template. Các lần thử của cùng cảnh dùng cùng prompt đã lưu. Phản hồi lưu nguyên bản; nếu có một cặp code fence bao ngoài, chỉ bóc lớp bao để có file HTML, không sửa JavaScript/Canvas/DOM bên trong.

## 8. Giao ước HTML để preview và xuất cùng một cảnh

### 8.1. Giao ước tối thiểu cần bổ sung vào prompt

```text
canvas chính: id="motion-canvas"
window.motionScene.ready: Promise hoàn tất khởi tạo tài nguyên nội bộ
window.motionScene.renderAt(input): vẽ đầy đủ frame được yêu cầu

input:
  time: giây cục bộ của cảnh trên timeline phát
  progress: tiến độ cảnh 0..1
  frame: số frame cục bộ, bắt đầu từ 0
  fps: FPS xuất đã chọn
  duration: thời lượng cảnh thực tế
  width, height: kích thước đầu ra
  mode: "preview" | "export"
  motionEnabled: bật/tắt chuyển động
  sceneEffectsEnabled: bật/tắt hiệu ứng môi trường
  speaking: các khoảng lời thoại/speaker nếu dự án có
```

Tên API là thiết kế đề xuất; khi triển khai phải dùng nhất quán giữa prompt, preview và renderer. Đây là giao diện gọi thực thi, không phải bộ QA/chấm kết quả.

### 8.2. Quy tắc chạy

- Hình ở cùng thời điểm phải giống nhau khi tua, gọi lặp hoặc render frame ngoài thứ tự.
- `renderAt` dựng toàn bộ frame từ đầu vào; không phụ thuộc việc frame trước đã chạy. Nếu AI dùng mô phỏng trạng thái, nó phải tự reset/tái lập từ seed cho thời gian được yêu cầu.
- Hoạt động ngẫu nhiên dùng seed cố định. Không lấy đồng hồ máy làm thời gian nội dung.
- RAF chỉ phục vụ phát độc lập trong HTML; khi nhúng vào ứng dụng hoặc export, thời gian do host điều khiển và RAF tự chạy phải dừng.
- HTML tự đủ tài nguyên, không cần CDN hoặc gọi mạng. Font cho tiếng Việt dùng bộ font cục bộ do ứng dụng cung cấp theo một tên font thống nhất.
- Hiệu ứng, camera, biểu cảm và animation do AI viết trong HTML. Host chỉ truyền thời gian/cài đặt, không tự thêm gait, lắc/nhún, zoom hoặc sửa khớp.
- Khi tắt motion, cảnh vẽ trạng thái tĩnh được yêu cầu. Không tái dùng một file HTML được tạo cho cài đặt khác mà không lưu provenance.
- “60 FPS loop” trong mẫu được diễn giải là chuyển động liên tục theo thời gian; không ép đổi FPS xuất của người dùng thành 60.

### 8.3. Tương tác và overlays

- Toàn bộ nội dung hình xuất hiện trong video, gồm thẻ giấy, chữ, HP, bản đồ nhỏ, phải vẽ vào canvas chính.
- Thanh điều khiển và nút thử nghiệm nằm ngoài canvas, chỉ dùng lúc xem tương tác; không bị chụp vào video.
- Mục 4 chỉ định cả hành vi click và diễn biến tự chạy khi xuất. Export không chờ thao tác thật của người dùng.
- Preview trong ứng dụng có play/pause/seek chung; hành động tùy chọn có thể dùng ở chế độ thử tương tác riêng. Kết quả thử tương tác không tự sửa bản xuất đã định sẵn.
- Giọng/nhạc/SFX vẫn do pipeline âm thanh quản lý. HTML không tự phát audio trùng với track đang ghép.

## 9. Gỡ toàn bộ QA và khung ở đúng mọi điểm gọi

### 9.1. Gỡ khỏi nhánh dựng mới

- Score, threshold, best-result, keep-best, warning chất lượng và rewrite theo score.
- `motionScenePlanGuard`, sửa stance/rides/crowd, tự ghép người với vật, ép số người theo view.
- Chèn `motionFrameSvg`, `brief.frame`, `motionPoseNotes`, `motionAnimalFrames`, animal/object/unit frames, object sheet và rig lines.
- Sinh object sheet hoặc lấy SVG cảnh trước làm mẫu bắt buộc trước khi dựng.
- Kiểm hình người/vật, màu da, tư thế, miệng/râu, chân tay, ra ngoài khung, cutout/alpha, độ phủ, missing channel, độ dài motion và hình trống.
- Chụp frame đầu/giữa/cuối để chấm hoặc làm gate. Không có tác vụ AI QA/director/repair sau sinh.
- Normalize/patch HTML, tự bù hàm vẽ, tự thay hình hoặc sửa code AI.
- Trần 96 layer/track, 20 keyframe, enum group/path và trần SVG 150.000 ký tự không áp lên HTML.
- Gate compile/preview/export theo `composition`, `geometryRevision`, `unchecked`, đủ rig hoặc đủ animation của SVG.
- Nút/điểm/log QA và tên trạng thái “best answer” ở dữ liệu mới.

Các module còn phục vụ dữ liệu legacy hoặc chế độ kho có thể giữ để đọc dữ liệu cũ. Điều kiện nghiệm thu là đường HTML mới không gọi chúng; code chết hoàn toàn được xóa sau khi rà import/call site. Không chỉ đổi tên validator thành readiness rồi giữ cùng phép chấm.

### 9.2. Phần thực thi cần có để biết khi nào thử lại

Không dựng một bộ kiểm HTML thay thế bộ QA cũ. Host thực sự load tài liệu, đợi khởi tạo và gọi `renderAt` để preview hoặc xuất. SyntaxError, TypeError, lỗi khởi tạo, Promise rejection và lỗi gọi render là lỗi vận hành thực tế được bắt để xử lý.

Quyền truy cập của HTML chạy trong vùng cô lập, không cấp Node/Electron/file hệ thống. Đây là cấu hình host, không phải bước kiểm hình hay xét nội dung HTML.

File đầu ra/FFmpeg/Chrome vẫn có xử lý lỗi tiến trình và ghi file. Chúng không được dùng để suy ra “hình xấu” rồi gọi AI vẽ lại. Không báo xuất xong khi tiến trình xuất thất bại.

## 10. Hàng đợi và thử lại đến khi thành công

Trạng thái đề xuất:

```text
planned → generating → received → initializing → ready
              ↓            ↓           ↓
           retry_wait ← lỗi thực tế của bước tương ứng

ready → rendering → rendered
           ↓
  lỗi JS của scene → retry_wait → generating
  lỗi hạ tầng       → retry dùng lại HTML

bất kỳ trạng thái đang làm → cancelled khi người dùng dừng
retry_wait → waiting_external khi cần đăng nhập/quota rồi tiếp tục
```

- `ready` chỉ nghĩa cảnh đã mở và phát được ở lần dùng thực tế, chưa khẳng định mọi frame đã chạy.
- `rendered` nghĩa đã dựng xong segment thực tế. Lỗi JS chỉ xuất hiện muộn được phát hiện tại frame thực sự xuất, không cần thêm lượt chạy QA.
- Giữ tối đa năm room tạo cảnh đang hoạt động như luồng hiện tại, cùng provider/model người dùng chọn. Đây là số room sinh AI, không phải tự động mở năm renderer video.
- Retry chờ theo backoff 2 → 5 → 10 → 20 → 30 giây; từ đó tối đa 30 giây mỗi lần chờ. Không chặn event loop, không làm nút dừng mất tác dụng.
- Cảnh chờ retry trả slot về hàng đợi để cảnh khác tiếp tục. Khi đến hạn, nhận slot và tạo một lần tiếp theo.
- Quota/đăng nhập/CAPTCHA chờ điều kiện ngoài, giữ nguyên cảnh và request đã có. Không spam request khi provider chưa nhận việc.
- Không cộng thêm bộ retry ẩn của contract SVG vào số lần thử. Một lớp duy nhất sở hữu việc gửi lại nội dung.
- Mỗi attempt ghi thời điểm, room/request ID, prompt hash, raw response và lỗi thực tế nếu có; không có quality score.
- Nếu Chrome crash khi đang render, mở lại và chạy cùng HTML. Chỉ tạo HTML mới khi có lỗi thực thi gắn với chính tài liệu cảnh, không vì một timeout hạ tầng chưa xác định.
- Một HTML do AI gây treo không thể xác định chắc chỉ từ timeout. Trước tiên chạy lại cùng HTML trong runtime mới; nếu việc thực thi cùng cảnh tiếp tục làm treo thì phân loại lỗi thực thi có thể tái hiện và mới quay lại sinh HTML. Không coi một timeout đơn lẻ là kết luận lỗi cảnh.
- Khi một attempt lỗi, tạo mới đầy đủ từ prompt gốc; không sửa một đoạn rồi gọi đó là “một lần tạo”.

## 11. Lưu dữ liệu, hash và tiếp tục

### 11.1. Artifact mới

Thêm discriminator rõ ràng như `renderer: "html-canvas"`, có `version`, `sceneId`, `inputKey`, `promptHash`, `htmlHash`, `htmlPath`, `status`, `attempts`, `lastError`, `runtimeVersion` và metadata timing.

File HTML, raw response và attempt log đặt trong thư mục riêng của cảnh/attempt. Bản accepted trỏ tới file được giữ; không chép HTML nhiều lần vào các trường SVG hoặc assets giả.

Hash đầu vào tính từ template cuối, phiên bản prompt/runtime, profile chữ, dữ liệu nhận dạng liên quan, cài đặt kích thước/motion và các tham số thực sự đưa vào prompt. Bản phản hồi và prompt phải truy ngược được.

### 11.2. Resume và chống tạo trùng

- Đã `ready/rendered`: dùng lại file đã lưu, không gửi AI vì app khởi động lại.
- Đã nhận raw nhưng chưa ghi artifact: ghi lại chính raw, không gọi AI.
- Đang `generating` khi app dừng: đối chiếu request/room và đọc tiếp; chỉ gửi lại sau khi đã xác định tác vụ trước kết thúc/lỗi hoặc không còn khả năng lấy kết quả.
- Đã lỗi và còn trạng thái retry: tiếp tục thử theo yêu cầu mới; bỏ hành vi cũ “lỗi rồi không tự sinh lại”.
- Ghi attempt trước khi gửi và lưu phản hồi ngay khi nhận; cập nhật trạng thái bằng ghi file nguyên tử.
- Callback của attempt cũ không được ghi đè attempt mới sau khi hủy hoặc đổi input. Dùng request token/revision để điều phối, không phải chấm nội dung.
- Đổi template/cài đặt tạo phiên bản mới, không xóa bản đang có. “Tạo lại cảnh này” là thao tác chủ động tạo một phiên bản thay thế.

## 12. Preview và renderer xuất video

### 12.1. Chọn renderer HTML chuyên biệt

Dùng trang Chrome chạy tài liệu HTML trực tiếp và FFmpeg cho nhánh mới. Tái dùng tiện ích tìm Chrome, quản lý job/hủy, FFmpeg và phối âm hiện có. Không cố nhét HTML vào trường SVG hoặc bắt Remotion cũ hiểu Canvas qua ảnh SVG.

Preview dùng iframe cô lập và một cầu nối runtime nhỏ để điều khiển play/pause/seek, truyền thời gian vào `renderAt`. Đường preview và đường xuất dùng cùng file HTML và cùng runtime input. Cầu nối chỉ thực thi/gửi lỗi, không sửa nội dung hình.

Runtime adapter có thể được host cài ở ngoài tài liệu/qua bootstrap; raw HTML vẫn giữ nguyên. Promise trả từ `renderAt` phải hoàn tất trước khi chụp frame.

### 12.2. Export

1. Compile timeline từ lời dẫn/voice như hiện tại, ánh xạ cảnh theo dòng nguồn.
2. Với mỗi frame của segment, gọi `renderAt` với thời gian cục bộ và kích thước xuất.
3. Chụp canvas chính thực tế và truyền frame theo thứ tự vào FFmpeg, có backpressure và hủy.
4. Encode segment theo FPS, độ phân giải, chất lượng người dùng chọn.
5. Ghép segment, audio, nhạc, SFX, phụ đề theo timeline chung.

Chụp frame ở đây là bước dựng video, không phải chụp QA. Không dựng một lượt kiểm trước rồi mới dựng lại để xuất.

Giữ overlay phụ đề toàn video do pipeline quản lý; chữ/thẻ trong cảnh do AI Canvas quản lý. Nếu người dùng bật/tắt phụ đề, không cần sinh lại HTML chỉ để thay lớp phụ đề toàn video.

### 12.3. Thời lượng và giọng

- Cho dựng sớm bằng tiến độ 0..1 và thời lượng ước tính, để không bắt năm room chờ TTS toàn video.
- Khi có giọng cuối, host truyền thời lượng và các khoảng thoại thật. AI đã được yêu cầu viết cảnh theo `progress`/runtime input nên không cần gọi lại chỉ vì thời lượng thay đổi.
- Cảnh có mốc đồng bộ câu/từ dùng ID lời/utterance ổn định và timestamp đã có. Nếu chỉ có timestamp theo câu thì giữ độ chính xác theo câu, không gọi đó là đồng bộ từng từ.
- Cache segment phụ thuộc HTML hash, timing/voice spans, runtime version, seed, kích thước, FPS, motion/effects, font và tham số encode. Đổi audio timing làm dựng lại segment, không tự sinh lại HTML.
- HTML sinh lại vì lỗi làm hết hiệu lực cache của cảnh đó; các cảnh khác dùng lại segment đã có.
- Chưa có số đo hiệu năng cho renderer này. Không hứa nhanh hơn Remotion hoặc 60 FPS render thực tế trước khi đo.

## 13. Tương thích dự án và giao diện

- Dự án mới dùng HTML Canvas mặc định trong nhánh dựng cảnh AI của cả ba kiểu hình.
- Dự án đã có SVG tiếp tục mở/phát/xuất bằng renderer legacy; không tự ghi đè hoặc tự sinh lại toàn bộ.
- Chuyển một dự án cũ sang cơ chế mới cần AI tạo template từ lời dẫn/phân cảnh đã có, lưu phiên bản mới rồi dựng các cảnh HTML. Không để code tự suy diễn template từ nodes/rig cũ.
- Cho phép phiên bản dự án có cảnh legacy và HTML trong giai đoạn chuyển đổi; lớp export điều phối renderer theo từng artifact và ghép về một cấu hình xuất chung.
- Giao diện hiển thị: đang phân cảnh, đang tạo HTML, đang chờ thử lại, đang chờ đăng nhập/quota, đã dựng cảnh, đang xuất segment, đã xuất.
- Bỏ điểm, ngưỡng đạt, đã giữ bản tốt nhất, nút QA và cảnh báo thẩm mỹ ở đường mới.
- Hiển thị lượt tạo và lỗi thực tế gần nhất để người dùng biết cảnh đang thử lại, kèm nút dừng/tiếp tục/tạo lại riêng cảnh.
- API scenes/compile/render, preview tổng, thumbnail cảnh, tải project và production resume đều phải nhận discriminator mới. Không chỉ làm được trang preview đơn lẻ.

## 14. Thứ tự triển khai và bản bàn giao từng phần

| Bước | Thay đổi | Bản hoàn thành cụ thể |
| --- | --- | --- |
| 0 | Thống nhất hợp đồng thể loại, cách kể, thời lượng và nhịp hình theo mục 17 | Một cấu hình tác giả dùng xuyên các bước; bỏ các chỉ dẫn mâu thuẫn được audit phát hiện |
| 0A | Lập ánh xạ tương thích 19 control và phụ thuộc các giai đoạn theo mục 18 | Mỗi control có giá trị hiệu lực, phạm vi cập nhật và case bật/tắt/đổi option; không mất chức năng khi bỏ SVG/nodes |
| 1 | Type/state/schema hướng dẫn AI, renderer discriminator, storage/hash | Lưu/đọc template, HTML và snapshot bốn cấu hình, phân biệt mốc chọn/ước tính/thực tế |
| 2 | Prompt viết, normalize, editor, checkpoint | Ba profile có mẫu nháp 0–4; đúng kỹ thuật thể loại/cách kể, ngân sách lời và nhịp hình đã chọn; không chèn frame |
| 3 | Prompt phân cảnh và dữ liệu cảnh mới | Mỗi cảnh có mẫu cuối, nhóm lời theo nhịp hình, ánh xạ dòng nguồn và thời gian; không node/rig guard |
| 4 | Builder tạo HTML và task nhận raw | Một yêu cầu trả cả cảnh; lưu prompt/raw/HTML nguyên bản |
| 5 | Runtime Canvas và preview có play/pause/seek | Phát file HTML thật, truyền runtime input, báo lỗi thực thi |
| 6 | Retry scheduler và resume | Không giới hạn số lần lỗi; không tạo trùng; dừng/tiếp tục và chờ provider hoạt động |
| 7 | Renderer Chrome→frame→FFmpeg | Xuất segment từ Canvas, giữ FPS/độ phân giải và hủy được |
| 8 | Timeline/audio/subtitle/cache/early scene và hiển thị thời lượng thực | Xuất nhiều cảnh theo audio; hiện riêng mốc chọn/ước tính/thực tế, đo nhịp từ timeline; dùng lại segment đúng phiên bản |
| 8A | Tích hợp ASR, phân vai, SFX sidecar, phụ đề, nhiều phần, tự động hóa và cleanup Gemini | Toàn bộ tùy chọn trong ảnh hoạt động với HTML Canvas và đọc dự án legacy; retry/resume không làm mất dữ liệu hoặc dùng nhầm cấu hình |
| 9 | Gỡ nhánh score/QA/frame cũ khỏi route mới, cập nhật UI/log | Đường mới không còn gọi chấm điểm, frame, sheet, sửa hình hoặc chọn best |
| 10 | Thử phát/xuất thực tế, cập nhật tài liệu, bản dev/release | Bằng chứng theo ba profile, nêu rõ phạm vi đã chạy; đóng gói nếu phạm vi triển khai bao gồm bản cài |

Tên file mới dự kiến:

```text
src/types/motionHtmlScene.ts
src/constants/motionHtmlTemplate.ts
src/constants/motionHtmlStyles.ts
src/lib/motionHtmlPrompt.ts
src/lib/motionHtmlTimeline.ts
src/features/motion/server/services/html/scenePipeline.ts
src/features/motion/server/services/html/sceneStore.ts
src/features/motion/server/services/html/sceneRetry.ts
src/features/motion/server/services/html/sceneRuntime.ts
src/features/motion/server/services/html/sceneRenderer.ts
src/features/motion/components/MotionHtmlScenePlayer.tsx
```

Đây là vị trí dự kiến, không phải yêu cầu tạo đủ file rỗng. Khi triển khai, chia module theo phụ thuộc thực tế và quy ước repository.

## 15. Nghiệm thu trong lúc phát triển, không đưa QA vào production

Kiểm thử kỹ thuật trong quá trình sửa code vẫn cần để xác nhận yêu cầu đã được làm đúng. Các phép thử dưới đây không trở thành các lượt kiểm/chấm cảnh khi người dùng tạo video.

1. Ba profile thực tế: lịch sử, truyện ma, giải thích cùng đi qua luồng template→HTML→preview→MP4.
2. Prompt thu được chỉ có mẫu đã viết và phụ lục runtime; không có SVG frame, rig, sheet, anatomy checklist hoặc schema SVG ẩn trong request/context gửi provider.
3. Có một phản hồi chạy được: chỉ một yêu cầu sinh, không gọi QA/director/motion/review/repair sau đó.
4. Giả lập hơn ba lần lỗi rồi thành công: tiếp tục đủ lần, dừng tại lần thành công đầu, không chọn best.
5. SyntaxError/runtime exception làm tạo lại đầy đủ; cảnh sai hình nhưng vẫn chạy không kích hoạt tạo lại theo chất lượng.
6. Mất kết nối sau khi gửi: đọc lại request cũ, không sinh trùng. Raw đã nhận nhưng ghi file lỗi: ghi lại raw, không gọi AI thêm.
7. Chrome crash/FFmpeg lỗi: dùng lại HTML. Lỗi JS tại frame muộn: tạo lại đúng cảnh đó và vô hiệu cache segment liên quan.
8. Dừng khi generating/backoff/rendering; mở lại tiếp tục; callback muộn không ghi đè phiên bản mới.
9. Tua tiến/lùi, gọi frame ngoài thứ tự và phát/export cùng thời gian dùng cùng cảnh; không có RAF nền làm thay trạng thái lúc export.
10. Thử một cảnh giao chiến, một cảnh hội thoại, một bản đồ và một sơ đồ/quy trình; xác nhận đường chạy hỗ trợ các trường hợp này. Không suy rộng thành bảo đảm chất lượng mọi phản hồi AI.
11. File xuất giữ cấu hình FPS/độ phân giải, có giọng/phụ đề/nhạc/SFX đúng pipeline; export lỗi không được báo hoàn thành.
12. Dự án SVG cũ và chế độ kho vẫn mở/phát/xuất; project mới không gọi nhánh SVG QA.
13. Bốn thể loại × ba cách kể: prompt phân tích/viết/biên tập dùng cùng hợp đồng; không còn xung đột số ứng viên, thứ tự mở đầu hoặc quy tắc một ý = một hình. Thử cả ba kiểu hình để bảo đảm kiểu hình không đổi giọng kể/thể loại.
14. Các mốc 1/2/5/12 phút và nguồn ngắn/dài: lưu đúng mốc người dùng chọn; ngân sách lời trừ pause một lần; số chương/ứng viên co giãn theo thời lượng; báo rõ trường hợp nguồn không đủ. Case 2 phút có nguồn đủ đặt mục tiêu phát triển 108–132 giây theo audio thật, không báo đạt chỉ vì audio có thời lượng dương.
15. Ba nhịp 14/9/6 giây: lựa chọn xuất hiện từ prompt viết đến phân cảnh, một cảnh phủ được nhiều beat lời; đo thời lượng cảnh từ timeline audio. So sánh cùng nguồn/cấu hình khác chỉ pacing, ghi cả ngoại lệ đổi cảnh do nội dung; không dùng tổng thời lượng chia số cảnh để che các cảnh rất ngắn.
16. Xem/nghe các bản thử sáng tác: nhận xét cụ thể ngôi kể, stakes, nhịp tăng căng thẳng, điểm tiết lộ và payoff. Nhãn hook, đủ số chương hoặc JSON hợp lệ không được dùng làm bằng chứng nội dung hấp dẫn. Đây là nghiệm thu phát triển, không thêm tác vụ AI QA hoặc vòng chấm/sửa vào production.
17. Đổi từng cấu hình rồi reload/resume: lượt cũ dùng snapshot cũ, lượt mới dùng lựa chọn mới; phiên bản contract/hash/checkpoint không dùng nhầm template hay HTML của cấu hình khác. Dữ liệu legacy thiếu snapshot không được đóng dấu là đã đáp ứng cấu hình mới.
18. Ma trận 19 control ở mục 18: kiểm từng option và chuyển bật/tắt, có case tương tác một giọng/đa giọng, ASR, SFX, phụ đề, motion, auto-write/auto-export, nhiều phần và cleanup. Chỉ kết luận tương thích sau khi có bằng chứng qua đường chạy mới; test cũ cho Remotion không thay thế nghiệm thu HTML Canvas.

Mỗi lần thử phát triển lưu prompt, raw response, HTML, attempt log và video thật. Kết luận phân biệt rõ “luồng chạy được” với “hình/chuyển động đã được xem và chấp nhận”. Không hứa mọi prompt đều sẽ thành công chỉ nhờ thử lại vô hạn: đầu vào hoặc provider có thể tiếp tục lỗi cho đến khi điều kiện thay đổi.

## 16. Điều kiện hoàn tất thay đổi

Luồng mới được coi đã triển khai đầy đủ khi người dùng có thể viết kịch bản, phân cảnh theo mẫu, dựng HTML một lần cho kết quả đầu tiên chạy được, tiếp tục thử khi lỗi, phát/tua cảnh, xuất MP4 nhiều cảnh và mở lại dự án; cả ba kiểu hình dùng chung cơ chế và không còn QA/chấm điểm/khung mẫu trong đường tạo cảnh mới.

Bốn cấu hình ở mục 17 là phần bắt buộc trong phạm vi bàn giao: thể loại và cách kể được áp dụng nhất quán, thời lượng được lập ngân sách/hiển thị đúng ý nghĩa, nhịp hình điều khiển nhóm lời ngay từ tác giả và ánh xạ sang timeline giọng thực. Phải báo kết quả đo của các case nghiệm thu, không coi việc sửa nhãn UI hoặc đổi renderer là đã sửa xong cấu hình.

Toàn bộ cấu hình trong ảnh ở mục 18 cũng là điều kiện hoàn tất. Bỏ QA hình/chuyển động không xóa ASR do người dùng chọn, không làm mất SFX vì bỏ nodes, không bỏ qua auto-export/auto-write hoặc cleanup Gemini, và không dùng snapshot/key Remotion cũ để xác nhận nhầm kết quả HTML mới.

Không bàn giao chỉ phần prompt hoặc demo HTML độc lập trong khi production vẫn dựng SVG, gọi chấm điểm, chèn khung hoặc bị giới hạn ba lần thử.

## 17. Bổ sung sau audit bốn cấu hình người dùng

Theo yêu cầu người dùng, toàn bộ các phát hiện trong [audit ngày 07/11/2026](motion-four-settings-audit-2026-11-07.md) được đưa vào phạm vi triển khai chính. Thực hiện cùng đợt thay luồng HTML Canvas, từ trước bước viết/phân cảnh đến lưu dự án và xuất video.

### 17.1. Một cấu hình tác giả xuyên suốt pipeline

Lưu snapshot có phiên bản gồm:

```text
videoGenre                 kỹ thuật thể loại người dùng chọn
storytelling               plain | lively | gripping
selectedLength             option thời lượng trên UI
selectedTargetSeconds      mốc giây tương ứng; FULL lưu chế độ riêng
picturePacing              few | medium | many
targetPictureSeconds       14 | 9 | 6
language                   ngôn ngữ lời đọc
visualProfile              history | horror | explainer
authoringContractVersion   phiên bản hợp đồng dùng để viết
```

Nguyên tắc ưu tiên: nguồn quyết định sự kiện và mức chắc chắn; thể loại quyết định cơ chế kể; cách kể quyết định cường độ kỹ thuật trong ngân sách thời lượng; nhịp hình quyết định nhóm lời chia sẻ một cảnh; kiểu hình quyết định nét vẽ. Mỗi cấu hình có trách nhiệm rõ, không dùng một trường để ngầm ghi đè vai trò của trường khác.

Các bước phân tích, viết, biên tập và phân cảnh nhận cùng snapshot/hợp đồng. UI, payload, cache và checkpoint dùng cùng cách chuẩn hóa mặc định. Hợp đồng được dùng để tạo prompt, không trở thành bộ chấm chất lượng hoặc khung hình do code áp đặt.

### 17.2. Thể loại: thống nhất cấu trúc, co giãn theo thời lượng

- Rà bốn bộ `pov`, `witness`, `chronicle`, `verdict` ở cả phân tích/viết/biên tập; gom chỉ dẫn trùng và giải quyết mâu thuẫn trước khi ghép prompt.
- Phán quyết dùng một quyết định số ứng viên trong kế hoạch. Bỏ mâu thuẫn ít nhất hai/ít nhất ba và yêu cầu tối thiểu bốn chương bất kể thời lượng. Số ứng viên phụ thuộc bằng chứng nguồn và ngân sách video, không bịa thêm cho đủ mẫu.
- Mở đầu có một trình tự được tác giả chọn trong kế hoạch: câu hỏi trực tiếp hoặc cold open ngắn dẫn tới câu hỏi. Writer nhận đúng trình tự đó, không bị một contract khác bắt đổi sang mở đầu khác.
- Bản ngắn được gộp các chức năng mở–giới thiệu tiêu chí và so sánh–kết luận trong các phần kể phù hợp. Bỏ quy tắc SOLO bắt mọi stage có chương riêng ở mọi thời lượng.
- Giữ cốt lõi Phán quyết: câu hỏi xuyên suốt, tiêu chí chung, bằng chứng/giới hạn của từng giả thuyết và kết luận có lý do. Mốc ngày, nhãn, câu hỏi lặp và câu nối là kỹ thuật dùng khi hữu ích, không phải thủ tục phải đọc đủ ở mọi phần.
- POV giữ trải nghiệm ngôi thứ hai; Witness giữ lời kể người trong cuộc; Chronicle giữ trục thời gian và bước ngoặt. Spine/motif không buộc thêm mất mát, cái chết, nhân vật, lời thoại hoặc kết cục ngoài nguồn.
- Thay các chỉ dẫn “một ý/một hình”, “bỏ động tác khó” đang chen vào prompt viết bằng yêu cầu kể trọn diễn biến và để AI phân cảnh quyết định nhóm hình theo pacing.

Các điểm sửa chính: `motionGenre.ts`, `motionGenres/*/rules.ts`, các `motion*Story.ts`, `motionWriting.ts`, `motionGenreStage.ts`, `motionPrompt.ts` và nơi ghép prompt trong `motionStoryService.ts`. Các sửa biên tập hiện có cũng phải dùng cùng hợp đồng mới; không giữ một bộ yêu cầu cũ riêng để kéo văn về khuôn cũ.

### 17.3. Cách kể: làm rõ khác biệt trong cùng ngân sách

| Option | Hướng dẫn tác giả mới |
| --- | --- |
| Bám sát nguồn | Kể rõ, tự nhiên, giữ chuỗi nhân quả; hạn chế thủ pháp trì hoãn/nhịp diễn tả bổ sung. Vẫn giữ giọng và cấu trúc cốt lõi của thể loại đã chọn. |
| Sinh động | Dùng chi tiết cụ thể, stakes rõ, chuyển ý có lực, một vòng tò mò phù hợp và phản ứng/diễn biến thuộc nội dung nguồn; kết thúc giải đáp điều đã mở. |
| Cuốn hút tối đa | Tăng độ tương phản, mức đặt cược, thứ tự tiết lộ, đảo chiều/callback và payoff khi nguồn có chất liệu; thay đổi nhịp câu có chủ đích trong cùng mốc thời lượng. |

- Bỏ cách lấy số texture beat, hệ số kéo dài nguồn hoặc tổng pause làm đại diện duy nhất cho mức hấp dẫn.
- Mức cao hơn không mặc nhiên thêm chương/giả thuyết hoặc kéo dài tổng video. Các kỹ thuật phải dùng trong ngân sách được giao.
- Hook phải có nội dung mở và giải đáp cụ thể trong kế hoạch. Các nhãn `open/close` nếu còn lưu chỉ là metadata, không được coi là chứng nhận hấp dẫn.
- Prompt biên tập giữ kỹ thuật kể được chọn khi sửa lỗi sự kiện/ngôn ngữ; không làm mọi cách kể quay về cùng một giọng thuyết trình.
- Thống nhất khoảng nghỉ của preset với ngân sách audio: pause dài hơn phải được tính trước, không cộng chồng lên lượng lời đã dùng hết thời lượng.

Các điểm sửa chính: `motionStorytelling.ts`, helper `motionStorytelling.ts`, `motionGenres/*/rules.ts`, `motionStoryService.ts`, phần biên tập và layout giọng. Không thêm vòng AI chấm sức hút sau khi tạo cảnh.

### 17.4. Thời lượng: ngân sách rõ và phân biệt mốc chọn với thực tế

Lưu riêng `selectedTargetSeconds`, `plannedDurationSeconds`, `estimatedSpeechSeconds`, `plannedPauseSeconds`, `actualAudioSeconds` và căn cứ tốc độ đọc `speechRate`/`speechRateSource`.

1. Mốc cố định như 2 phút giữ giá trị người dùng chọn là 120 giây. Chế độ FULL được giải quyết riêng theo nguồn, không gán thành mốc cố định.
2. Với nguồn ngắn, AI phân tích nêu khả năng phát triển trong phạm vi nguồn và thời lượng dự kiến. Bỏ clamp âm thầm khiến chọn 120 giây lại được coi như chọn 60 giây. Nếu không đủ chất liệu, thông báo rõ mục tiêu dự kiến ngắn hơn; không bịa hoặc lặp để giả vờ đủ thời lượng.
3. Phân bổ tổng thời gian cho mở, diễn biến, kết và khoảng nghỉ. Tổng ngân sách từng phần phải xuất phát từ ngân sách chung; bỏ các mức sàn chương cộng dồn làm vượt mốc.
4. Ưu tiên tốc độ đọc đã đo theo kênh giọng/ngôn ngữ; nếu chưa đo, lưu rõ đó là ước tính. Tính khoảng lời cần viết sau khi dành thời gian cho pause; không trừ/cộng cùng pause hai lần.
5. Writer và bước biên tập đang có nhận ngân sách tổng/từng phần, viết gọn hoặc phát triển cùng sự việc theo ngân sách đó. Không biến số từ thành mục tiêu cứng làm lời kể đứt nhịp, không ép tốc độ giọng để bù cho kịch bản quá dài.
6. Khi có audio, timeline dùng thời lượng thực. Thay tên/ý nghĩa `durationFits`: “audio sử dụng được” và “gần mốc chọn” là hai thông tin khác nhau. Audio có thời lượng dương chỉ chứng minh có audio, không chứng minh đã đạt mục tiêu.
7. UI/log hiển thị riêng mốc chọn, ước tính và số đo thực. Lệch nhiều phải được thể hiện đúng trạng thái; không tự gửi AI dựng lại HTML vì lệch thời lượng. Việc người dùng chủ động yêu cầu rút/kéo lời thuộc phiên bản kịch bản mới.

Mục tiêu nghiệm thu phát triển: trường hợp nguồn đủ, chọn 2 phút nhắm khoảng 108–132 giây theo giọng thật. Đây là mục tiêu cần chứng minh bằng case thực tế, không phải thêm gate runtime, vòng QA hoặc hứa mọi phản hồi đầu đều nằm trong khoảng. Kiểm thêm 1/5/12 phút và nguồn ngắn để tránh sửa riêng case 2 phút.

Các điểm sửa chính: `resolveTargetSeconds`, `motionWritingChapterCount`, phân ngân sách/ghép prompt và biên tập trong `motionStoryService.ts`/`motionProductionActions.ts`; ý nghĩa trạng thái duration trong `motionProductionService.ts`; pause trong `motionAudioService.ts`; UI số đo.

### 17.5. Nhịp đổi hình: từ tác giả đến timeline giọng

- Bỏ quy tắc một beat lời đọc bắt buộc là một hình. Một beat có thể có nhiều câu; một scene Canvas có thể phủ nhiều beat lời liên tiếp.
- Truyền `picturePacing` và `targetPictureSeconds` ngay vào prompt phân tích/viết và phân cảnh, không chờ đến dựng hình mới đưa vào.
- Với video 120 giây, dùng khoảng 9/13/20 hình cho Thưa/Vừa/Dày làm ngân sách tác giả tham khảo. Sau khi có giọng, thời lượng thực mới quyết định độ dài các đoạn; không lấy 120 giây để mô tả sai một audio đã dài 257 giây.
- AI phân cảnh chọn phạm vi lời chung một cảnh, dự kiến thời lượng và lý do chuyển khi cần: thay sự việc chính, bước thời gian/địa điểm thực sự, chuyển đoạn nội dung hoặc manh mối cần hình riêng.
- Thay góc nhìn, cảm xúc hoặc chủ thể được nhắc đến không tự động bắt tạo file cảnh mới. AI có thể trình diễn diễn biến đó trong cùng Canvas khi phù hợp.
- Khi voice chưa có, dùng ngân sách ngôn ngữ/kênh giọng đã lưu và ghi rõ ước tính. Khi voice đã có, dùng mốc clip/utterance của audio để tính timing; không tiếp tục gọi tốc độ mặc định là số đo giọng thật.
- Compiler ánh xạ các phạm vi lời do AI chọn lên timeline. Không dùng code gộp các hình/actionPlan khác nhau hoặc thay nội dung để đạt số lượng.
- Đo cả thời lượng trung bình, phân bố cảnh ngắn/dài và những ngoại lệ theo nội dung trong nghiệm thu; chỉ trung bình gần 14 giây chưa đủ kết luận lựa chọn Thưa đã đúng.

Các điểm sửa chính: `motionScenePacing.ts`, `motionPrompt.ts`, prompt viết/phân cảnh mới, grouping/timeline, giao diện pacing và cache. Với renderer mới, số scene là số artifact Canvas trên timeline; chuyển động/camera bên trong một scene không được tính thành nhiều lần đổi hình giả.

### 17.6. Lưu, tiếp tục và thay đổi cấu hình

- Snapshot bốn cấu hình và phiên bản hợp đồng là một phần provenance của analysis/script/template. Hash các giai đoạn tính từ đúng input liên quan.
- Đổi thể loại/cách kể/mốc thời lượng làm nội dung tác giả cũ không còn đại diện cho lựa chọn mới. Tạo phiên bản phân tích/kịch bản phù hợp khi người dùng chạy lượt mới; không chỉ thay nhãn trong output cũ.
- Đổi nhịp hình yêu cầu nhóm phân cảnh/template tương ứng mới; dùng lại giọng khi lời không đổi. Một bản HTML đã gắn diễn biến cho phạm vi lời cũ không được coi là tương đương cảnh mới chỉ vì cùng nhân vật.
- Resume tiếp tục snapshot của lượt đang có. UI hiển thị rõ lựa chọn mới áp dụng cho lượt mới; không đóng dấu output cũ là đã đáp ứng lựa chọn mới.
- Dữ liệu legacy thiếu trường mới vẫn mở được; không tự nhận nó đã đạt thời lượng/nhịp mới và không tự sinh lại toàn bộ dự án.

### 17.7. Bản hoàn thành cần bàn giao

Ngoài các artifact HTML và video ở mục 14–16, bàn giao kèm:

1. Hợp đồng tác giả thống nhất cho bốn thể loại, ba cách kể và ba kiểu hình; nêu rõ các quy tắc cũ đã gỡ/thay.
2. Prompt thực tế ở từng bước chứng minh bốn cấu hình được truyền và không còn các chỉ dẫn mâu thuẫn đã audit.
3. Bảng mốc chọn → ngân sách → audio thực; bảng lựa chọn pacing → số cảnh/phân bố thời lượng thực, với phạm vi thử nghiệm được nêu rõ.
4. Bằng chứng lưu/reload/resume giữ đúng snapshot và không trộn phiên bản cảnh.
5. Nhận xét trên nội dung/video thực tế của các case đại diện. Không lấy nhãn hook, test fixture hay việc HTML chạy được thay cho kết luận chất lượng kể chuyện.

Các thay đổi thuộc khâu tác giả, cấu hình và dữ liệu timeline. Giữ yêu cầu tạo trọn cảnh trong một phản hồi, thử lại khi lỗi vận hành, không QA/chấm điểm/sửa hình hoặc thêm vòng AI đánh giá cảnh vào production.

## 18. Tương thích toàn bộ cấu hình trong ảnh khi thay renderer

### 18.1. Phạm vi kiểm tra hiện tại và ràng buộc triển khai

Đã đối chiếu các control trong `MotionVideoCreator.tsx`, request ở `useMotionStudio.ts`, orchestration ở `motionProductionService.ts`/`motionProductionActions.ts`, snapshot ở `motionOutputSettings.ts`, render behavior, phân phần, chữ ký giọng/ASR, sound compiler và lifecycle Chrome/Gemini.

Luồng HTML chưa được triển khai tại thời điểm lập kế hoạch. Bảng dưới là yêu cầu tương thích bắt buộc và các phụ thuộc đã xác định từ source hiện tại, không phải tuyên bố đã thử thành công renderer mới.

### 18.2. Ma trận 19 control

| # | Cấu hình | Trạng thái trong ảnh | Hành vi bắt buộc với luồng mới |
| --- | --- | --- | --- |
| 1 | Cách dựng | Nhánh Remotion đang bật | Lựa chọn dựng cảnh AI chuyển sang HTML Canvas theo kế hoạch; chuyển về chế độ kho vẫn hoạt động. Discriminator phân biệt HTML mới/SVG legacy; nhãn UI phản ánh chức năng dựng mới, không dùng nhãn engine để ngầm ép compiler/encoder cũ. |
| 2 | Kiểu hình | Lịch sử | Cả Lịch sử/Truyện ma/Giải thích dùng cùng pipeline; đặc điểm hình bằng chữ đúng lựa chọn, không đổi thể loại kể và không chèn frame/rig. |
| 3 | Thể loại | Phán quyết | Áp dụng hợp đồng thống nhất ở mục 17 cho phân tích, viết, biên tập, phân cảnh và các phần video. |
| 4 | Thời lượng | Khoảng 2 phút | Mốc 120 giây, ngân sách lời/pause và số đo thực được lưu riêng theo mục 17; không bị nhân thành 120 giây cho mỗi phần khi người dùng chỉ chọn tổng 120 giây. |
| 5 | Số phần | 1 video | Một phần xuất một video; nhiều phần có kế hoạch/chuyển tiếp/nội dung riêng, dùng chung danh tính và phong cách; lưu kết quả từng phần. Số phần không bị âm thầm giảm chỉ vì số chương thay đổi trong hợp đồng bản ngắn. |
| 6 | Ngôn ngữ đọc | Tiếng Anh | Lời, TTS, phụ đề, số/ngày được viết/đọc đúng ngôn ngữ đã chọn; font và chữ trong cảnh theo ngôn ngữ hiển thị của brief. Ngôn ngữ giao diện không tự ghi đè ngôn ngữ video. |
| 7 | Tự động kịch bản | Bật | Bật: sau phân tích đi tiếp viết theo orchestration. Tắt: dừng ở phân tích để người dùng chủ động viết; không tự gọi writer/dựng hình chỉ vì auto-export bật. Hành động chủ động chạy một bước vẫn được hỗ trợ. |
| 8 | Cách kể | Sinh động | Ba option có kỹ thuật kể riêng trong cùng ngân sách theo mục 17; giữ qua biên tập, lưu/tiếp tục và các phần. |
| 9 | Đổi tên | Tắt, giữ tên gốc | Tắt giữ danh tính/tên nguồn. Bật dùng một bảng đổi tên xuyên lời, phân cảnh, chữ trên Canvas, giọng, phụ đề và các phần. Entity/speaker/source ID vẫn ổn định để ánh xạ, không lấy tên hiển thị làm ID. |
| 10 | Kênh giọng | Kênh tên Lịch sử | Dùng đúng hồ sơ giọng và phiên bản/tốc độ đọc của kênh; tên kênh không đồng nghĩa với profile hình. Đổi hình hoặc renderer không tự đổi giọng. |
| 11 | Phân vai giọng | Một giọng | Tắt phân vai: một narrator đọc toàn bộ lời/thoại đúng một lần. Bật: narrator và nhân vật có assignment đúng speaker ID. Số nhân vật vẽ không ép số giọng; số giọng không bắt thêm người vào hình. |
| 12 | Kiểm tra giọng | Tắt | OFF không tự gọi ASR vì đã đổi renderer. ON vẫn chạy quy trình ASR hiện có, lưu trạng thái thực và chỉ dùng lại track đáp ứng tùy chọn. Bỏ QA cảnh không xóa chức năng kiểm giọng người dùng yêu cầu. |
| 13 | Nhạc nền | Tắt | OFF không chọn/tạo/mix nhạc; không còn nhạc từ file cache cũ. Các mood và mức âm lượng khi bật vẫn hoạt động qua pipeline audio; HTML không phát nhạc riêng. |
| 14 | Âm thanh cảnh (SFX) | Bật | Dùng cue/asset/mute/volume của pipeline chung, ánh xạ thời gian theo cảnh/giọng. Bỏ nodes không được làm mất cue. OFF bỏ lớp SFX khỏi mix/preview/export, không tắt giọng. |
| 15 | Nhịp đổi hình | Thưa, khoảng 14 giây/hình | Điều khiển nhóm lời dùng chung Canvas ngay từ tác giả, ánh xạ sang audio theo mục 17; không nhầm nhịp hình với FPS. |
| 16 | Chuyển động cảnh | Bật | ON chạy chuyển động AI. OFF giữ một trạng thái hình tĩnh mỗi cảnh; nhân vật, biểu cảm động, camera và hiệu ứng môi trường cùng dừng theo ý nghĩa master toggle hiện tại. Giọng, phụ đề, thời gian video và chuyển sang cảnh tiếp vẫn chạy. |
| 17 | Phụ đề | Bật | ON hiển thị đúng lời và timestamp trong preview/video; OFF bỏ lớp phụ đề cả khi dùng lại cache. Không bắt AI vẽ lại cảnh chỉ để đổi phụ đề và không xóa chữ vốn là nội dung của cảnh. |
| 18 | Xuất video | Tự động | ON tự đi tới xuất khi các bước cần thiết hoàn tất; OFF giữ preview/tài nguyên để xuất thủ công, không tự chạy FFmpeg/prerender xuất. Không có MP4 tự động khi job bị dừng hoặc vẫn đang retry cảnh lỗi. |
| 19 | Tự xóa chat Gemini | Bật | Giữ đúng tùy chọn và phạm vi hiện có: xóa hoạt động Gemini trong Một ngày qua của tài khoản đang dùng trước khi đóng Chrome AI cho export; OFF giữ lịch sử. Chỉ cleanup sau khi dữ liệu cần thiết đã lưu và các tác vụ AI trong context đã nhả; không xóa giữa một request cần đọc lại. |

Tên “Đổi tên tránh bản quyền” trong UI chỉ mô tả chức năng đổi tên đang có; không đưa một bảo đảm bản quyền vào kết quả hay tài liệu đầu ra.

### 18.3. Các phụ thuộc phải sửa rõ ràng

**A. ASR và giọng là pipeline riêng với QA cảnh.**

- Giữ `asrCheck`, `voiceSettings.multiVoice`, assignment narrator/cast, hồ sơ kênh và metadata giọng trong request/snapshot mới.
- Chữ ký giọng tính từ lời, ngôn ngữ, chế độ giọng, assignment và phiên bản kênh; không dựa vào tên renderer. Cùng lời/cấu hình giọng có thể dùng lại audio khi chỉ đổi hình.
- ASR OFF→ON: audio chưa được kiểm không tự biến thành audio đã đáp ứng yêu cầu; dùng lại hoặc xử lý theo metadata/quy trình giọng hiện có. ON→OFF có thể giữ track đã kiểm.
- Trạng thái ASR `review/unavailable` phải hiện đúng thực tế; việc pipeline đã yêu cầu kiểm không được báo thành mọi câu đã nhận dạng hoàn hảo.
- Không gọi TTS/ASR từ HTML và không xóa các kiểm giọng chỉ vì gỡ score/QA hình.

**B. SFX cần metadata thay thế nodes, không cần khung hình.**

- `compileRemotionSound` hiện dựa vào `spec.scenes`, `sourceBeatIds` và `scene.nodes.entityId`. Luồng HTML phải có compiler cue nhận metadata tác giả độc lập hình.
- Trong cùng phản hồi phân cảnh, thêm sidecar `soundEvents` cho cảnh khi SFX bật: ID ổn định, loại/description, nguồn visible/offscreen, speaker/subject tham chiếu bằng ID ngữ nghĩa nếu cần, mốc tiến độ/câu/utterance hoặc thời gian tương đối, duration và gain.
- Các ID này liên kết sự việc và cue, không ép AI trả node, group SVG, tọa độ, rig hoặc khung người/vật. Nội dung sự kiện âm thanh và mốc hành động được đưa vào mẫu/phụ lục prompt để AI dựng đúng cùng nhịp.
- Giữ data `soundEvents` của script cũ và quyền người dùng mute/đổi asset/volume. Không lọc bỏ cue vì không tồn tại `scene.nodes` trong renderer mới.
- Lập cue từ phản hồi tác giả/phân cảnh đang có và kho âm thanh; không thêm tác vụ AI review/motion/sound sau khi nhận HTML để bù metadata.
- Compiler ánh xạ theo timestamp thật; có mốc câu thì dùng mốc câu, không tuyên bố căn từng từ khi chưa có alignment từng từ.
- Chuyển động OFF không mặc định mute SFX/giọng. Các lớp âm thanh tuân theo lựa chọn của chúng và kế hoạch âm thanh nguồn, không theo việc renderer có vẽ khớp động hay không.

**C. Master chuyển động và phụ đề phải được thực thi bởi host.**

- Chuẩn hóa toggle hiện tại thành một runtime input nhất quán. OFF truyền trạng thái tĩnh của cảnh và dừng RAF/camera/effects; host giữ thời gian hình tĩnh nhưng timeline audio/subtitle vẫn chạy.
- ON truyền thời gian thật vào `renderAt`; renderer không thêm motion mặc định. Một file HTML chỉ được dùng lại cho cả ON/OFF nếu giao ước runtime đã hỗ trợ và snapshot xuất ghi đúng trạng thái hiệu lực.
- Phụ đề là lớp chung ở host/khâu ghép video. HTML vẽ chữ/thẻ được brief yêu cầu, không tự tạo lại phụ đề toàn lời dẫn. Điều này tránh chữ trùng và bảo đảm toggle có tác dụng khi xuất.
- Cache frame/segment phải phân biệt trạng thái motion và trạng thái overlay nếu overlay đã bake vào hình. Nếu phụ đề được ghép ở bước cuối, segment nền có thể dùng lại khi chỉ đổi phụ đề.

**D. Nhiều phần và đổi tên phải đi qua artifact mới.**

- `motionCarryGen` hiện biết state Remotion. Bổ sung state HTML để mang theo style/identity bằng chữ và mapping tên/speaker, nhưng không mang cảnh cũ thành cảnh đã dựng của phần mới.
- Phân tích lập số phần theo yêu cầu trước khi chọn số chương trong từng phần. Nếu nguồn không đủ số phần có ý nghĩa, trả số phần dự kiến cùng lý do rõ; không dùng clamp theo số chương để âm thầm đổi lựa chọn.
- Thời lượng chọn là ngân sách tổng như cách hiển thị số phút/phần hiện tại, sau đó phân cho từng phần. Lưu `totalTargetSeconds` và `partTargetSeconds`; tổng các phần không tự nhân theo số video.
- Mỗi phần có namespace cảnh/utterance/cue, output, cache và checkpoint riêng; cùng nhân vật giữ ID cấp dự án. Phần sau nối trạng thái đã được kịch bản thiết lập, không suy lại từ ảnh.
- Đổi tên ON ghi bảng đổi tên trước bước viết; dùng cùng bảng cho template/labels. OFF không vô tình dùng renameMap của phiên bản trước.

**E. Tự động hóa và xóa Gemini là các bước orchestration.**

- Tách rõ `autoContinue`/`analyzeOnly`, `autoExport`, thao tác chạy thủ công và trạng thái người dùng đã dừng. Các cờ nội bộ `autoRun` không được âm thầm biến auto-export OFF thành ON cho một pipeline mới.
- Trước khi render tự động, lưu đủ prompt/raw/HTML, template, metadata cue/voice và checkpoint. Không dùng điều kiện chỉ có `script.gen.remotion` để quyết định đường HTML được xuất hay bị bỏ qua.
- Auto-export OFF không tự sinh MP4 qua cơ chế prerender nền. Khi người dùng chủ động xuất, dùng cùng snapshot/cài đặt hiệu lực như xuất tự động.
- Cleanup Gemini là tùy chọn destructive đã có; giữ default OFF và mô tả đúng phạm vi “Một ngày qua” hiện tại. Không gọi thao tác cleanup thật trong test tự động hoặc chỉ vì người dùng yêu cầu rà code.
- Giữ khóa active-use của browser context để request viết/SEO/phân cảnh/dựng đang chạy được hoàn tất. Hoãn cleanup nếu còn tác vụ AI; không đóng browser context đang phục vụ một job khác.
- Chrome dùng render Canvas phải có vòng đời tách rõ khỏi Chrome AI, để cleanup/đóng Chrome AI không làm mất trang render giữa lúc chụp frame.
- Lỗi HTML xuất hiện muộn sau cleanup: tạo lại từ prompt/HTML/raw/checkpoint cục bộ trong room mới; không phụ thuộc lịch sử đã xóa và không làm lại các cảnh đã hoàn tất.
- Giữ hành vi resume hiện tại cho phép cập nhật riêng tùy chọn cleanup khi lượt đã dừng; các cấu hình nội dung vẫn dùng snapshot của lượt. Ghi riêng tùy chọn vận hành hiệu lực vào log.

### 18.4. Snapshot, cache và phạm vi phải làm lại

Phân biệt snapshot tác giả, snapshot audio, snapshot render và cờ vận hành. `motionOutputSettings` hiện chưa là snapshot đầy đủ của 19 control; không chỉ thêm `renderer` rồi coi toàn bộ lựa chọn đã được bảo toàn.

| Cấu hình đổi | Giai đoạn chịu ảnh hưởng |
| --- | --- |
| Thể loại/cách kể/mốc thời lượng/ngôn ngữ/đổi tên | Kế hoạch và lời/template bị ảnh hưởng phải tạo phiên bản phù hợp; audio/subtitle/cảnh phụ thuộc nội dung mới được cập nhật. |
| Số phần | Lập lại phạm vi từng phần, timeline và output tương ứng; dùng lại danh tính/mapping ổn định. |
| Kiểu hình/cách dựng | Thay template phong cách và artifact/render tương ứng; audio dùng lại khi lời/cấu hình giọng không đổi. |
| Nhịp đổi hình | Nhóm lời, scene template, HTML/timeline liên quan; audio dùng lại nếu lời không đổi. |
| Kênh giọng/phân vai | Audio và timestamp/speaking/subtitle/cue; chỉ sửa template/HTML nếu nội dung tác giả thực sự đổi. |
| ASR | Quy trình/metadata giọng; không tự sinh lại hình hoặc lời chỉ vì đổi toggle. |
| Motion | Runtime và cache hình/video; dùng lại HTML hỗ trợ toggle, không bắt AI vẽ lại để tắt chuyển động. |
| Phụ đề | Overlay/mix xuất và cache liên quan; không sinh lại HTML. |
| SFX/nhạc/volume/mute/asset | Cue/mix/audio preview/video xuất; không sinh lại hình. |
| Tự viết/tự xuất/xóa chat | Điều phối, điểm dừng và lifecycle; không làm stale HTML/audio chỉ vì đổi cờ vận hành. |

Giữ aspect/FPS/quality/encoder ngoài ảnh trong snapshot xuất. Cập nhật các nhánh đang nhận diện engine Remotion để không áp nhầm compiler SVG, kiểm cutout hoặc khóa CPU cũ lên artifact HTML. Nếu renderer mới chỉ hỗ trợ CPU trong phiên bản đầu, trả đúng cấu hình hiệu lực; không báo đã dùng lựa chọn encoder khác khi thực tế chưa hỗ trợ.

### 18.5. Ma trận nghiệm thu tương thích trong phát triển

1. Ghi nhận đủ 19 control từ UI qua request, snapshot và output; reload và resume giữ đúng giá trị. Kiểm cả mặc định và giá trị lưu tường minh.
2. Với ba kiểu hình, chạy case ảnh làm baseline: Phán quyết, 2 phút tổng, 1 video, tiếng Anh, tự viết ON, Sinh động, đổi tên OFF, đúng kênh Lịch sử, một giọng, ASR OFF, nhạc OFF, SFX ON, nhịp Thưa, motion ON, phụ đề ON, auto-export ON và cleanup ON.
3. Thử ON/OFF độc lập của tự viết, phân vai, ASR, SFX, motion, phụ đề, tự xuất, đổi tên, cleanup; mọi lựa chọn nhạc/kênh/ngôn ngữ/số phần có ít nhất case đại diện. Không tuyên bố đã thử mọi tích Descartes của các control.
4. Kiểm các cặp dễ hỏng: một giọng/đa giọng × ASR; SFX × motion; phụ đề ON→OFF sau khi có cache; nhạc ON→OFF; tự viết OFF × tự xuất ON; nhiều phần × đổi tên; cleanup × retry/resume.
5. Bật ASR dùng dependency fixture để kiểm điều phối và một case giọng thực riêng khi triển khai. Không gọi ASR live chỉ để chứng minh control không bị xóa; không gắn kết quả fixture thành chất lượng nhận dạng thật.
6. Cleanup dùng browser/service fixture kiểm đúng cờ, trì hoãn, ghi dữ liệu trước và không gửi khi OFF. Test này không xóa lịch sử Gemini thật.
7. Kiểm SFX trên metadata HTML không có `nodes`, có cue ở tiến độ/câu/utterance, giữ mute/asset override và cùng timestamp giữa preview/export.
8. Motion OFF: hình từng cảnh giữ tĩnh, giọng/subtitle/timeline tiếp tục; ON phát đúng HTML AI. Export cùng thời điểm khớp preview với cùng snapshot.
9. Tự xuất ON tạo đúng file một lần sau khi đủ bước; OFF không tự tạo MP4. Dừng/hủy/backoff không kích hoạt một tác vụ xuất muộn.
10. Dự án nhiều phần có số output và ngân sách tổng đúng kế hoạch; đổi tên, speaker, phong cách và continuity giữ qua từng phần; resume không trộn scene/cache hai phần.
11. Xuất một case nhiều cảnh có giọng/SFX/phụ đề và một case tĩnh, nhạc/SFX/phụ đề OFF; xem/nghe file thật để xác nhận các lớp được bật/tắt. Báo rõ những tổ hợp chưa chạy live.

Các kiểm thử này diễn ra khi triển khai và nghiệm thu thay đổi, không trở thành QA cảnh trong pipeline người dùng. Chỉ được kết luận các cấu hình vẫn hoạt động sau đổi renderer khi có bằng chứng qua đường HTML Canvas mới.
