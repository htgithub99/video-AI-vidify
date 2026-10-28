# Plan tích hợp Remotion vào Video Motion

> Plan sửa gốc bổ sung ngày 27/10/2026: [bố cục, trạng thái và cấu hình chuyển động](motion-remotion-layout-settings-root-fix-plan-2026-10-27.md). Dựa trên audit đủ 17 cảnh của video Mâm Cơm Cúng Bưng Vào Hiên: tách nhân vật/hiệu ứng cảnh/camera, sửa tỷ lệ/contact/mount và liên tục địa điểm, kiểm UI→snapshot→preview→export cho hai nhánh. Bản bổ sung hiện chỉ là kế hoạch, chưa triển khai; các kết quả kiểm kỹ thuật ở mục 16 không chứng minh đã đạt các tiêu chí hình ảnh mới này.


> Cập nhật triển khai ngày 27/10/2026: hai phương thức đã có runtime; xem mục 16 về phạm vi và kết quả kiểm. Các phần mô tả hiện trạng chưa có Remotion bên dưới là ảnh chụp lúc lập plan ngày 26/10, không phải trạng thái hiện tại.
Ngày rà soát: 26/10/2026. Trạng thái: **đề xuất sau đọc code và tài liệu Remotion; chưa triển khai**. Cập nhật theo yêu cầu: dựng bằng Remotion, thiết kế nhân vật theo nội dung từng dự án, không giới hạn lịch sử vào một bộ nhân vật cố định.

Cập nhật cấu hình ngày 27/10/2026: bổ sung đặc tả UI hai lựa chọn, payload, hành vi lưu/khôi phục/chuyển phương thức và tiêu chí nghiệm thu tại mục 4.

Tài liệu này điều chỉnh [đề xuất Room Chat + Remotion](motion-remotion-room-chat-explainer-plan-2026-10-26.md) theo code đang chạy. Bổ sung nhánh dựng hình; giữ các sửa lỗi và nhánh kho hiện tại. Lượt lập plan chỉ sửa tài liệu, không cài package, sửa runtime, khởi động lại backend hoặc tạo video.

## 1. Phương án chọn

Thêm cấu hình **Phương thức dựng video** trong phần cài đặt hình ảnh, ngay trước cấu hình gói tài nguyên/phong cách. Đây là lựa chọn bắt buộc một trong hai; không dùng hai công tắc có thể cùng bật:

| Lựa chọn trên UI | Cách làm | Bộ dựng |
|---|---|---|
| **Sử dụng kho tài nguyên** — mặc định | Chọn gói → lấy nền, mảnh, nhân vật, đạo cụ → ghép theo điểm đặt/recipe; giữ kho đóng | Canvas/Puppet hiện tại |
| **Dựng bằng Remotion** | Room chat khai nhân vật, không gian, vật và quan hệ của từng cảnh → compiler dựng cây cảnh React/SVG theo dữ liệu → Remotion tạo hình, bố trí lớp, chạy timeline và xuất video | Remotion mới |

Chọn Remotion sẽ hiện **Phong cách hình** và cấu hình chuyển động/phụ đề/review. Profile đích: **Lịch sử — minh họa nét vẽ**, **Truyện ma — minh họa trầm**, **Giải thích — sơ đồ**. Chỉ hiện profile dùng thật sau khi hình và bố cục đã đạt nghiệm thu; không coi profile là danh sách nhân vật bắt buộc.

Remotion là bộ dựng chính của nhánh mới: component React/SVG tạo người, đồ vật, không gian, nhãn và sơ đồ theo dữ liệu. Bộ công cụ vẽ/đặt lớp được tái sử dụng; số lượng và tạo hình nhân vật không bị đóng theo hai gói dân gian. Artwork SVG/ảnh bổ sung chỉ là nguồn hình cho thành phần khó biểu diễn, không phải bước bắt buộc phải tạo sẵn cả bộ hình trước khi bắt đầu dựng. Remotion không tự suy luận ngoại hình lịch sử hoặc tự sinh một bức tranh chi tiết từ tên nhân vật.

Hai lựa chọn dùng chung nguồn, DNA, hợp đồng nội dung, kịch bản, giọng, SEO, room chat, lưu tiến độ và kết quả. Các tổ hợp đích: `library → canvas`, `remotion → remotion`. Nội bộ nhánh Remotion có thể kết hợp component vẽ và media đã chuẩn hóa trong cùng composition; không thêm lựa chọn “Minh họa AI theo dự án” riêng trên UI. V01–V09 là phần tích hợp nền; V10–V13 ở mục 15 kiểm khả năng tạo hình đa dạng và sửa phần thiếu theo từng cảnh. Chưa cung cấp `library → remotion` hoặc trộn renderer trong cùng dự án.

### Giá trị đối với tool

- Video truyện ma đang làm tiếp tục dùng hai gói kho và các bản sửa vị trí/ngoại hình đã có.
- Thuyết minh/lịch sử/thần thoại dùng người và không gian đa dạng theo nội dung; bản đồ, timeline, sơ đồ và nhãn là các loại cảnh bổ sung. Không giới hạn video lịch sử thành bản đồ/người que hoặc ép vào bối cảnh dân gian.
- Đạo diễn vẫn ưu tiên hình đại diện đúng lời kể; cảnh mở cửa có thể dùng người đứng cạnh cửa. Tính đúng của người, vị trí, vật đầu mối, màu được nhấn mạnh và quan hệ quan trọng phải giữ ở cả hai lựa chọn.
- Renderer mới giải quyết cách biểu diễn và xuất hình. Việc AI hiểu sai chủ thể, địa danh, số lượng hoặc lời kể cần được xử lý trong hợp đồng ngữ nghĩa và bộ kiểm tương ứng.

## 2. Hiện trạng đã kiểm từ code

| Điểm nối hiện có | Kết quả đọc code | Việc cần đối ứng |
|---|---|---|
| `src/features/motion/hooks/useMotionStudio.ts` | Có PersistedState, DEFAULTS, compileStateKey; nhiều chỗ đánh giá sẵn sàng trực tiếp qua `gen.puppet`, phiên bản và storyboard | Thêm snapshot chế độ, thay kiểm sẵn sàng bằng dispatch; đưa chế độ vào request/signature phụ thuộc hình |
| `src/features/motion/components/MotionVideoCreator.tsx` | Có chọn gói, ảnh tham chiếu, chuyển động, review ảnh; dựng và preview dựa Puppet/ME | Thêm lựa chọn trước gói; chỉ hiện điều khiển có nghĩa với nhánh đã chọn |
| `src/lib/motionProduction.ts` | `assertMotionProductionMode` hiện chỉ nhận drawingMode `2d`; type còn tên `3d` không chứng minh luồng production 3D chạy được | Giữ drawingMode `2d`; thêm visualMode riêng, không dùng `3d` làm mã Remotion |
| `src/server/services/motionProductionService.ts` | Preflight kiểm kho khi có closed style; sau phân tích gọi recoverMotionIllustrationPlan; media chạy cảnh/voice cùng SEO | Dispatch khả năng minh họa và dựng cảnh theo chế độ; giữ orchestration/checkpoint chung |
| `src/server/services/motionProductionActions.ts` | analyze mặc định style kho; scenes gọi buildScenesPuppet; compile gọi compileStorySpec; render validate MotionSpec.shots | Đổi các cửa vào qua adapter; tránh nhánh Remotion vô tình nhận mặc định style kho |
| `src/server/services/motionStoryService.ts` | analyze/chapter chèn capability của kho; có pool và runMotionAi, xử lý room/response/recovery | Phân giải capability theo chế độ ở cả phân tích, biên kịch và cảnh; dùng hạ tầng AI chung |
| `src/server/services/puppet/storyboard.ts` | Đã chia nhịp theo ranh giới lời, quote/cue, nguồn và nhóm prompt; có resume/repair | Tái sử dụng nguyên tắc và phần thuần dùng chung; prompt/READ kho vẫn thuộc nhánh kho |
| `src/server/services/motionAiContractService.ts` | Đã có assess/repair/checkpoint/budget và đếm không tiến triển | Đăng ký schema/artifact mới, sửa từng mục thay vì tạo thêm vòng retry toàn pipeline |
| `src/server/services/motionDirectorService.ts` | Compiler dùng duration/voice clips; ưu tiên puppetSceneShot, có graphicParams, subtitle và SFX | Dùng chung timeline chuẩn; compiler mới xuất contract Remotion, không gửi vào compiler Puppet |
| `src/server/services/motionAudioService.ts` | Có track, clip start/end, chất lượng, words tùy ASR và cache | Giữ TTS/mix đang có; word timing là khả năng tùy nguồn, cần adapter trước khi bật kinetic |
| `src/features/motion/components/MotionSpecPlayer.tsx` | Preview gọi ME.createRenderer và preload Puppet hoặc phát MP4 | Thêm preview Remotion dùng đúng composition xuất video |
| `src/server/services/motionRenderService.ts` | Render HTML/Canvas qua Playwright, chunk/cache, encode, job/cancel, publication | Giữ đường Canvas; thêm renderer adapter sau hợp đồng job chung |
| `motion-engine/history.js`, `motion-engine/scenes.js` | Đã có geomap/map/timeline và graphic templates | Kiểm phần toán/địa danh/ngữ nghĩa có thể tái sử dụng; không gọi Remotion là bản đồ đầu tiên của tool |
| `package.json`, `src/remotion/` | Chưa có dependency Remotion hoặc thư mục composition tại thời điểm đọc; React hiện 18.3.1 | Thử tương thích/bundle/build trước khi công bố chế độ mới |

`salvageRoomJson` và `extractMotionRoomJson` là hàm nội bộ trong motionStoryService, không phải API public cho service mới import trực tiếp. Lượt mới gọi `runMotionAi` cùng hợp đồng đã đăng ký để thừa hưởng parse/envelope/room recovery. Chỉ tách hàm dùng chung nếu thực sự có caller thứ hai và có kiểm hồi quy.

## 3. Những điểm cần sửa trong plan cũ

| Đề xuất ban đầu | Điều chỉnh |
|---|---|
| Đánh dấu khảo sát/contract sẵn sàng hoàn toàn | Trạng thái là đề xuất; cần thêm dispatch, persistence, preview/render/cancel và schema trước triển khai |
| Ba lượt AI cố định, 40–80 câu bất kể thời lượng | Chia theo sự kiện và budget đầu vào/đầu ra; số phần phụ thuộc nội dung và thời lượng |
| AI trả x/y, zoom, delayFrame và startFrame | AI trả entity/anchor/quan hệ/cue ngữ nghĩa; solver và compiler tính tọa độ, camera, frame sau khi có audio |
| Địa danh thiếu tự về tâm bản đồ | Xử lý alias, kiểm địa danh và phạm vi; dùng sơ đồ có nhãn khi không cần tọa độ chính xác. Không vẽ một vị trí sai như thể đúng |
| Chỉ ba bản đồ và vài role/action đóng | Capability chia theo nhóm cảnh; địa danh/cast dùng ID dữ liệu, không hardcode chỉ vua/tướng/thần. Bản đồ có thời kỳ và nguồn; nền địa lý hiện đại không tự thành biên giới lịch sử |
| Thay TTS bằng nhà cung cấp mới | Dùng audio pipeline đang chạy; chỉ thêm adapter word timing khi cần |
| Kinetic từng chữ, spring nảy, chiến trận mặc định | Là tùy chọn profile. Giữ cấu hình sub không nền, chuyển động nhẹ và tốc độ dễ chịu; truyện ma dùng hình tĩnh |
| JSON hỏng khôi phục rồi coi là thành công | Parse được chỉ là bước đầu; kiểm đúng target/evidence/enum và nhận riêng phần hợp lệ |
| Thiếu hạng mục render workflow | Thêm asset loading, preview chung composition, cancel, giới hạn tài nguyên, checkpoint, audio mix một lần và publish nguyên tử |

Không xác nhận độ giống kênh Unknown Frequencies từ tài liệu mô tả. Cần bảng ảnh tham chiếu được duyệt theo từng loại cảnh để nghiệm thu hình, tỷ lệ và nhịp; không tự đặt tiêu chí “giống hoàn toàn”.

## 4. Cấu hình, snapshot và đổi chế độ

Đề xuất các trường (tên cuối chốt khi viết type):

```ts
type MotionVisualMode = "library" | "remotion";
type MotionRenderEngine = "canvas" | "remotion";
type MotionVisualSettings =
  | { version: 1; mode: "library"; engine: "canvas"; packId: string; assetRevision?: string }
  | { version: 1; mode: "remotion"; engine: "remotion"; profileId: string; componentRevision: string; projectVisualRevision?: string; motion: "static" | "gentle"; captions: "plain" | "word_highlight" };
```

Đây là đặc tả đề xuất, chưa phải type runtime. `stylePreset`/pack của dự án cũ vẫn có adapter; cấu hình mới có một nơi chuẩn hóa, không giữ hai giá trị nguồn trái nhau.

### 4.1. Cấu hình hiển thị trên UI

```text
Phương thức dựng video
┌───────────────────────────────┬───────────────────────────────┐
│ ◉ Sử dụng kho tài nguyên      │ ○ Dựng bằng Remotion          │
│ Ghép hình có sẵn theo gói     │ Dựng hình theo kịch bản        │
└───────────────────────────────┴───────────────────────────────┘

Chọn kho:      Gói tài nguyên [Tối giản mặt nạ / Chibi màu dân gian]
Chọn Remotion: Phong cách hình [Các profile đã nghiệm thu]

Cấu hình dùng chung: AI biên kịch · AI dựng hình · Giọng đọc
                    Chuyển động · Phụ đề · Review ảnh
```

- Hai item nằm cùng một hàng trên màn hình đủ rộng, cùng chiều cao; màn hình hẹp xuống một cột. Có nhãn ngắn, mô tả một dòng và trạng thái được chọn rõ. Dùng radio group truy cập được bằng bàn phím, không phải hai nút khởi chạy riêng.
- Chọn kho: hiện hai gói hiện có và các cấu hình tham chiếu của gói. Chỉ chọn từ kho theo chính sách đang có; không tự sinh thêm hình.
- Chọn Remotion: hiện phong cách hình đã hỗ trợ; không hiện bộ chọn gói dân gian như một điều kiện bắt buộc. Nhân vật/bối cảnh/đồ vật dựng theo dữ liệu câu chuyện, với continuity của entity tái xuất hiện.
- Review ảnh là cấu hình chung `aiReview`, hiển thị ở cả hai lựa chọn. Giữ giá trị khi chuyển phương thức; renderer của phương thức đang chọn cung cấp ảnh review. Không tạo hai cờ review độc lập dễ lệch nhau.
- AI biên kịch, AI dựng hình, nguồn, thời lượng, giọng, tỷ lệ, chất lượng xuất vẫn dùng cấu hình chung hiện có. Chuyển động/phụ đề dùng lựa chọn tương thích từng nhánh; chuyển động nhẹ/tĩnh và sub không nền theo preset đã có. Không giới thiệu animation mới như một mặc định khi đổi phương thức.
- Trước khi nhánh mới đạt gate triển khai: chỉ được hiện Remotion ở trạng thái chưa khả dụng cùng lý do cụ thể, hoặc ẩn theo capability. Khi đã đạt gate, người dùng chọn và Tạo video bằng cùng nút đang dùng.
- Phần tóm tắt trước Tạo video và thông tin dự án hiển thị phương thức + gói/profile đã chọn; log thuộc mục Dựng cảnh ghi rõ phương thức một lần rồi tiến độ cảnh `i/N`.

### 4.2. Cấu hình chuẩn và payload

- Một trường chuẩn `visualSettings: MotionVisualSettings` lưu phương thức cùng cấu hình riêng. `mode` quyết định nhánh; `engine` được chuẩn hóa theo tổ hợp hỗ trợ, UI không cho chọn một renderer khác độc lập.
- `aiReview` và các thiết lập chung vẫn ở cấu hình chung hiện có; không chép thêm vào từng biến thể `visualSettings` rồi giữ hai nguồn giá trị.
- UI có thể nhớ gói/profile người dùng chọn gần nhất để đổi qua lại khi chưa chạy. Chỉ biến thể đang chọn được gửi vào production; cấu hình đang ẩn không được lọt vào prompt hoặc kiểm sẵn sàng của nhánh kia.
- Backend chuẩn hóa và kiểm cấu hình trước request AI đầu tiên; mode/engine/profile không tương thích phải được báo ở cấu hình, không tự đổi sang phương thức khác.
- Snapshot phương thức và revision đi xuyên suốt phân tích → kịch bản → cảnh → compile → preview → review → export → kết quả; các endpoint chạy từng bước cũng dùng cùng đường chuẩn hóa.
- API/cấu hình dự án cũ thiếu trường mới mặc định nhánh kho. Cấu hình đã lưu là Remotion nhưng runtime chưa hỗ trợ phải báo không khả dụng, không lặng lẽ coi như dự án kho.

### 4.3. Hành vi khi tạo mới, tải lại và chuyển phương thức

1. Dự án mới hoặc dự án cũ không có trường mới mặc định **Sử dụng kho tài nguyên**. Dự án đã lưu lựa chọn thì khôi phục đúng phương thức, gói/profile và snapshot tài nguyên đã chọn. Thứ tự migration trước tính hash phải được kiểm với input cũ.
2. Nhánh kho hiện chọn gói/ảnh tham chiếu và review ảnh như hiện tại. Nhánh Remotion hiện profile/chuyển động/sub/review; không gửi stylePreset kho còn ẩn trong form vào bước phân tích. Chính sách artwork bổ sung theo capability/provider nằm trong snapshot nhánh mới; chưa có adapter thì chưa cho sinh ảnh như một lựa chọn dùng được.
3. AI biên kịch và AI dựng hình tiếp tục dùng hai nhóm cấu hình đã có. Nhánh mới không thêm một nhóm nhà cung cấp thứ ba.
4. Cấu hình review ảnh vẫn dùng `aiReview`; tắt chỉ bỏ gửi ảnh cho AI. Kiểm dữ liệu, render ảnh được và vị trí quan trọng luôn chạy. Bật dùng renderer đúng nhánh để chụp ảnh trước khi gửi AI.
5. Khi đang chạy, khóa thay đổi chế độ. Muốn chuyển thì dừng tác vụ theo luồng hiện có; không tự hủy hoặc dựng lại chỉ vì reload trang.
6. Đổi chế độ khi rảnh: giữ nguồn/ledger/DNA nội dung và kịch bản còn hợp lệ, đánh dấu phần hình/compiled/render preview cũ không còn khớp. Giọng được dùng lại khi chữ, speaker, voice/delivery/signature thực tế vẫn tương thích. SEO giữ nếu nội dung không đổi; cập nhật mốc chapter khi timeline đổi.
7. Tách phần ràng buộc hình trong DNA khỏi dữ kiện/nội dung. DNA cũ đã ràng buộc theo kho cần tái kiểm đúng phần đó khi đổi chế độ, không tuyên bố mọi DNA có thể dùng nguyên vẹn.
8. Ghi cấu hình chuẩn hóa vào production input, analysis settings, script generation, compiled artifact và result manifest. Cả request thủ công, Tạo video, Tiếp tục, phần tiếp của series, thumbnail và tải lại dự án phải đọc cùng snapshot.
9. `strictProvider`/lựa chọn AI vẫn giữ nguyên ý nghĩa. Không tự đổi chế độ hình để né lỗi kho hoặc Remotion.

### 4.4. Tiêu chí nghiệm thu riêng cho cấu hình

| Tình huống | Kết quả phải đạt |
|---|---|
| Chọn Sử dụng kho tài nguyên | Hiện gói kho; request/capability/readiness/scenes/preview/export đều qua nhánh kho |
| Chọn Dựng bằng Remotion | Hiện profile; không bị yêu cầu chọn spot/recipe/gói kho, preview và export cùng composition Remotion |
| Đổi qua lại trước khi chạy | Nhớ lựa chọn riêng cho form; payload chỉ có biến thể đang chọn, review và cấu hình chung giữ đúng |
| Tải lại hoặc Tiếp tục dự án | Khôi phục phương thức từ snapshot, giữ log/checkpoint; không tự khởi chạy job đã dừng |
| Đang chạy rồi đổi phương thức | Điều khiển bị khóa; không đổi engine/ảnh của job giữa chừng |
| Đổi phương thức sau khi đã có sản phẩm | Kết quả cũ vẫn gắn snapshot cũ; nhánh mới đánh dấu hình/compiled/preview cần dựng lại theo dependency, giữ voice/nội dung còn hợp lệ |
| Một nhánh lỗi hoặc chưa sẵn sàng | Diagnostic đúng nhánh và phần thiếu; không âm thầm chuyển phương thức hoặc sử dụng ảnh cache của nhánh kia |

## 5. Luồng xử lý đích

```text
Nguồn → ledger/DNA nội dung → dàn ý → kịch bản đã khóa
                 │                          │
          capability theo mode             ├─ Voice + chất lượng + timing
                 │                          ├─ SEO
                 ▼                          └─ Nhịp hình/sự kiện
       Kiểm khả năng biểu diễn                      │
                 ├─ library: kho/recipe/spot         │
                 └─ remotion: scene graph/component │
                                                    ▼
       Semantic scene plan + identity/appearance/continuity
                 ├─ library → Puppet layout/frame → MotionSpec → Canvas
                 └─ remotion → scene graph/solver → Remotion contract → Composition
                                                    │
                       Preview/ảnh QA cùng renderer ─┤
                                                    ▼
                       Job xuất video → mix → kiểm media → publish → kết quả
```

Thứ tự hình và audio có thể chạy song song sau khi có nội dung cần thiết. Frame cuối và đổi cảnh phải dựa timeline thật; không bắt AI làm lại kịch bản chỉ để vừa số frame ước tính.

### Các điểm dispatch bắt buộc

- **Preflight:** khả năng renderer/package/font/media tool; kho chỉ kiểm inventory nhánh kho. Nhánh mới kiểm component/profile/map cần thiết.
- **Analysis/chapter:** cung cấp visual capability đúng chế độ thay cho closed pack prompt ở mọi caller, kể cả folk rewrite/repair.
- **Readiness:** library dùng recoverMotionIllustrationPlan hiện có; remotion dùng evaluator cùng hợp đồng kết quả chung, tránh mọi cảnh Remotion đi qua kiểm chair/spot của Puppet.
- **Scenes:** buildScenesPuppet giữ nguyên adapter kho; buildRemotionScenes mới nhận scene contract riêng.
- **Compile/preview/render/stills:** union theo discriminator. Không ép Remotion thành MotionSpec.shots giả rồi lặng lẽ chuyển thành quote khi thiếu cảnh.
- **Resume/series/thumbnail/result:** tìm artifact theo mode và revision. Ảnh thumbnail dùng composition/frame thật của nhánh mới, không gọi API đọc Puppet frame cho cả hai.

## 6. Hợp đồng hình: AI khai nghĩa, code đặt vị trí

Tách hai artifact có phiên bản:

### 6.1. Semantic scene plan — kết quả AI

- `sceneId`, `visualUnitId`, nguồn `lineId` và cue/trích dẫn; không dùng index mơ hồ sau khi biên tập lời.
- `kind`: đại diện nhóm `illustration`, `map`, `timeline`, `diagram`, `comparison`. Chỉ gửi các kind đã triển khai trong request.
- `entities`: tham chiếu cast/prop/group ID; số lượng, nhãn, nhận dạng/appearance, xuất hiện/tàng hình theo lời. Crowd tổng quát phải được phân biệt với đúng ba người cụ thể.
- `relations`: beside, inside, behind, on, heldBy, at; ID đối tượng đích và bằng chứng; phân biệt bắt buộc và lựa chọn minh họa phụ.
- `location`, `timelineKey`, `stateBefore/stateAfter`: giữ cùng bố cục khi trở lại nơi cũ, tách hồi tưởng, không tiết lộ ma trước lúc lời kể cho thấy.
- `mapIntent`: địa danh ID, thời kỳ, tuyến đi/sự kiện và cue; nguồn địa lý lấy từ catalog chuẩn, AI không bịa lat/lon.
- `cameraIntent`: establish, show_relation, show_clue, reaction; mức độ động bị chặn bởi profile.
- `soundIntent`: tùy chọn từ nhóm âm thanh cho phép, không URL/file do AI bịa.

Ngoại hình theo [bản sửa mới](motion-horror-appearance-fix-2026-10-26.md): gắn màu với đúng bộ phận và chủ thể có bằng chứng; giữ identity và trạng thái qua cảnh. Chuyển logic trạng thái dùng chung khi có caller thật ở các nhánh; rig và cách vẽ khuôn mặt vẫn theo từng renderer/profile.

### 6.2. Render contract — code biên dịch

- Metadata: schema/compiler/component/asset revision, visual mode, engine, profile, aspect, fps và kích thước từ quality hiện tại.
- Scene range `[startFrame, endFrame)`; nguồn cue đã resolve từ audio. Biên chung chỉ lượng tử hóa một lần để tránh frame trống/trùng và trôi thời gian.
- Geometry: bounds, anchors, transforms, z-order, scale, vùng tránh, camera path. Không chỉ kiểm hai tâm người không trùng nhau; cần kiểm vật đỡ/che khuất và vùng phụ đề.
- Components/assets: ID/hash nội bộ đã resolve, phông chữ, map topology và phụ kiện đúng profile; manifest khả dụng cho trình duyệt render.
- Audio: ID track chuẩn và gain/mix policy; captions có timing quality và câu/từ khi đã align. Không để url do AI quyết định đường file hoặc nguồn tải khi render.
- Camera/effects có biên độ, tốc độ và easing giới hạn theo preset; trạng thái bất biến khi seek cùng frame.

Nhánh mới có công cụ vẽ người, y phục, tóc/mũ, đồ cầm, kiến trúc, đồ vật, map/location/route/arrow, timeline và label/connector. Thiết kế cụ thể là dữ liệu theo từng nhân vật/nơi/cảnh; không hardcode danh sách vua/tướng/lính/thần thành giới hạn cast. Mỗi thành phần vẽ có bounds/anchor/quan hệ hỗ trợ và ví dụ duyệt. Chỉ entity tái xuất hiện cần hồ sơ nhận dạng dùng chung; trang phục, tuổi và trạng thái được thay đổi có chủ ý theo timeline, không khóa tất cả tư thế trước khi dựng. Mục 15 quy định khả năng mở rộng khi công cụ vẽ chưa đủ.

Luồng production ưu tiên scene graph khai báo, tham số tạo hình và tài nguyên SVG/ảnh đã chuẩn hóa; React component đã kiểm chuyển dữ liệu thành hình. Chưa đưa JSX/JavaScript tùy ý từ room chat vào runtime. Chi tiết mới có thể biểu diễn bằng các lớp/path SVG an toàn hoặc media theo dự án khi adapter hỗ trợ; hành vi render mới cần bổ sung component/schema/fixture qua thay đổi code được kiểm. Không tự thay vật đầu mối bằng hộp chung khi thiếu khả năng vẽ.

### 6.3. Giải vị trí và phục hồi

1. Chọn mục đích/bố cục khởi đầu: một người, đối thoại, đứng cạnh giường, cạnh cửa, nhóm, map-focus, route, timeline, cause-effect. Đây là gợi ý cho solver; cây cảnh và ràng buộc vị trí vẫn biểu diễn được cấu trúc mới, không bắt khớp tên recipe đóng của kho cũ.
2. Bind entity vào role/anchor; tính tỷ lệ theo góc và viewport. Người đứng cạnh người nằm dùng hai role độc lập, không bắt có animation nằm xuống.
3. Kiểm màu/đúng người/số lượng/quan hệ hỗ trợ/biên/overlap. Cận cảnh được crop có chủ ý; không loại mọi crop hoặc ép luôn nhìn đủ nội thất.
4. Nếu không vừa: đổi slot/scale trong giới hạn, đổi framing/template cùng nghĩa. Bỏ động tác phụ, camera hoặc SFX không thiết yếu khi cần.
5. Nếu thiếu dữ kiện: sửa đúng scene/field qua AI. Nếu thiếu component/địa danh thiết yếu thật thì giữ phần đạt và báo cụ thể; không hứa vô hạn chủ đề đều tự có tài nguyên.

## 7. Prompt ngắn, ba room và sửa một mục sai

Tái sử dụng `runMotionAi`, `mapMotionAiPool`, `requestMotionAiContract`, prompt budget và checkpoint hiện có. Không dựng riêng runExplainerRoomPlanning gọi browser thẳng vì sẽ tách retry, CAPTCHA, AI fallback và lưu tiến độ.

| Công việc | Chia prompt | Chạy song song |
|---|---|---|
| Ledger từng đoạn nguồn | Theo đoạn; giữ quote/dữ kiện và phần kết | Tối đa ba room nếu provider cho phép; gộp ledger sau khi phần cần thiết đã đủ |
| DNA/dàn ý/identity chung | Từng artifact mục tiêu, giữ hợp đồng toàn truyện nhỏ | Giữ thứ tự phụ thuộc; không ba room tự viết ba phiên bản cốt truyện |
| Chương sáng tác | Theo phần sự kiện có nối trước/sau | Giữ tuần tự nơi cần continuity; dùng quy tắc thể loại hiện tại |
| SEO và chuẩn bị scene | SEO dựa script đã khóa; cảnh theo visual unit | Chạy đồng thời nếu còn worker; không làm SEO của bản nháp lỗi |
| Semantic scene plan | Nhóm nhỏ theo scene/location và ngân sách output | Các nhóm độc lập có thể ở ba room; shared identity/style read-only, reconcile state theo thứ tự |
| Layout, camera, frame, render | Code quyết định | Không gọi AI để tính lại dữ liệu đã có |

Mỗi prompt gửi schema mục tiêu, ID cần trả, lời của nhóm, state/cast/location liên quan và capability rút gọn. Đo độ dài **prompt cuối** và output dự kiến; dùng giới hạn hiện có ở `motionPrompt`, chưa đặt số cảnh cố định khi chưa đo. Không dán toàn truyện + toàn kho + toàn schema nhiều lần.

Một room tiếp tục hội thoại qua nhiều tác vụ theo ownership/requestId hiện tại. Cùng room không gửi hai request cùng lúc. Tối đa ba room không có nghĩa mọi giai đoạn đều song song. Khi room có lỗi UI có thể phục hồi, giữ request và reload room tối đa hai lần theo cơ chế dùng chung rồi mới thay room; CAPTCHA chờ người dùng, không tạo vòng reload hàng loạt. Lỗi JSON/schema là sửa nội dung có budget, không mặc định reload trang hai lần.

Ví dụ 10 scene trả đúng chín scene: nhận/lưu chín scene, khóa identity và nội dung của chúng; request sửa đúng scene còn lỗi với đường field cụ thể. Sau sửa kiểm liên kết/continuity phần tiếp giáp rồi compile. Nếu chỉ thiếu SFX tùy chọn thì bỏ cue và ghi log; không gửi lại cả mười scene.

Artifact mới phải đăng ký ở `motionResponseContract` cùng artifactType/requestId/targetIds, parser/normalizer, cache/version và diagnostics. Không chỉ đưa câu “hãy trả JSON” vào prompt.

## 8. Voice, timeline, phụ đề và âm thanh

- Dùng kênh giọng, preset phát âm/nhịp, các sửa rõ phụ âm và quality của pipeline hiện tại. Chưa có căn cứ để thay nhà cung cấp chỉ vì đổi renderer.
- `MotionVoiceTrack.clips` cung cấp start/end và có thể có words. Cần xác minh format/timebase, ánh xạ token tiếng Việt với text chuẩn và độ tin cậy trước khi dùng từng chữ; không coi mảng mốc thời gian tùy ASR là forced alignment chính xác.
- Lấy timing từ audio sau tempo/filter/trim cuối, hoặc biến đổi timestamp tương ứng có kiểm. Cấm tạo caption bằng timeline trước khi đổi tốc độ giọng.
- Nếu không có word alignment tin cậy: dùng phụ đề theo cụm/câu không nền và log rõ. Audio upload cần adapter align nếu bật word highlight; không ép dùng highlight giả theo chia đều thời gian.
- Cảnh co/giãn theo thời lượng audio thực, giữ cue quan trọng; không tăng tốc giọng để vừa storyboard ước tính. Cơ chế sửa thời lượng nội dung chung vẫn giữ budget hiện có.
- Chọn một nơi mix cuối. Có thể Remotion render hình rồi dùng luồng mix/publish hiện tại; nếu composition phát track đã mix thì không trộn lại SFX/BGM. Preview và export phải có cùng gain/timing; không nhân đôi voice.
- Narrator là vai âm thanh, không tự thành người hiện hình hoặc kích miệng cả dàn cast. SFX bản đồ/chiến trận chỉ hiện khi profile/sự kiện phù hợp; truyện ma giữ tiết chế.

## 9. Remotion: preview, export, jobs và đóng gói

Remotion là nhánh mới cần build thử với dự án hiện có. Các API được kiểm theo tài liệu chính thức: preview dùng [Player](https://www.remotion.dev/docs/player), render cục bộ theo [SSR](https://www.remotion.dev/docs/ssr), chọn composition bằng [selectComposition](https://www.remotion.dev/docs/renderer/select-composition), xuất ảnh bằng [renderStill](https://www.remotion.dev/docs/renderer/render-still), MP4 bằng [renderMedia](https://www.remotion.dev/docs/renderer/render-media).

### Công việc kỹ thuật

1. Pin đồng bộ phiên bản `remotion`, `@remotion/player`, `@remotion/renderer`, `@remotion/bundler`; kiểm peer dependencies với React 18.3.1, TypeScript, Vite và build Electron/esbuild hiện tại. Không chỉ thêm hai package rồi coi build hoàn tất.
2. Entry/composition riêng, bundle tái sử dụng theo code/assets hash. UI lazy load nhánh Player; không bundle renderer Node vào trình duyệt UI. Kiểm đường bundle trong bản đóng gói, không dựa mã nguồn TS trên máy dev.
3. Renderer registry/adapters: scene build, compile, renderStill, preview, export, cancel, diagnostics. Dùng kết quả compile có discriminator; legacy MotionSpec đọc qua adapter Canvas, không bắt mọi caller đổi sang một schema khổng lồ.
4. Cùng composition và props chuẩn dùng cho Player, ảnh review, thumbnail và MP4. Font/ảnh/SVG/audio phải load xong; không dùng Date.now/random chưa seed hoặc state theo thứ tự frame khi dựng hình.
5. Tích hợp `start/get/cancel` job chung và render publication hiện có. Hook progress/cancel thật vào renderer, dọn worker/browser/temp sau dừng; reload trang không tự khởi động lại job đã dừng.
6. Khóa tài nguyên CPU/RAM/Chromium chung với renderer Canvas; không đồng thời dùng toàn bộ pool room và render mặc định. Browser render tách khỏi Chrome chat; dùng policy ownership/đóng khi idle hiện tại, không kill toàn bộ Chrome.
7. Checkpoint ảnh/contract trước render; cache key gồm engine+schema+compiler+component/bundle+asset/font+profile+fps/aspect/quality+audio/timing ảnh hưởng. Không dùng lại chunk Canvas cho Remotion.
8. Render chunk/resume của Canvas không tự dùng được cho Remotion. Bản đầu phải công bố đúng mức phục hồi: dùng lại kịch bản/voice/contract và chạy lại bước render bị dừng. Muốn resume từng đoạn phải có thiết kế frameRange, overlap transition, ghép/mix và kiểm seek/audio riêng trước khi bật.
9. Chỉ publish khi media kiểm đạt duration, stream, kích thước và audio cần thiết; file tạm không ghi thành kết quả thành công. Encoder GPU hiện có không tự tương đương cấu hình Remotion; kiểm khả năng thật của adapter trước khi hiển thị lựa chọn dùng được.

Remotion cho phép vẽ chính xác theo frame sau khi có geometry đúng. Nó không tự đặt đúng nhân vật hay tự hiểu thoại. Các tiêu chí ngữ nghĩa/geometry ở mục 6 là phần bắt buộc để cải thiện vấn đề người dùng đang gặp.

## 10. Phong cách và tài nguyên cho nhiều dạng nội dung

| Dạng nội dung | Nhóm cảnh phù hợp | Giới hạn |
|---|---|---|
| Lịch sử/chiến dịch | Bản đồ, tuyến, mốc thời gian, phe/nhóm, cờ/biểu tượng | Đúng thời kỳ/địa danh; sự không chắc chắn phải có cách biểu thị |
| Khoa học/giải thích | Sơ đồ, box/connector, so sánh, quy mô, timeline | Không ép mọi chủ đề lên bản đồ hoặc người cầm vũ khí |
| Tiểu sử/thần thoại | Người + nơi + vật biểu tượng, timeline, map khi phù hợp | Ngoại hình xuyên suốt; lời thoại và sự kiện theo hợp đồng nội dung |
| Truyện ma dân gian | Kho hai gói đang dùng hoặc profile Remotion minh họa trầm khi nghiệm thu | Ưu tiên không khí trầm, đúng người/vật/vị trí; không spring nảy, lia nhanh, kinetic bắt buộc |

Thành phần React/SVG tổ chức theo chức năng vẽ và quy tắc bố cục, tách khỏi dữ liệu nhân vật. Mỗi design/media có ID tiếng Anh ổn định, nhãn UI tiếng Việt, bounds/anchor/style compatibility/revision và provenance khi nhập nguồn ngoài. Hồ sơ nhân vật lưu theo dự án, phần đã có thể tái dùng khi phù hợp. Không mặc định dùng nhân vật chibi dân gian làm chiến binh mọi thời đại.

Vật/nhân vật có thể ghép theo mô-đun trong giới hạn nghĩa: phụ kiện đầu/thân/tay, màu được khai có bằng chứng. Asset đặc thù hoặc địa lý cốt lõi chưa hỗ trợ phải được thống kê trước production. Ba bản đồ ban đầu chỉ là gói khởi điểm, chưa là coverage cho mọi lịch sử/thần thoại.

## 11. Danh sách triển khai theo thứ tự

| Mã | Công việc và điểm nối | Điều kiện hoàn tất |
|---|---|---|
| V01 | Cấu hình Phương thức dựng video gồm Sử dụng kho tài nguyên / Dựng bằng Remotion; type/settings/capability registry, adapters legacy, UI trong MotionVideoCreator/useMotionStudio; truyền qua mọi action | Đạt bảng nghiệm thu mục 4; hai item cùng hàng trên màn rộng, điều khiển phụ đúng nhánh, UI/API cùng snapshot; thiếu trường mới vẫn chạy kho; mode xung đột bị phát hiện trước AI |
| V02 | Dispatch capability trong analyze/chapter/folk repair và readiness trong production | Nhánh mới không bị kiểm kho cũ; kho vẫn giữ closed policy và bằng chứng; đổi mode chỉ invalidation phần phụ thuộc |
| V03 | Semantic contract, schema/artifact, prompt nhỏ, checkpoint/repair theo scene | Nhận phần đúng, sửa đúng field, giữ target IDs và tổng budget; ba room đúng dependency |
| V04 | Công cụ vẽ/profile đầu, catalog địa danh/map; solver bounds/anchor/continuity/appearance, nối thiết kế V10–V12 | Ảnh người–cửa, đứng–nằm, sở hữu vật và map/diagram đúng; nhiều thiết kế nhân vật dùng được; không gán nhầm chủ thể/màu |
| V05 | Adapter timeline/audio/caption, mapping cue sang frame | Timing theo audio cuối, hỗ trợ thiếu alignment bằng caption cụm; không đổi voice không cần thiết |
| V06 | Composition, Player, renderStill, template map/arrow/timeline/diagram/illustration | Preview và ảnh cùng props cho kết quả nhất quán; load font/asset có diagnostic |
| V07 | Renderer service, progress/cancel/publication, encoder/caching và đóng gói | Dừng giải phóng tài nguyên, không tự chạy lại khi refresh; kết quả không publish sớm; build Windows chạy được |
| V08 | UI cảnh/ảnh/thumbnail/kết quả/log cho hai nhánh; series/resume/migration | Thấy “Đọc cảnh i/N”, “Bố trí cảnh i/N”, “Render”; không đứng nhãn SEO khi đang dựng cảnh |
| V09 | Dọn code sau khi caller chuyển; fixture hồi quy và ảnh tham chiếu duyệt | Không thêm pipeline AI/TTS/job trùng; không phá các bản sửa kho và horror vừa làm |

Chỉ mở lựa chọn Remotion dùng thật khi V01–V08 và V10–V12 đạt các điều kiện tương ứng, từng profile có nghiệm thu V13. Triển khai theo từng đợt; mỗi đợt ghi code thay đổi, fixture/ảnh và phần chưa đạt. Việc tạo video để nghiệm thu cần nằm trong phạm vi người dùng yêu cầu lúc đó; plan không tự cho phép tạo video 5/20 phút.

### Ranh giới module đề xuất

- `src/types/motionVisual.ts`: settings và kết quả compile phân nhánh; `motionRemotion.ts` cho semantic/scene graph/render contract.
- `src/constants/motionVisual.ts`, `motionExplainerPrompts.ts`: lựa chọn, capability/profile, text/label/log/schema chung đúng quy ước hiện tại.
- `src/server/services/motionVisualService.ts`: adapter registry nhỏ, gọi pipeline sẵn có; không sao chép cả production service.
- `src/server/services/remotion/`: scene planner, character design, SVG/media normalization, layout, continuity và compiler theo trách nhiệm.
- `src/remotion/`: entry, Root, composition và component hiển thị; không chứa gọi AI/TTS hoặc đọc kho từ filesystem trong component.
- `src/server/services/motionRemotionRenderService.ts`: bundle/still/render adapter và lifecycle.
- `src/features/motion/components/MotionVisualModeField.tsx`, `MotionVisualPlayer.tsx`: lựa chọn và dispatch Player; giữ thành phần Canvas hiện tại sau adapter.

Tên file cuối có thể thay khi triển khai để khớp cấu trúc repo; danh sách trên chưa phải code đã tồn tại.

## 12. Phần giữ, phần thay và dọn code

**Giữ và kiểm hồi quy:** hai gói kho, snapshot/closed selection, vị trí/geometry, ngoại hình màu có evidence, ghost disguise/reveal, profile nền/góc vừa sửa, voice/clarity/nhịp, sub không nền, room reuse/reload/fallback/CAPTCHA, stop/resume/log và publish.

**Thay tại điểm dùng chung:** mặc định áp style kho ở mọi mode; kiểm sẵn sàng chỉ bằng `gen.puppet`; compile/render validator chỉ chấp nhận MotionSpec; UI ảnh/preview/thumbnail chỉ biết Puppet. Thay bằng dispatch có type, không tắt bộ kiểm bằng cờ bỏ qua lỗi.

**Không tạo thêm:** parser JSON/browser service/TTS service/production store dùng riêng cho explainer, prompt toàn truyện nhiều lần, một pass AI chọn tọa độ sau solver, mix audio lần hai, export flow chỉ dùng cho demo Achilles/WW2.

**Chỉ xóa khi có bằng chứng không còn caller:** helpers mới thử nghiệm bị thay, fallback quote làm mất cảnh trong nhánh mới, field chế độ trùng và code map/timing đã được chuyển vào module thuần. Map templates và board2d/type legacy còn lại cần quét tham chiếu/progress lịch sử trước khi quyết định; không xóa vì xuất hiện renderer mới. Không xóa tài nguyên cũ hoặc dữ liệu dự án trong đợt tích hợp này.

## 13. Kiểm thử và nghiệm thu

| Tình huống | Kết quả bắt buộc |
|---|---|
| Dự án cũ thiếu mode, có Puppet/kho đã khóa | Mở/tiếp tục được đúng nhánh; không xóa voice/frames hoặc đổi pack |
| Chọn Remotion, form còn stylePreset cũ | Payload chuẩn hóa không chèn inventory dân gian; readiness gọi đúng evaluator |
| API yêu cầu mode/engine không hỗ trợ | Báo ngay từ input, không tiêu request AI hoặc fallback sang kho |
| Đổi mode sau có script/voice/SEO | Giữ artifact không phụ thuộc còn hợp lệ; đánh dấu hình/compiled stale; không dùng chunk/thumbnail cũ |
| Mười scene sai một scene/field | Lưu chín scene đúng; sửa và kiểm đúng phần cùng continuity kế cận |
| Ba room, một room bị chặn | Worker độc lập trong giới hạn; request không gửi trùng; CAPTCHA giữ tiến độ, không tự xóa phòng |
| Nói mở cửa/đi lại phức tạp | Dùng cảnh đại diện hợp nghĩa, không ép mô phỏng mọi động tác |
| Một đứng–một nằm; vật trên bàn/vật trong tay | Giữ role/anchor/owner, tỷ lệ và vật đỡ đúng; không chồng người hoặc trôi vật |
| Mặt trắng/áo trắng/thân xám, ma giả người/hồi tưởng | Đúng bộ phận và ID; giữ identity/state; không nhuộm người kể theo mô tả người khác |
| Map tên khác/địa danh trùng tên/thời kỳ khác | Resolve có bằng chứng hoặc báo phần thiếu; không vẽ mặc định tâm bản đồ |
| Khoa học không có geography | Diagram/timeline phù hợp; không tự thêm bản đồ/chiến trận |
| ASR tắt/không có words/upload voice | Caption cụm/câu; không claim khớp từng chữ hoặc chạy TTS lại chỉ vì đổi renderer |
| Audio nhanh/chậm hơn dự tính; FPS 24/30 và aspect khác | Timeline không gap/overlap ngoài chủ ý, cue đúng, tổng thời gian khớp audio trong sai số đã chốt |
| Review on/off | On dùng ảnh đúng renderer; off không gửi AI ảnh, vẫn kiểm dữ liệu/render/geometry |
| Seek frame bất kỳ, render lại, font/asset thiếu | Hình có tính lặp lại; thiếu asset chặn publish và nêu lỗi cụ thể |
| Cancel trong planning/render; refresh UI | Dừng thật, giữ log/checkpoint, không tiếp tục nếu chưa được người dùng yêu cầu |
| Render thất bại giữa chừng | Giữ nguồn/voice/contract; resume theo khả năng đã công bố, không giả có chunk resume |
| Canvas/Remotion cùng máy; bản đóng gói Windows | Tôn trọng khóa tài nguyên và browser ownership; input paths/fonts/bundle truy cập được |

Ưu tiên fixture thuần và ảnh tĩnh nén bảng để kiểm vị trí/nhận dạng/timing. Khi người dùng cho chạy nghiệm thu, dùng clip ngắn có ít cảnh đại diện, không tự chọn thời lượng dài. Muốn kết luận giống mẫu cần người dùng duyệt ảnh và nhịp hình; typecheck hoặc render được MP4 chưa đủ.

## 14. Kết luận triển khai

Nên thêm cấu hình **Phương thức dựng video: Sử dụng kho tài nguyên / Dựng bằng Remotion** trong cùng Video Motion, đưa phần dùng chung qua hợp đồng/adapter và giữ kho làm mặc định. Với Remotion, dữ liệu mỗi câu chuyện quyết định nhân vật, hình và không gian; React/SVG dựng chúng thành cảnh theo timeline. Artwork bổ sung là khả năng nội bộ khi cần. Cần triển khai từ phân tích, scene graph và thiết kế nhân vật tới Player/export; thay riêng hàm xuất cuối sẽ giữ nguyên các giới hạn kho cũ. Runtime nền đã được triển khai ngày 27/10; trạng thái và phần nghiệm thu còn lại ghi tại mục 16.

## 15. Thiết kế Remotion cho nhiều nhân vật và nhiều loại cảnh

Mục này thay đề xuất cũ “cách thứ ba: tạo bộ artwork cố định theo dự án”. Theo chỉ đạo mới, Remotion là nhánh dựng video; không yêu cầu chuẩn bị sẵn toàn bộ nhân vật/tư thế rồi mới ghép cảnh.

### 15.1. Phạm vi đã kiểm ở mẫu Achilles

Đã mở [The Entire Story of Greek Mythology’s Greatest Warrior: Achilles — Unknown Frequencies](https://www.youtube.com/watch?v=L-dBHh-9wug), thời lượng trình phát 12:57, và xem ảnh tại 00:00, 01:17, 03:53, 06:28, 09:03, 11:39. Đây là sáu khung lấy mẫu, chưa là phân tích toàn bộ cảnh, chuyển động hoặc giọng. Không xác định phần mềm tác giả dùng từ các ảnh này.

| Mốc | Quan sát trực tiếp | Cách biểu diễn trong nhánh Remotion đề xuất |
|---|---|---|
| 00:00 | Người giáp vàng/mào đỏ, nền đồ vật cổ đại trầm, nhãn tên | Character với design của nhân vật + background layers + label; không ép dùng người que |
| 01:17 | Hai nhân vật thần thoại, bóng đen, mũi tên/trái tim trên nền trắng | Hai entity thiết kế độc lập + silhouette + annotation; không cần nền kiến trúc |
| 03:53 | Cảng, thuyền, bệ đá, cô gái, người cận cảnh | Cây lớp xa/gần, mặt đất/mặt nước và vật thể; tỷ lệ theo vai trò trong cảnh |
| 06:28 | Nhân vật nét vẽ trên nền trắng | Tái dùng ID của nhân vật, đổi biểu cảm/trạng thái theo nhịp kể |
| 09:03 | Nhiều người trước cửa thành, vũ khí và vòng đánh dấu | Entity riêng + relation/depth + clue overlay; không cần mô phỏng giao chiến đầy đủ |
| 11:39 | Bình tro, tên hai người, mũi tên và vật liệu đổ vào | Prop focus + label/arrow; không bắt cảnh nào cũng có người/bản đồ |

[Bảng sáu ảnh đã lưu](video-references/achilles-third-mode-20261026/index.html) dùng đối chiếu bố cục, không nhập artwork của video nguồn vào production. Khả năng gần mẫu phải được nghiệm thu bằng hình thực tế; cài Remotion không chứng minh đã đạt phong cách đó.

### 15.2. Kiến trúc dựng thực sự bằng Remotion

```text
Kịch bản đã khóa + profile + dữ kiện thời kỳ/ngoại hình
       │
       ├─ Voice hiện có → timing cuối ─────────────────────────┐
       └─ Nhịp minh họa → scene intent + entity design         │
                              │                               │
                  Cây cảnh khai báo + quan hệ                 │
                              │                               │
              Solver bounds/anchor/depth/camera                │
                              └─────────────┬─────────────────┘
                                            ▼
                     RemotionDocument: props + manifest + frame ranges
                                            │
                  StoryComposition → Scene → Background/Character/Prop
                                            + Map/Diagram/Label/Caption
                                            │
                                Player / renderStill / renderMedia
```

- **Remotion thực hiện:** render component React/DOM/SVG/ảnh, xếp lớp, hiện/ẩn, camera, hiệu ứng tiết chế, phụ đề và hình theo frame. Dữ liệu truyền qua props theo [Parameterized videos](https://www.remotion.dev/docs/parameterized-rendering).
- **AI thực hiện:** đọc lời kể, khai ai/ở đâu/vật gì/quan hệ nào, đề xuất thiết kế hình phù hợp câu chuyện, cung cấp phần SVG được phép khi cần. AI không phải renderer và không tính lại toàn bộ tọa độ/frame khi code đã có timeline.
- **Ứng dụng thực hiện:** xác minh ID và nghĩa quan trọng, chuẩn hóa SVG/media, giải bố cục, gắn timing, quản lý job, cache, retry và publish.
- **Giới hạn thật:** Remotion không có sẵn người Hy Lạp, người Việt hay mọi kiến trúc lịch sử. Cần công cụ vẽ và dữ liệu design hoặc artwork tương ứng. Độ đúng lịch sử và chất lượng nét vẽ phải được kiểm riêng; không gọi một silhouette chung là đã đủ cho mọi nhân vật.

### 15.3. Nhân vật thiết kế theo nội dung, không đóng cast

Tách ba lớp dữ liệu:

1. **Style profile:** nét viền, hình khối, tỷ lệ, palette, đổ bóng, ánh sáng, nhịp chuyển cảnh. Profile áp cho toàn video để hình nhất quán, không định nghĩa một danh sách người phải dùng.
2. **Entity design:** ID trong dự án, tuổi/diện mạo có căn cứ, dáng người, tóc, mặt, trang phục, phụ kiện, vật nhận dạng và thời kỳ. `roleLabel` là thông tin mô tả, không enum hữu hạn kiểu chỉ vua/tướng/lính/thần. Thần thoại có thể thêm cánh, hình thể khác hoặc SVG riêng khi công cụ vẽ hỗ trợ.
3. **Scene instance:** entity ID, vị trí tương đối, hướng nhìn, biểu cảm, động tác minh họa, trạng thái và biến thể ở thời điểm này. Không nhân bản hồ sơ nhân vật chỉ vì đổi góc hoặc đổi quần áo.

Quy tắc continuity:

- Một nhân vật tái xuất hiện dùng cùng ID và đặc điểm nhận dạng còn hiệu lực. Đổi tuổi/giáp/trang phục/hóa ma cần state/timeline rõ, không cấm thay hình suốt câu chuyện.
- Người chỉ xuất hiện một cảnh không cần bộ pose hay hình chuẩn qua nhiều lượt AI. Dựng theo dữ liệu của cảnh đó; chỉ bổ sung hồ sơ dùng chung khi cần tái sử dụng.
- Đám đông là group/count/variation seed theo phong cách và thời kỳ; không tạo hàng chục hồ sơ riêng nếu lời không nhắc từng người. Những người được gọi tên hoặc có quan hệ quan trọng vẫn là entity riêng.
- Loại chuyển động cơ bản có thể hữu hạn để dễ kiểm; giới hạn animation không trở thành giới hạn số nhân vật hoặc thiết kế ngoại hình.
- Tên một nhân vật lịch sử không đủ làm evidence cho mọi chi tiết ngoại hình. Phân biệt dữ kiện được xác nhận với lựa chọn minh họa; chi tiết không biết có thể giản lược, tránh khẳng định một hình tự tạo là chân dung chính xác.

Ví dụ: cùng video có vua già, nữ tu, chiến binh giáp, trẻ nhỏ và bóng ma. Họ có design khác nhau trong cùng profile. Achilles trở lại dùng cùng identity; một đoàn lính là group có biến thể. Không tìm năm nhân vật gần giống trong gói chibi dân gian rồi đổi tên.

### 15.4. Cây cảnh và nguồn hình có thể mở rộng

Cây cảnh có cấu trúc khai báo, tham chiếu thiết kế/media bằng ID; không gửi toàn bộ dữ liệu design vào mọi scene. Các node khởi đầu: group, character, prop, environment, shape/path, image, text, map, connector. Schema giới hạn cấu trúc và hành vi được renderer hỗ trợ, không liệt kê hết tên mọi nhân vật/đồ vật trên thế giới.

Cách bổ sung chi tiết theo mức phù hợp:

1. **Tham số component:** thay dáng, màu, tỷ lệ, lớp tóc/y phục/mũ/giáp, hình cửa/thuyền/bình và ánh sáng trong giới hạn công cụ vẽ. `@remotion/shapes` cung cấp hình cơ bản; hình người/kiến trúc vẫn cần component và thiết kế riêng.
2. **SVG riêng có kiểm:** thêm path/lớp tĩnh cho một vật hoặc diện mạo chưa biểu diễn được bằng tham số. Chuẩn hóa viewBox/bounds/anchor, sanitize; cấm script, event handler, foreignObject hoặc external fetch. SVG được load không chứng minh nội dung hình đã đúng.
3. **Media theo dự án khi thật sự cần:** SVG/PNG đã duyệt/nhập hợp lệ hoặc adapter sinh ảnh có kiểm. Chỉ gọi lúc chi tiết cốt lõi cần artwork; provider trả mô tả hoặc link chưa tải không được coi là đã có hình. Nếu bật sinh ảnh, lưu budget, nguồn, hash và revision, không ghi vào hai gói kho chung.
4. **Hành vi mới:** nếu cần một primitive/render behavior chưa có, thêm component/schema/fixture bằng thay đổi code có kiểm. Không thực thi JSX/JavaScript tùy ý từ chat như một bước mặc định của production.

Không bắt mọi video phải qua cả ba nguồn hình; component có thể dựng đủ một cảnh đơn giản. Không lập upfront hàng loạt nền/pose chưa dùng. Bản đầu chỉ mở profile có coverage đã nghiệm thu; thiếu chi tiết thiết yếu thì sửa scene/design hoặc bổ sung artwork trong khả năng đã công bố, không đổi renderer hoặc thay sai vật để báo thành công.

### 15.5. Bố cục theo quan hệ và mức chi tiết minh họa

- Cảnh có cây lớp và ràng buộc vị trí, không phụ thuộc một recipe ID phải tồn tại trong kho. Layout family là điểm khởi đầu, solver phải xử lý bounds, tỷ lệ, điểm chân/mặt tựa, depth và vùng sub của các node thực tế.
- “A đứng cạnh cửa, B nằm trên giường”: A bind ground/door vicinity; B bind bed surface. Nếu tư thế không quyết định nghĩa thì có thể dùng B ngồi/đứng gần giường theo chính sách minh họa. Nếu lời nhấn mạnh thi thể nằm dưới giường hoặc người trốn bên trong thì quan hệ đó là cốt lõi, phải giữ.
- “A mở cửa”: hình A cạnh cửa và trạng thái cửa đủ; không ép vẽ animation tay nắm. “A đưa bùa cho B”: ưu tiên thể hiện đúng ai có bùa ở trạng thái trước/sau; chỉ cần cử động tay khi cần làm rõ việc chuyển sở hữu.
- Scene mới thay chi tiết theo sự kiện, nơi, chủ thể hoặc vật đầu mối; không chia mỗi câu thành cảnh riêng, cũng không lặp nguyên hình dài khi lời đã chuyển nơi/chủ thể.
- Màu/diện mạo có evidence dùng logic appearance và timeline đã sửa; người kể không tự hiện hình, miệng chỉ hoạt động khi có nhân vật đang nói và profile bật chuyển động đó.
- Truyện ma dùng tông trầm và hình tĩnh/zoom rất nhẹ; lịch sử dùng nhân vật, bối cảnh, nhãn/map khi có nghĩa; không bắt chung kiểu hài hay chuyển cảnh dồn dập.

### 15.6. Timing, API Remotion và dữ liệu xuất

Một `RemotionDocument` có schema version, profile/component revision, entity designs, scene graph đã resolve, manifest và timeline. `StoryComposition` đọc document này để preview và render; không gọi AI hoặc sinh tài nguyên trong component.

- Props quyết định nội dung; fps/kích thước/duration do metadata chuẩn hóa từ quality và timing audio cuối. `selectComposition` dùng cùng input props với render.
- Đặt từng scene/layer lên timeline bằng API timing hỗ trợ ở phiên bản đã pin. Tài liệu [Sequence](https://www.remotion.dev/docs/sequence) được kiểm ngày 26/10/2026 ghi có timing props trên các component và hướng bọc custom component; bản đó không còn khuyến nghị dùng trực tiếp Sequence. Khi triển khai cần chọn cách đúng với phiên bản đã pin, không chép ví dụ cũ rồi giả định API không đổi.
- Frame dùng [useCurrentFrame](https://www.remotion.dev/docs/use-current-frame); phân biệt frame cục bộ của cảnh và frame toàn video. Transform/opacity tại frame phải có kết quả lặp lại khi seek hoặc render không theo thứ tự. Seed đám đông cố định theo ID, không random theo lần render.
- Preview dùng [Player](https://www.remotion.dev/docs/player), ảnh kiểm dùng renderStill, video dùng [renderMedia](https://www.remotion.dev/docs/renderer/render-media). Renderer mới dùng chung document/assets/fonts và audio policy ở mục 8; preload/buffer trước khi phát để tránh hình trắng/nhấp nháy do chưa tải.
- Giữ audio pipeline hiện có và một lần mix cuối. Không chuyển sang TTS khác hoặc tăng tốc nhân vật chỉ để vừa cảnh.
- Ba room chat xử lý scene/design độc lập khi đủ dữ kiện; parallel render là cơ chế khác, có giới hạn CPU/RAM riêng. Không coi mở ba tab là đã có ba render worker.

### 15.7. Bổ sung hạng mục triển khai

| Mã | Công việc | Điều kiện hoàn tất |
|---|---|---|
| V10 | Schema entity design/scene instance/scene graph, parser và checkpoint theo ID; capability tách khỏi kho đóng | Cast không bị đóng theo role; nhân vật một cảnh không phải tạo kit; sửa một scene/design giữ phần đạt |
| V11 | Character/Environment/Prop React-SVG components, custom SVG/media resolver, design/manifest revision | Có tạo hình khác thời kỳ/vai/tuổi trong cùng profile; nguồn hình tải được, bounds/anchors đúng; không ghi thêm vào kho chung |
| V12 | Graph compiler/solver + appearance/continuity + timing + preview/still/export trên một composition | Đúng người/vật/quan hệ và thay trạng thái có chủ ý; không bị lỗi thiếu recipe/spot của Puppet; ảnh preview khớp export |
| V13 | Profile lịch sử, truyện ma và giải thích; bộ fixture khác câu chuyện, bảng ảnh nén và duyệt hình | Nhiều kiểu người/nơi/vật; phong cách và tỷ lệ đạt mẫu được duyệt; không dùng typecheck/MP4 có hình làm bằng chứng đạt phong cách |

V10–V12 nằm trong gate mở chế độ Remotion bên cạnh V01–V08; V13 nghiệm thu từng profile trước khi hiện profile đó trên UI. Không triển khai thêm mode project_assets; nguồn artwork bổ sung là adapter nội bộ tùy khả năng. Dependency Remotion đã pin 4.0.539 khi triển khai ngày 27/10; các ghi chú chưa cài là lịch sử của lượt lập plan.

### 15.8. Ca nghiệm thu bổ sung và phần cần dọn

- Một video có nhiều người khác tuổi, giới, y phục, thời kỳ; thần thoại có hình thể khác người thường: không tất cả cùng một sprite đổi màu.
- Một nhân vật qua nền trắng, cảng, cửa thành rồi đổi áo theo lời: đúng ID, thay state hợp lệ; người một cảnh và crowd không phải tạo đủ bộ pose.
- Cảnh phòng, bến sông, thành cổ, prop focus và diagram: cùng composition dựng được các cây cảnh khác nhau, không ép gọi layout conversation/chair của kho.
- Nhắc bóng ma áo trắng, vật trên bàn, người đứng sau cửa, đúng ba người: đúng màu/bộ phận/quan hệ/số lượng; giản lược động tác phụ được phép.
- Chi tiết mới biểu diễn bằng SVG an toàn: nhận đúng design và scope dự án, không thực thi code; thiếu tải/font/asset được log đúng scene, không báo hoàn tất.
- Sai một vật/áo/vị trí: sửa đúng node/design hoặc solver; cảnh đúng, voice, SEO và log giữ nguyên theo dependency.
- Seek đầu/giữa/cuối cảnh và render lại: cùng frame cho cùng hình, không trôi nhân vật/ảnh/nhãn do state hoặc tài nguyên chưa tải.
- Profile truyện ma giữ tĩnh/trầm; lịch sử không bị chibi dân gian hóa; độ gần mẫu cần duyệt bảng ảnh và nhịp thật khi được user cho chạy nghiệm thu.

Dọn các đề xuất/field nhánh thứ ba còn sót trong tài liệu và code thử nghiệm nếu sau này có: project_assets như mode UI, bắt tạo đầy đủ kit trước mọi cảnh, role enum dùng làm danh mục nhân vật, guard kho chạy trong Remotion, preview dùng Canvas nhưng export dùng Remotion. Chỉ xóa implementation sau khi đã tìm caller và có adapter tương ứng. Các helper SVG thuần của kitDraw có thể tái dùng sau rà soát; không bật lại đường legacy ghi kho chung để dựng nhánh mới.

**Phạm vi lượt lập plan ngày 26/10:** kiểm code và tài liệu chính thức, cập nhật plan và trang đối chiếu. Phần triển khai ngày 27/10 được cập nhật riêng tại mục 16.

## 16. Triển khai và kiểm chứng ngày 27/10/2026

### 16.1. Phần đã triển khai

- UI có **Phương thức dựng video**, hai item cùng hàng trên màn rộng: **Sử dụng kho tài nguyên** / **Dựng bằng Remotion**. Kho là mặc định, dự án cũ thiếu trường mới được nhận là kho. Nhánh Remotion có ba profile hình thử nghiệm; gói kho và ảnh tham chiếu kho chỉ hiện trong nhánh kho.
- `visualSettings` lưu theo dự án và đi qua phân tích, kịch bản, dựng cảnh, compile, thumbnail, production/resume và dữ liệu kết quả mới. Cấu hình không được hỗ trợ bị báo lỗi; không âm thầm chạy một phương thức khác. Đổi phương thức bỏ cảnh, preview, thumbnail và liên kết production cũ; giữ nguồn, lời kể và voice khi signature còn đúng. Đổi phương thức bị chặn khi tác vụ đang chạy.
- `library → canvas` giữ `recoverMotionIllustrationPlan`, `buildScenesPuppet`, compiler Puppet, hai gói kho đóng và bộ dựng Canvas. Nhánh Remotion không chạy kiểm độ phủ kho, không tìm spot/recipe kho và không ghi artwork vào kho chung.
- `remotion → remotion` có scene graph theo các dòng lời kể, entity ID từ cast của dự án, SVG nền/người/vật theo nhu cầu. Nhân vật không bị giới hạn vào cast của hai gói dân gian. SVG được kiểm cấu trúc, kích thước, namespace, tag, URL và nội dung không an toàn; code chat không được thực thi.
- Bố trí dùng slot trái/giữa/phải và quan hệ cạnh/sau/trên/bên trong/cầm; điểm chân, mặt tựa, điểm cầm và vùng trong gắn với SVG. Solver giữ quan hệ khi thu/di chuyển cả bố cục cho vừa khung; không clamp rời từng người/vật. Hành động phụ vẫn minh họa tĩnh.
- Prompt tách đọc cảnh, vẽ từng asset, review. Dùng `runMotionAi`, room/pool và hợp đồng retry hiện hữu. Các cảnh hợp lệ trong một phản hồi sai một phần được giữ; lượt sửa chỉ cần trả cảnh còn thiếu/sai. Checkpoint lưu cả bản nháp đã nhận và budget lỗi. Sửa review giới hạn hai vòng trên đúng cảnh bị lỗi, render ảnh mới rồi kiểm lại; giữ cảnh khác/voice/SEO. Không claim đã có merge mọi field của từng node.
- Review off không gửi ảnh cho AI; vẫn kiểm dữ liệu và hình học. Review on dùng `renderStill` từ đúng composition, có cache theo nội dung, asset và aspect; ảnh tạm được dọn sau lượt kiểm.
- Timeline từ duration/voice clips cuối; caption cụm/câu và audio pipeline hiện có được giữ. Scene frames phủ liên tục toàn video. Chuyển động tùy chọn là zoom rất nhẹ, không tạo nhấp nháy miệng. Sound events có sẵn trong beat được chuyển theo timing sang mixer chung; không tự thêm tiếng bước chân cho hình đứng yên.
- `StoryComposition` dùng chung cho Player, thumbnail cảnh, ảnh review và `renderMedia`. Adapter renderer dùng Chrome headless riêng, có cancel/progress và dùng chung mux/audio, QA output và publish. Remotion hiện mã hóa CPU; UI gửi CPU, API báo lỗi sớm nếu yêu cầu GPU riêng.
- Bundle Remotion riêng, có trong script build và hai đường đóng gói. Bản phát triển dùng cùng cấu hình resolver với bundle đóng gói; không tải bundler/player khi render nhánh kho.

### 16.2. Bằng chứng kiểm

| Kiểm | Kết quả |
|---|---|
| `npx tsc --noEmit --pretty false` | Qua sau tích hợp |
| `npx vite build` | Qua; chunk Remotion được tách lazy; còn cảnh báo kích thước chunk chung của ứng dụng |
| `npm run motion:bundle-remotion` | Qua với Remotion 4.0.539 |
| Backend bundle bằng esbuild vào `scratch/remotion-integration-20261027/server.cjs` | Qua; có cảnh báo import.meta ở file security hiện hữu |
| `scripts/verify-motion-production-runner.ts` | Qua: kho không khởi tạo Remotion; Remotion không kiểm kho; cả hai giữ orchestration/resume/snapshot/voice/SEO/cancel. Dependency AI thật được thay bằng mock trong kiểm này |
| `scripts/verify-motion-closed-pipeline.ts` | Qua cho cả minimal_mask/chibi_folk: dựng, resume, bật/tắt review, repair và ghép tài nguyên trong kho |
| `scripts/verify-motion-remotion.ts` | Qua: legacy defaults, cấu hình tách biệt, sửa cảnh sai một phần, checkpoint/cache, namespace/SVG lỗi, quan hệ, tỷ lệ khung, frame/timing, sound events và review sửa cảnh |
| `scripts/verify-motion-remotion.ts --render` | Qua: ba ảnh thật và MP4 kỹ thuật vài giây, kiểm decode/fps/frame count/kích thước/thời lượng; không gọi AI hoặc TTS thật |

Artifact kỹ thuật nằm trong `scratch/remotion-integration-20261027/`. Đây là hình tối giản viết bằng fixture để kiểm solver/renderer, không phải artwork đầu ra AI hoặc bằng chứng phong cách đã giống video nguồn. Không tạo video truyện 5/20 phút và không can thiệp dự án thật của người dùng để nghiệm thu.

### 16.3. Phạm vi còn cần nghiệm thu/mở rộng

- V01–V05 đã có đường chạy và kiểm kỹ thuật; V06–V12 có nền tích hợp preview/still/export, scene/asset/checkpoint. Không đánh dấu toàn bộ V01–V13 hoàn tất: chưa nghiệm thu đóng gói Windows cài sạch, thao tác UI thực tế và hủy render giữa chừng trên bản cài đặt.
- V13 chưa có duyệt hình production theo mẫu. Ba profile được ghi rõ thử nghiệm; chất lượng nét vẽ và độ chính xác lịch sử/ngoại hình phụ thuộc artwork AI thực tế, cần duyệt bảng hình trước khi kết luận đạt mẫu.
- Phạm vi node hiện tại là character/prop/label + background SVG; chưa có editor/component riêng cho map, timeline, crowd có seed hoặc connector. SVG tĩnh có thể biểu diễn sơ đồ nhưng không coi đó là đã có đầy đủ các component chuyên dụng trong plan.
- Caption hiện dùng cụm/câu theo clip hoặc phân bổ trọng số khi thiếu clip alignment, chưa có kinetic word captions. Remotion có sound events đã khai trong beat và music segments; chưa có bước AI sound-direction riêng như nhánh Puppet.
- Bố cục dựa anchor/slot và quan hệ; chưa phải bộ giải mọi quan hệ không gian hoặc occlusion phức tạp. Không thay sai chủ thể hoặc giả có tài nguyên để bỏ qua lỗi thiết yếu.
- Chưa chạy end-to-end với room chat/voice thật trong lượt này. CAPTCHA, giới hạn dịch vụ AI và chất lượng SVG thực tế vẫn là các ca cần kiểm khi người dùng chạy dự án; retry có giới hạn và tiến độ được giữ, không cam kết mọi nguồn luôn thành công.

## Đối ứng QA Remotion ngày 27/10/2026

Đã đối chiếu lượt cảnh `cacf62c0-254e-4722-97a9-3b4c0175aa38`: 17 nhịp được lên kế hoạch, 3 nhịp bắt đầu, 6 SVG đã lưu hợp lệ; nhịp 2 có thể ghép hoàn chỉnh. Nhịp 1 chờ biến thể Chị Hai dù hình gốc đã có; nhịp 3 hết lượt sửa dữ liệu và làm ngừng nhận nhịp mới. Không phải cả 17 cảnh đều đã vẽ rồi bị từ chối.

### QA đã hạ và luồng đã sửa

- Chấp nhận SVG có code fence, XML declaration, comment, viewBox khác gốc 0, hoặc thiếu viewBox nhưng có width/height số hợp lệ. Chuẩn hóa trước kiểm tra; báo riêng lỗi cấu trúc, kích thước, tài nguyên ngoài và thiếu hình.
- Log DeepSeek `motion_remotion_asset-e2cdee3a` chứa một JSON đủ SVG/anchors, sau đó lặp thêm anchors. Bộ đọc riêng của Remotion lấy đối tượng JSON hoàn chỉnh; vẫn đối chiếu artifact/request ID như trước. Có fixture phản hồi thật và kiểm sai request ID không được nhận.
- Bằng chứng không cần khớp nguyên văn; pose/evidence thiếu được chuẩn hóa thành tư thế trung tính và nguồn của khoảng dòng tương ứng. Không bắt sửa lại cảnh chỉ vì dấu câu hoặc cách diễn đạt.
- Nhân vật dùng lại hình theo identity khi chỉ khác diễn đạt hoặc động tác phụ. appearanceChanged/poseEssential chỉ dành cho thay đổi ngoại hình hoặc tư thế bắt buộc; màu sắc/trạng thái rõ ràng và tư thế nằm vẫn cần hình phù hợp.
- SVG đã qua kiểm được giữ trong checkpoint kể cả khi thiếu anchors. Chỉ hỏi điểm đặt còn thiếu, không vẽ lại SVG; điểm surface/grip/inside vẫn phải có khi quan hệ cần chúng.
- Giữ cả phần draft chưa đạt và phần đã đạt; phản hồi sửa có thể chỉ chứa node/field sai. Có diagnostics chi tiết theo scene/node/field và lưu raw response khi từ chối.
- Lỗi contract nội dung của một nhịp được gom lại sau khi các nhịp khác tiếp tục chạy. Cancel, CAPTCHA và lỗi phiên không xác định vẫn được xử lý theo luồng chung. Không xuất video thiếu cảnh.
- Preview từng cảnh dùng chung StoryComposition/layout, không phụ thuộc compile toàn bộ video. Bộ đếm chỉ tính cảnh có đủ layers và bố cục hợp lệ. Cảnh chưa đủ hiện trạng thái đang ghép.
- Checkpoint lỗi cũ được mở lại ngân sách một lần theo revision bản sửa; không tăng số lượt lặp vô hạn và không xóa tài nguyên đã đạt.
- Prompt asset được nhận diện đúng là tác vụ viết mã SVG, yêu cầu JSON trực tiếp và không gọi công cụ sinh ảnh raster.

### Kiểm chứng

- `npm run test:motion-remotion`: kiểm tích hợp cũ và regression QA mới bằng mock, không gọi AI/TTS thật.
- `scripts/verify-chat-response-snapshots.ts`: phản hồi SVG bị lặp suffix được đọc đúng; request ID sai vẫn bị loại.
- `npx tsc --noEmit --pretty false` và `git diff --check`.
- Preview ngoại tuyến từ dữ liệu đã lưu: `scratch/remotion-qa-preview.html`, ảnh `scratch/remotion-qa-preview-20261027.png`. Một cảnh đủ hình hiển thị dù cảnh khác chưa đủ tài nguyên và chưa compile toàn bộ video. Đây là kiểm hiển thị, không phải xác nhận nội dung/trình bày của hình AI đã khớp mẫu.

Không khởi tạo hoặc tiếp tục lượt tạo video thật để kiểm bản sửa này. Chế độ kho giữ pipeline riêng.

## Đối ứng preview và lỗi mất thẻ SVG lúc 10:53–10:56 ngày 27/10/2026

Lượt `bf793538-7fb0-4509-8596-1ca1f0be2d93` đã bị hủy lúc 10:56:06–10:56:07, có 17 nhịp nguồn, 5 nhịp có scene graph, 2 cảnh đủ layers và 10 SVG được giữ. Cảnh 3 thiếu hình cột hiên và lư hương; cảnh 4 thiếu bàn, biến thể người và mâm; cảnh 5 thiếu hình nhang/khói. Các cảnh sau chưa được nhận xử lý khi người dùng dừng. Trạng thái “đang ghép” trong UI cũ không phản ánh việc job đã dừng.

- Grid 3 cột ở màn hình rộng; 9 ô/trang. Có cả ô cho nhịp chưa có scene graph. Mẫu số tính trên toàn bộ truyện, mỗi nhịp chưa lập chi tiết giữ một ô; nhịp đã tách nhiều phân cảnh đóng góp đúng số phân cảnh thực có. Lượt này là 2/17, không phải 2/5. Nếu một nhịp sau đó được tách thêm phân cảnh, tổng được cập nhật theo kế hoạch thực.
- Thumbnail và hộp phóng ảnh dùng chung MotionRemotionStill/StoryComposition. Mở qua Modal đang dùng cho phần kho; hiển thị lời kể và có thao tác dựng lại nhịp đó. Không dựng video/AI khi mở ảnh.
- Ô chưa đủ hiển thị chờ dựng khi có tác vụ dựng, chưa hoàn tất khi đã dừng, hoặc cần sửa khi có lỗi. Nêu hình nền/layers/layout còn thiếu; không dùng chung câu “đang ghép” cho mọi trường hợp. Xóa lỗi nhịp cũ khi nhịp bắt đầu một lượt phục hồi mới.
- Hai request `07d351…` và `df778f…`, mỗi request hai phản hồi Gemini: SVG dài khoảng 17 nghìn/8 nghìn ký tự, tất cả đều không còn bất kỳ thẻ đóng nào. Đây là dữ liệu XML không thể render đúng, không phải QA hình thức. Không tự chèn hàng loạt thẻ vào cuối vì có thể lồng sai gradients/groups và làm sai hình.
- Prompt đang yêu cầu JSON trần, Gemini trước đó được đọc bằng innerText. Cách này có nguy cơ khiến HTML/Markdown xử lý các thẻ trong chuỗi SVG; không còn room gốc sau khi dừng để xác định riêng từng thẻ bị mất ở phía AI hay ở phần hiển thị. Đã yêu cầu mã hóa mọi ký tự `<` bên trong chuỗi JSON thành `\\u003c`; JSON.parse trả lại SVG gốc. Nếu AI dùng code block, các tác vụ vector ưu tiên textContent của code để giữ nguyên mã. Giữ nguyên đối chiếu request/artifact ID và không thực thi mã AI.
- Báo lỗi XML chỉ rõ các thẻ còn mở hoặc thẻ đóng không khớp; log phần cần sửa được ghi đầy đủ trước dòng đổi AI, không chỉ còn hash request và một câu lỗi bị cắt.
- Fixture hai SVG thật bị thiếu thẻ đóng được giữ để kiểm lỗi rõ ràng; kiểm truyền JSON escaped và đọc nguyên code block bằng browser mock. Kiểm progress 2 cảnh đủ/17 cảnh toàn truyện và trạng thái sau dừng bằng mock.

Ảnh kiểm chứng trực tiếp trong UI: `scratch/remotion-three-column-grid-20261027.png` và `scratch/remotion-scene-lightbox-20261027.png`. Không tự chạy lại job hoặc tạo video mới.
