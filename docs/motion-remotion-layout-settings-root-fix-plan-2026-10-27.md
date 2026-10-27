# Plan sửa gốc bố cục, chuyển động và cấu hình Video Motion

Ngày rà code: 27/10/2026. Cập nhật triển khai: **đã đối ứng cấu hình, geometry, continuity, effect layers và cache; đã kiểm offline. Chưa đóng nghiệm thu hình thực tế/tài nguyên cũ**. Xem [báo cáo triển khai và bằng chứng](motion-remotion-layout-settings-implementation-2026-10-27.md).

## 1. Mục tiêu và bằng chứng

Đối ứng các lỗi của video **Mâm Cơm Cúng Bưng Vào Hiên**, đồng thời sửa cách dựng chung cho nhiều truyện ma, lịch sử và nội dung minh họa khác. [Báo cáo 17 cảnh và ảnh đối chiếu](video-references/mam-com-cung-audit-20261027/README.md) là bộ hồi quy đầu tiên, không phải bộ quy tắc riêng theo tên người/vật của truyện này.

Yêu cầu đã chốt:

- Ảnh chủ yếu minh họa: đúng người, nơi, đồ vật, tỷ lệ, trạng thái và quan hệ thiết yếu. Không ép diễn mọi động từ. Mở cửa có thể minh họa bằng người đứng cạnh cửa với trạng thái cửa phù hợp.
- **Giữ tư thế chỉ tác động nhân vật.** Mưa, khói, lửa và những vật có chuyển động phù hợp không bị đóng băng theo công tắc nhân vật. Bàn ghế, di ảnh, cột nhà không tự rung/lắc.
- Không rung khung, không chớp sáng; camera rất nhẹ nếu được bật. Hình tối nhưng manh mối phải đọc được.
- UI, preview, ảnh kiểm, xuất thủ công, tự động, tiếp tục và tải lại phải hiểu cùng một cấu hình.
- Chọn kho tiếp tục dùng kho theo gói; chọn Remotion đi đúng nhánh Remotion. Giữ voice, SEO, room/retry, SVG parser, cutout, checkpoint và UI tương tác đã sửa.
- Sau khi lập plan, người dùng đã yêu cầu triển khai. Phạm vi triển khai gồm sửa code và kiểm offline; không gọi AI/TTS thật, không tạo/resume video sản xuất và không restart backend trong lượt này.

## 2. Kết quả đọc code hiện tại

| Vấn đề | Đường code đã kiểm | Kết luận |
| --- | --- | --- |
| UI đặt tên theo nhân vật | `constants/motionReference.ts`; `components/MotionVideoCreator.tsx` | `characterMotion` có nhãn Chuyển động nhân vật, trạng thái Giữ tư thế/Có chuyển động. Ý nghĩa này phải được bảo toàn. |
| Remotion dùng sai phạm vi | `server/services/remotion/storyCompiler.ts:74`; `remotion/StoryComposition.tsx:14–17` | `characterMotion → spec.motion → scale` toàn bộ lớp nền/người/vật, tối đa 0,8% mỗi cảnh. Chưa có actor animation riêng. |
| Hiệu ứng cảnh chưa có contract riêng | `types/motionVisual.ts`; `constants/motionRemotionPrompts.ts`; `remotion/StoryComposition.tsx` | Chỉ có background SVG và node character/prop/label. Mưa/khói vẽ trong SVG là hình tĩnh; renderer chưa có effect layer theo frame. |
| Nhánh kho cũng có chỗ dùng chung cờ | `motion-engine/puppet2d.js:432–440,1161–1162,1294,1324` | Actor và một số hiệu ứng bóng/ma dùng S.motion; rain overlay lại dùng thời gian trực tiếp. Cần tách theo đúng ý nghĩa; không khẳng định mọi hiệu ứng kho đều đang bị khóa. |
| Kích thước đạo cụ quá chung | `lib/motionRemotion.ts:51–60` | Nhân vật cao cơ sở 48% khung, prop 30%, rồi giới hạn ngang. Không xét cột/cửa/vật cầm/chén/di ảnh theo vật đỡ hoặc người. |
| Gắn điểm chưa đúng tiếp xúc | `lib/motionRemotion.ts:67–73` | on/heldBy dùng base của đối tượng để gắn vào surface/grip. Người ngồi bị đặt chân lên mặt ghế; mâm cầm không có tỷ lệ và điểm tiếp xúc phù hợp. |
| Kiến trúc thành vật rời | Dữ liệu cảnh 3/6/12/14 và layout hiện tại | Cột, cửa, ngạch cửa chưa có liên kết lắp với nền; slot không biểu diễn được chỗ lắp. |
| Mất liên tục | `server/services/remotion/scenePipeline.ts:180,202–204`; `sceneKeys.ts` | Scene request chủ yếu có beat hiện tại; không có trạng thái nối tiếp đã chuẩn hóa. Khóa nền theo environment tự do. Video có 16 backgroundKey/17 cảnh trên ba place ID; cảnh sáng dùng lại nền đêm. |
| Kiểm kỹ thuật còn thiếu kiểm nghĩa | `sceneContract.ts`; `lib/motionRemotion.ts:135` | Cast ID, target, phủ câu, bounds và SVG hợp lệ chưa chứng minh vị trí/trạng thái minh họa đúng. Review tắt là hợp lệ; không dùng bật review làm cách sửa thay solver. |
| Tái dùng hiện có cần giữ | `hooks/useMotionStudio.ts`; `motionProductionService.ts`; `motionProductionActions.ts`; `motionRenderService.ts` | Đã có stateRef, production snapshot, guard revision compile, phân nhánh renderer, audio mix và kiểm output. Chuẩn hóa tại các đường này, không tạo production runner thứ hai. |

Không quy lỗi âm thanh khi chưa nghe: video đã đo -14 LUFS và -0,9 dBFS true peak; 17 clip vẫn unchecked. Việc rõ chữ/nhịp đọc cần nghiệm thu riêng theo mẫu Thần trùng, không tự đổi voice/filter trong đợt sửa hình.

## 3. Hợp đồng cấu hình đích

### 3.1. Một bộ cấu hình chuẩn, nhiều adapter dựng

Đề xuất một đối tượng `renderBehavior` có version, dùng chung UI/API/snapshot/spec. Tên trường là thiết kế dự kiến, chốt khi triển khai theo conventions hiện có:

```ts
type RenderBehavior = {
  version: 1;
  actors: "fixed" | "simple";
  sceneEffects: "off" | "gentle";
  camera: "fixed" | "gentle";
};
```

| UI | Ý nghĩa bắt buộc | Mặc định đề xuất |
| --- | --- | --- |
| Chuyển động nhân vật: Giữ tư thế / Có chuyển động | Chỉ actor; không đổi vị trí nền, prop hoặc camera | Giữ tư thế, kế thừa đúng `characterMotion` cũ |
| Hiệu ứng cảnh: Tắt / Nhẹ | Mưa, sương, khói, lửa và chuyển động vật được hỗ trợ, chỉ khi cảnh có nguồn/sự kiện hợp lệ | Nhẹ; không có hiệu ứng trong nội dung thì không tự thêm |
| Camera: Cố định / Rất chậm | Chỉ biến đổi khung nhìn; không dùng để giả chuyển động nhân vật | Cố định |

Không thêm công tắc cho từng loại khói/đèn/mưa. Cường độ, tốc độ và vùng được khai trong dữ liệu cảnh theo preset có giới hạn. Tên, tooltip, default, enum, URL và thông báo để trong constants dùng chung; không rải text cứng.

Phụ đề, review ảnh, SFX và nhạc tiếp tục là những cấu hình độc lập đã có. Tắt SFX không làm mất mưa nhìn thấy; tắt hiệu ứng cảnh không tự tắt âm thanh đã chọn. Quan hệ hình/tiếng chỉ giúp định hướng nội dung, không được nối nhầm các công tắc.

### 3.2. Ma trận hành vi bắt buộc

| Nhân vật | Hiệu ứng cảnh | Kết quả |
| --- | --- | --- |
| Giữ tư thế | Nhẹ | Người không di chuyển/cử động; mưa rơi, khói/lửa chuyển động nhẹ đúng nguồn |
| Giữ tư thế | Tắt | Người và các lớp cảnh tĩnh; camera chỉ thay đổi nếu công tắc camera bật |
| Có chuyển động | Nhẹ | Chỉ actor/hành vi được renderer hỗ trợ chuyển động; môi trường hoạt động độc lập |
| Có chuyển động | Tắt | Actor được phép chuyển động; mưa/khói/lửa không có hoạt ảnh |

Mỗi hàng chạy với camera cố định và rất chậm, tạo thành tám tổ hợp. Chỉ nội suy chuyển động actor đã có dữ kiện và ràng buộc; không làm mọi người nhún nhảy. Không làm người kể cử động miệng. Nếu có mouth animation, chỉ gắn đúng nhân vật thoại và khoảng clip thật, đồng thời tuân thủ chế độ actor.

### 3.3. Nguồn cấu hình và migration

- Chuẩn hóa một lần ở biên UI/API. Snapshot production khóa giá trị đã chọn; render không đọc lén thiết lập global hoặc UI của dự án khác.
- Manual dùng snapshot thao tác hiện tại; auto/resume dùng input đã lưu của production. UI nêu rõ cấu hình nào đang áp dụng nếu khác bản đang chỉnh. Không tự nối resume vào lựa chọn mới.
- Dữ liệu cũ thiếu renderBehavior: chuyển `characterMotion` sang actors đúng boolean. Không chuyển cờ đó thành camera zoom. Hai trường mới có default/version rõ và log migration một lần khi cần.
- Không giữ hai trường actor cũ/mới là hai nguồn độc lập. Adapter tương thích đọc cũ tại biên; nếu cùng có thì contract mới có ưu tiên rõ, trường cũ chỉ do adapter sinh ra cho engine chưa nâng cấp.
- File MP4 đã xuất giữ nguyên. Snapshot cũ chỉ được nâng cấp khi đọc/tiếp tục theo lệnh có chủ ý; tải lại trang không gọi AI/render.
- Đổi công tắc actor/effects/camera chỉ biên dịch lại phần phụ thuộc; không viết lại truyện, voice, SEO hoặc tạo room mới. Nếu ảnh cũ chứa mưa/khói đã vẽ cứng cần thay layer, chỉ dựng lại asset liên quan sau lệnh dựng/tiếp tục; không giả tắt được một hình đã vẽ dính.

## 4. Kiểm cấu hình từ đầu đến cuối

Mỗi dòng phải có: nơi khai báo/default → UI → persist → payload → normalize → snapshot/resume → compiler → preview → export → cache/revision. Phân biệt **đã tìm thấy đường code** với **đã nghiệm thu kết quả**; bản này chưa đánh dấu các dòng đã đạt end-to-end.

| Nhóm cấu hình | Điều kiện phải chứng minh |
| --- | --- |
| Phương thức dựng, gói kho, kiểu hình Remotion | Hai nhánh tách đúng; field bị ẩn không lọt sang nhánh còn lại; giữ lựa chọn sau reload. Đổi phương thức giữ nguồn/voice hợp lệ và invalidate đúng hình. |
| Actors/effects/camera | Đúng ma trận mục 3; preview/still/export có cùng hình tại cùng frame. Không còn boolean nhân vật làm global zoom. |
| Tỷ lệ khung | 16:9, 9:16, 1:1, 4:5 dùng lại quan hệ ngữ nghĩa nhưng bố trí lại theo vùng an toàn; không kéo méo SVG, cắt người/manh mối hoặc đặt dưới sub. |
| FPS, chất lượng, encoder | Thời gian hành vi tính theo giây; đổi fps không đổi tốc độ mưa/khói/camera. Chất lượng không đổi quan hệ và identity. Remotion CPU đúng khả năng hiện có, không ghi GPU trong UI rồi âm thầm dùng CPU. |
| Phụ đề | Tắt loại khỏi preview/export nhưng vẫn giữ speechRanges để kiểm voice. Bật không nền/chớp; vùng chữ được layout dành chỗ. Timing theo clip/alignment khả dụng, không coi trọng số chữ là khớp từng âm. |
| Review ảnh | Tắt không gọi AI review/không render chỉ để review; vẫn có local checks. Bật giữ cache theo scene/design/layout/setting revision và sửa đúng lỗi. Không xét chuyển động từ một ảnh tĩnh. |
| SFX và mức âm/override | Tắt không tạo/mix SFX; bật giữ volume/override qua reload/resume. Không gán bước chân cho actor đang giữ yên nếu không có nguồn ngoài khung. |
| Nhạc nền, mood, volume | Manual/auto cùng quy tắc off/auto/forced; không trộn hai lần. API hiện đã chặn mood off ở `startMotionVideoRenderInput`, phải giữ guard này; không kết luận lỗi chỉ vì production gửi object music. |
| Kênh voice, ASR, ngôn ngữ | Không bị thay bởi chỉnh hình/chuyển động. ASR off không chạy nhận dạng nhưng PCM/duration/mux vẫn được kiểm. Voice theo mẫu Thần trùng và phân vai hiện có. |
| AI chính, AI dựng, room/retry | Đúng nhóm công việc/provider ưu tiên; kế thừa pool ba room và retry hiện có, không thêm đường gọi AI riêng cho hiệu ứng runtime. |
| Thể loại, độ dài, số phần | Ảnh minh họa và profile phù hợp; sửa tỷ lệ/hiệu ứng không đổi cốt truyện. Thời lượng dài không làm tăng tốc hành vi hoặc tắt hiệu ứng do cache ảnh tĩnh. |
| Tự viết, tự xuất, dừng/tiếp tục | Không tự chạy khi reload; autoExport off kết thúc ở trạng thái đã dựng chờ xuất. Resume tiếp phần đạt, không đổi cấu hình âm thầm. |

Lưu manifest `resolvedSettings` và các revision/hash cần thiết cho lượt xuất để truy lại đúng lựa chọn. Không log toàn bộ SVG/prompt vào UI; log tóm tắt cấu hình hiệu lực và lý do phải dựng lại.

## 5. Bố cục theo vai trò và quan hệ

### 5.1. Phân loại theo cách đặt, không liệt kê mọi danh từ

Các vai trò tối thiểu: kiến trúc gắn nền, nội thất đỡ vật/người, đồ đặt, đồ cầm, dấu vết trên bề mặt, nguồn hiệu ứng và actor. Chén/di ảnh/mâm/cột là ví dụ hồi quy, không phải các nhánh if theo tên trong truyện.

- Tỷ lệ theo người/vật đỡ/khoảng không gian; dùng kích thước và bounds của phần hình thực, không chỉ viewBox có lề rỗng.
- Nền cung cấp các vùng sàn, tường, ngoài trời, mặt phẳng và vị trí lắp. Kiến trúc không đổi có thể nằm trong nền; phần cần thay trạng thái là component gắn socket, không đặt bằng đường chân chung.
- Nhân vật có ground/contact anchor; người ngồi dùng seat contact; người nằm dùng vùng đỡ phù hợp. Vật cầm có điểm tiếp xúc/giới hạn kích thước theo tay và thân.
- Cửa gắn vào đúng ô cửa; ngạch cửa cùng độ rộng/vị trí lối đi. Cột nối chân sàn với mái. Di ảnh trên bàn thờ không tự xuống sàn khi đổi góc.
- Dấu chân/gạo muối là decal theo mặt sàn/lối đi, có hướng và phạm vi đọc được; không phải prop đứng thẳng cao 30% khung.
- Depth và vùng che giữ mặt/người/manh mối đọc được; vật được cầm không phủ sai cả thân. Không thêm bóng hoặc độ mờ để che một lỗi bố trí.

### 5.2. Phục hồi đơn giản, không thêm diễn hoạt khó

1. Giải đúng tỷ lệ, contact và mount với hình đang có.
2. Đổi bố cục/cỡ cảnh trong cùng địa điểm khi cần làm rõ quan hệ/manh mối.
3. Nếu tư thế phụ khó, dùng đứng/ngồi trung tính cạnh đúng vật; ví dụ người đứng cạnh cửa thay vì diễn bàn tay mở cửa.
4. Chỉ sửa node/asset cốt lõi không biểu diễn được trạng thái đã xác nhận. Không thay sai người/vật/màu/số lượng hoặc bỏ manh mối để qua kiểm.

Giữ local check trọng tâm: fits khung chỉ là điều kiện đầu tiên; kiểm thêm tỷ lệ tương đối, contact, socket, vùng đọc và state. Ngưỡng là theo loại quan hệ, có fixture, không tăng hàng loạt QA cảm tính.

## 6. Địa điểm, trạng thái và cách chia cảnh

- Một location design ổn định cho mỗi nơi vật lý; các view/camera và lighting state tham chiếu design đó. Ánh sáng sáng/chiều/đêm không đổi loại bàn thờ hay cấu trúc cửa.
- Chuẩn hóa một sổ trạng thái ngắn: time, weather, người hiện diện, owner, vị trí, open/closed, đầy/rỗng, dấu vết và thay đổi ngoại hình có căn cứ.
- Đọc diễn biến theo thứ tự để có state trước/sau; prompt cảnh chỉ nhận snapshot cần dùng, delta sự kiện, ID thiết kế và phần lời liên quan. Không gửi cả truyện/SVG trong mọi prompt.
- Một sự kiện không có bằng chứng thay đổi thì kế thừa state phù hợp. Không suy ra chén bị đổ từ chữ bỏ quên; không đặt lại mâm đầy sau khi đã ăn hết; không làm mâm biến mất khi câu tiếp chỉ là lời thoại.
- Giữ một ảnh cho các câu cùng việc; đổi hình khi đổi nơi, chủ thể hoặc manh mối. Cận cảnh manh mối dùng cùng vật/địa điểm, không sinh ngôi nhà khác. Không mặc định mỗi câu một layout mới.
- Scene/state kế thừa làm theo DAG. Xác lập snapshot ngữ nghĩa trước; vẽ asset hoặc những scene có đủ snapshot vẫn chạy trên ba room độc lập. Không bắt room B chờ room A vì thứ tự hàng đợi; chỉ chờ dependency thực.
- Sửa một sự kiện chỉ truyền invalidate về sau đến lúc state hội tụ lại. Giữ voice/SEO nếu lời không đổi; sửa timestamp không gọi lại AI dựng ảnh.

## 7. Lớp hiệu ứng và chuyển động của đồ vật

### 7.1. Contract có nguồn và vùng

Mỗi hiệu ứng có ID, loại được hỗ trợ, source node/socket, vùng/mask, depth, thời gian, seed và cường độ giới hạn. Nguồn phải tồn tại khi hiệu ứng cần nguồn. AI chỉ khai ý nghĩa; code có sẵn tính chuyển động. Không cho AI trả JavaScript/CSS animation hoặc nới sanitizer để thực thi SVG động.

Đợt đầu tập trung các hiệu ứng lặp dùng được cho nhiều video:

- Mưa: vùng ngoài trời/cửa sổ; mái, tường và actor trong nhà che đúng. Không phủ mưa xuyên phòng.
- Khói nhang/hơi: phát từ đầu nhang/nồi/vật đúng; hướng đi theo state khi lời nhấn mạnh sát đất/hướng cửa. Thiếu emitter không phun từ giữa khung.
- Lửa đèn/nến: chỉ phần ngọn lửa và quầng sáng nhỏ thay đổi chậm; thân đèn không rung, toàn cảnh không nhấp nháy.
- Sương và chuyển động nhẹ của vật được hỗ trợ: dùng vùng và pivot đúng; chỉ xuất hiện khi có trong cảnh. Không tự đung đưa mọi đồ vật.

Có thể tái dùng toán học/seed và metadata effectSource/effectTarget của nhánh kho sau khi rà caller; giữ adapter vẽ Canvas và React riêng. Không sao chép một engine thứ ba.

### 7.2. Tính lặp lại và hiệu năng

- Vị trí tại frame là hàm thuần của frame/fps, seed và contract. Không Date.now, Math.random hay bộ đếm tăng theo render.
- Seek tới giữa, render đảo thứ tự frame và render song song cho cùng kết quả. Cùng mưa/khói qua hai câu trong một địa điểm không reset pha nếu còn cùng sự kiện.
- Mặt sàn/camera và emitter cùng hệ tọa độ; zoom/pan không làm khói rời đầu nhang.
- Dùng số hạt/lớp giới hạn theo profile/quality; draft vẫn giữ nguồn/vùng/hành vi đúng. Không cache lặp một ảnh tĩnh cho đoạn còn hiệu ứng động.
- Hiệu ứng trang trí lỗi có thể bỏ đúng lớp và log; không làm dừng cả truyện. Hiệu ứng là manh mối cốt lõi cần một trạng thái tĩnh đọc được hoặc sửa cục bộ, không âm thầm bỏ mất.

## 8. Camera, chuyển cảnh, phong cách và sub

- Gỡ liên kết characterMotion với zoom toàn cảnh. Camera riêng mặc định cố định; bật thì dùng preset rất chậm, giới hạn theo giây và biên độ tổng, không reset mỗi câu.
- Chuyển cảnh cùng nơi giữ cấu trúc và vị trí; đổi view có lý do. Không hòa dài hai bố cục khác nhau làm nhân đôi người/vật. Xử lý cắt/fade/dip tại compiler/renderer thống nhất, không để mỗi adapter tự hiểu một kiểu.
- Truyện ma dùng bảng màu trầm, khuôn mặt và dấu hiệu tương phản đủ đọc. Giữ nhận dạng giữa base SVG/pose/biến thể; không làm bóng ma dễ thương hoặc đổi màu được lời nêu rõ.
- Không đánh giá giống mẫu chỉ bằng màu tối hay prompt đúng. Nghiệm thu bảng ảnh thực, tỷ lệ người với nền, đọc manh mối và nhịp thay cảnh.
- Phụ đề không nền, không chớp. Giữ renderer chung preview/still/export; đổi style sub không đổi scene plan hoặc voice. Chưa có word alignment thì chỉ công bố caption theo cụm/clip.

## 9. Cache, phiên bản và bảo toàn công việc đã đạt

| Thay đổi | Phần cần tính/dựng lại | Phần giữ |
| --- | --- | --- |
| Actor/effects/camera toggle, FPS | Resolved behavior, timing/frame/effect tracks, spec và preview/render liên quan | Lời, voice, SEO và artwork tĩnh còn hợp lệ |
| Aspect hoặc layout revision | Layout, mask, camera crop, ảnh kiểm và render | Identity/design/SVG có thể dùng lại nếu không bị cắt sai |
| Sai tỷ lệ/contact/mount | Solver và node liên quan; ảnh kiểm cảnh bị ảnh hưởng | Những scene/design không phụ thuộc lỗi |
| Sai trạng thái thời điểm/địa điểm | State delta/view/lighting/các cảnh kế thừa đến hội tụ | Voice/SEO khi text không đổi; asset identity đạt |
| SVG cũ có mưa/khói vẽ dính | Chỉ lớp nền/prop cần tách, có lưu bản đối chiếu | Người, đồ khác, timeline và kết quả MP4 cũ |
| Chỉnh màu/identity của một người/vật | Design/instance và scene dùng nó theo state | Các nhân vật và địa điểm khác |
| Review on/off | Review task/key đúng cấu hình | Scene đã dựng, voice và SEO |

Keys cần tách designRevision, layoutRevision, effectRevision, resolvedSettings và continuityInputKey. Bundle cache hiện chỉ hash danh sách file cố định trong `motionRemotionRenderService.ts`; khi tách thêm component effect/layout, phải đưa dependency thật vào fingerprint hoặc dùng build manifest. Không để file mới đổi mà backend dùng bundle cũ.

Không tăng budget retry chỉ do đổi setting không liên quan; không xóa cả state.gen để sửa một node. Snapshot không tương thích có adapter/version và log rõ, không tự biến thành dự án mới.

## 10. QA, log và phục hồi

Chặn khi sai chủ thể/số lượng/đặc điểm cốt lõi, mount/contact nghiêm trọng, mất lời/cảnh hoặc cấu hình xuất không khớp. Không chặn vì thiếu một động tác phụ, nét vẽ khác nhẹ hoặc độ dài câu chưa khít mục tiêu.

- Diagnostics có stage, sceneIndex/total, nodeId, relation/field và nguyên nhân; bản đầy đủ lưu backend, UI cho mở chi tiết. Không chỉ hash và câu XML bị cắt.
- Sửa geometry bằng code trước gọi AI. Chỉ hỏi metadata/anchor hoặc SVG node không đạt; không gọi AI để sửa timestamp/toggle/fps.
- Retry room theo cơ chế đang có; giữ phần đạt. CAPTCHA chờ người xác minh và cảnh báo theo chức năng hiện có, không retry vô hạn.
- Review off vẫn chạy local invariants. Review on chỉ xem ảnh/nhóm cần thiết, không biến review thành yêu cầu bắt buộc hay thêm hàng chục prompt.
- Log tách dựng kế hoạch, nền/người/vật, bố trí, hiệu ứng, review, voice, SEO, render. Ghi rõ Cảnh x/y và trạng thái chờ/đã dừng/cần sửa.
- Giữ phân trang, mở ảnh và thao tác log hoạt động trong khi dựng; chỉ khóa lệnh có thể làm thay đổi đầu vào đang chạy.

## 11. Đầu việc triển khai và thứ tự

Các mã dưới đây là phạm vi gốc. Tình trạng sau triển khai nằm ở mục 16; phân biệt code đã kiểm kỹ thuật với nghiệm thu hình/âm thanh thực tế.

| Mã | Ưu tiên | Việc cần làm | Hoàn tất khi |
| --- | --- | --- | --- |
| S01 | P0 | Inventory cấu hình và bảng mapping chung; thêm resolve/migrate renderBehavior | UI/manual/auto/resume/API đọc một nghĩa; không có cờ nhân vật điều khiển camera/effect |
| S02 | P0 | Persist/snapshot/resolvedSettings, compile/render signatures và capability theo hai nhánh | Reload không đổi/tự chạy; lựa chọn không bị bỏ qua; field ẩn không lọt nhánh |
| L01 | P0 | Role kích thước, visual bounds và layout theo mặt phẳng | Cửa/cột/di ảnh/chén/mâm tương quan đúng, không scale chung 30% |
| L02 | P0 | Contact, mount/socket, heldBy, decal, depth và vùng sub | Ngồi không đứng trên ghế; di ảnh không dưới sàn; mâm không che thân; dấu chân đi đúng lối |
| C01 | P0 | Location design/view/light và event state nối tiếp | Không đổi kiến trúc vô cớ, sáng không về đêm, vật không tự đổ/mất |
| C02 | P1 | Nhịp hình theo sự kiện, prompt snapshot nhỏ và dependency DAG | Giữ ảnh khi cùng việc, đổi khi cần; ba room làm phần độc lập |
| E01 | P1 | Contract effect/emitter/mask và React layers mưa/khói/lửa/sương | Actor fixed vẫn có hiệu ứng; đúng nguồn, vùng, fps và seek |
| E02 | P1 | Actor motion riêng; camera riêng; adapter kho theo phạm vi | Bốn chế độ actor/effects × hai camera đúng, không nhảy/rung toàn cảnh |
| S03 | P1 | Tách lớp vẽ dính và migration/cache/bundle revisions | Cache cũ không che code mới; chỉ làm lại lớp phụ thuộc |
| V01 | P0 | Local QA + repair cục bộ + diagnostics | Bắt lỗi sai nghĩa quan trọng; không dừng vì động tác minh họa phụ |
| V02 | P1 | Preview/thumbnail/review/export chung; bảng hồi quy hình và cấu hình | Cùng frame/cấu hình cho cùng hình; không đánh dấu đạt chỉ từ typecheck |
| V03 | P1 | Rà âm thanh/sub/SFX/music/ASR theo ma trận settings, giữ bản sửa trước | Không nhầm công tắc hình–tiếng, không đổi voice, không mix lặp |
| V04 | P2 | Dọn field/helper/caller cũ và cập nhật tài liệu/UI | Không còn đường global motion sai nghĩa; không xóa code kho còn dùng |

Thứ tự: S01–S02 → L01–L02 + C01 → V01 → E01–E02 + C02 → S03/V02/V03 → V04. Các mục độc lập có thể xử lý song song trong code, nhưng không mở rộng scope bằng cách tự chạy video thật.

## 12. File/module dự kiến tác động

- Cấu hình/types: `src/types/motionVisual.ts`, `src/types/motionVideo.ts`, `src/constants/motionVisual.ts`, `src/constants/motionReference.ts`, `src/lib/motionVisual.ts`; helper resolve settings dùng chung ở lib.
- UI/state: `src/components/MotionVideoCreator.tsx`, `src/hooks/useMotionStudio.ts`, các controls/preview Remotion hiện có. Tái dùng component toggle/select chung; không tạo UI phụ trùng.
- Input/orchestration: `src/server/services/motionProductionActions.ts`, `motionProductionService.ts`, checkpoint/store hiện tại.
- Scene/state: `src/server/services/remotion/sceneContract.ts`, `sceneKeys.ts`, `scenePipeline.ts`, `storyCompiler.ts`, `soundCompiler.ts`, `src/constants/motionRemotionPrompts.ts`.
- Geometry: refactor `src/lib/motionRemotion.ts` thành helper vai trò/bounds/contact/layout thuần, dùng lại cho readiness/preview/compiler; không có ba solver lệch nhau.
- Renderer: `src/remotion/StoryComposition.tsx`; effect/actor/camera components nhỏ và deterministic; `src/server/services/motionRemotionRenderService.ts` cho bundle fingerprint.
- Adapter kho: `motion-engine/puppet2d.js` và constants/compiler tương ứng, chỉ sửa scope motion/effect khi có fixture chứng minh; giữ dữ liệu và policy hai gói.
- Verification: mở rộng `scripts/verify-motion-remotion*.ts`, kiểm production runner/closed pipeline/settings đang có; thêm fixtures quan hệ/hiệu ứng/cấu hình cần thiết, không tạo một bộ test chỉ lặp implementation.

## 13. Dọn code có kiểm soát

- Thay `spec.motion` boolean chung trong Remotion bằng adapter version → behavior rõ; xóa nhánh dùng boolean đó để zoom khi mọi caller đã chuyển.
- Tìm mọi S.motion/kit.motion/characterMotion trong engine kho, sound và camera; phân đúng actor/effect/camera. Không global search-replace vì rain hiện có logic thời gian độc lập.
- Thay một công thức kích thước/contact chung bằng solver mới, không chồng một lớp sửa tên riêng phía sau solver cũ.
- Gộp defaults, normalize, mapping manual/auto và migration trùng; rút field không còn caller sau khi có kiểm snapshot cũ.
- Giữ sanitizer SVG, parser bảo toàn thẻ, alpha cutout, cache giữ phần đạt, room recovery và log persist. Không nới XML/an toàn để giảm lỗi không liên quan.
- Với SVG vẽ dính, không xóa tất cả đường chéo/nét trắng để đoán mưa/khói. Chỉ tách bằng metadata có căn cứ hoặc dựng lại đúng layer.
- Không xóa tài nguyên kho đang hoạt động, snapshot lịch sử hay video đã xuất. Chỉ dọn artifact thử nghiệm thật sự không còn caller/phụ thuộc theo phạm vi được duyệt.

## 14. Nghiệm thu không gọi AI/TTS thật trước

1. Dùng dữ liệu video vừa audit và fixture tổng quát: người đứng/ngồi/nằm; chén trên bàn; ảnh trên bàn thờ; cửa/cột/ngạch cửa; vật cầm; dấu chân; ba người và ma áo trắng.
2. Kiểm lời kể đổi sáng/tối, cửa mở/khép, mâm đầy/rỗng, người giữ vật qua câu thoại. Chỉnh một node chỉ thay cảnh phụ thuộc.
3. Tám tổ hợp actor/effects/camera tại 24/30/60 fps và bốn aspect; kiểm theo nhóm độc lập, không nhân mọi tổ hợp khác thành một ma trận render khổng lồ.
4. So ảnh tại cùng frame giữa preview/still/export; đầu/giữa/cuối hiệu ứng; seek và render frame không theo thứ tự. Mưa không vào nhà, khói không rời nhang khi camera chạy.
5. Đường manual/auto/resume/reload, snapshot cũ/mới, review on/off, sub on/off, SFX/music off/on, CPU/capability, quality và mode kho/Remotion. Mock AI/TTS để kiểm payload/không gọi bước bị tắt.
6. Kiểm renderer bundle thay khi dependency effect component đổi. Cache không lặp ảnh tĩnh cho cảnh có dynamic layer.
7. Bảng ảnh trước/sau đầy đủ 17 cảnh để đối chiếu từng lỗi audit; không hardcode theo tên Mâm Cơm/Chị Hai. Fixture truyện khác/lịch sử dùng cùng invariant.
8. Nghiệm thu phong cách và nghe voice thật là bước riêng. Typecheck/test/MP4 có hình không chứng minh giống mẫu hoặc rõ chữ.

Không tự tạo/resume video 2/5/20 phút để nghiệm thu plan. Khi triển khai, ưu tiên test thuần, mock và ảnh/đoạn kỹ thuật ngắn ngoại tuyến đúng phạm vi được cho phép; video dự án thật do người dùng chạy hoặc theo yêu cầu riêng sau đó.

## 15. Điều kiện đóng plan

- Các lỗi tỷ lệ/contact/mount/state quan sát trong video audit đều có bằng chứng sửa trên ảnh, cùng fixture khác câu chuyện để chứng minh tính chung.
- Mọi cấu hình trong mục 4 có mapping, snapshot và kết quả kiểm tương ứng; phần chưa hỗ trợ phải được thể hiện đúng khả năng thay vì bật mà không tác dụng.
- Giữ tư thế không làm mất mưa/khói/lửa; camera cố định thật sự không scale khung; props tĩnh không tự rung.
- Kho vẫn chạy đủ hai gói và không phát sinh artwork ngoài kho; Remotion vẫn tạo thiết kế theo dự án, giữ identity khi tái xuất hiện.
- Không còn bản sửa riêng cho tên truyện/vật, không retry vô hạn, không xóa phần đạt và không che lỗi nghĩa bằng QA quá lỏng.
- Báo cáo triển khai ghi từng mã đã làm, bằng chứng, giới hạn còn lại; không đánh dấu toàn bộ hoàn tất khi chỉ xong settings hoặc render kỹ thuật.

## 16. Tình trạng sau triển khai 27/10/2026

| Mã | Đã đối ứng | Nghiệm thu/giới hạn |
| --- | --- | --- |
| S01 | Contract version 1 và helper normalize/resolve/apply chung; cờ cũ chỉ chuyển thành actor | Ma trận tám tổ hợp đã kiểm trên cả hai adapter |
| S02 | UI/persist/payload/production snapshot/compile signatures/resolvedSettings | Kiểm mock và snapshot; chưa thao tác một lượt sản xuất thật trong đợt này |
| L01 | Alpha bounds, kích thước theo role/quan hệ, tách fixture khỏi phép co toàn nhóm | Fixture bốn aspect và 17 cảnh lưu dựng được; chưa xác nhận toàn bộ artwork cũ đạt |
| L02 | Seat/body contact, grip, mount/socket, decal, giới hạn vật cầm và vùng dưới khung | Anchor sai trong artwork cũ cần sửa metadata khi chủ động dựng tiếp |
| C01 | Location design ổn định, ánh sáng tách nền, objectId/state ledger, draft gốc tách state kế thừa | Cần AI cung cấp đúng identity/evidence; không coi việc suy luận mọi tình tiết đã được chứng minh |
| C02 | Gộp câu cùng sự kiện trong prompt; lập kế hoạch → resolve theo thứ tự → hydrate ba room; sửa review truyền lại cảnh phụ thuộc với số vòng hữu hạn | Chưa đo nhịp chia cảnh từ một lượt AI thật; chưa có tự động gộp hai beat khác nhau thành một beat |
| E01 | Mưa/sương theo vùng; khói/hơi/lửa theo nguồn; sway theo pivot; clue tĩnh khi tắt hiệu ứng | Hiệu ứng Remotion chạy từ metadata; không biến nét mưa/khói đã vẽ dính thành hoạt ảnh |
| E02 | Actor/effects/camera độc lập cho kho và Remotion; bỏ flicker ma; camera Remotion chậm và giữ chủ thể trong khung | Remotion actor chỉ có chuyển động nhẹ được hỗ trợ, không diễn đầy đủ hành động; giữ chuyển cảnh kho hiện có, Remotion dùng cắt cảnh |
| S03 | Revision lớp hình, invalidation cục bộ, sửa anchor/region không vẽ lại, fingerprint dependency thực | Nền cũ được yêu cầu dựng lại khi bấm dựng/tiếp tục; reload không gọi AI |
| V01 | Giữ QA kỹ thuật/cutout; giản lược tư thế phụ; báo node/field; phục hồi riêng cảnh/metadata | Local QA không chứng minh toàn bộ ý nghĩa hình đúng lời khi review tắt |
| V02 | Player/still/export chung renderer, grid theo setting, kiểm frame thật, bảng đối chiếu 17 cảnh | Đã kiểm đường renderer bằng still; chưa chạy MP4 mới, chưa nghiệm thu giống video mẫu |
| V03 | Giữ voice/ASR/music/SFX; sub off không đổi duration/SFX; settings âm thanh độc lập hiệu ứng hình | Chưa nghe lại voice/mix thật; chưa đóng toàn bộ ma trận âm thanh ở mục 4 |
| V04 | Gỡ boolean nhân vật khỏi zoom/effect; helper chung; giữ adapter đọc cũ và code kho còn caller | Không xóa các sửa có sẵn hay tài nguyên đang hoạt động |

Plan còn mở ở phần nghiệm thu: artwork cũ có đồ vẽ dính, bảng đối chiếu phong cách, kiểm MP4/âm thanh thật, toàn bộ ma trận UI/manual/auto và chính sách chuyển cảnh đồng nhất giữa hai engine. Không đánh dấu các mục đó đã đạt bằng typecheck hay ảnh fixture.

## 17. Rà lại lượt xuất thực tế 15:35 ngày 27/10/2026

[Audit Mâm Cúng Bên Bến Sông](video-references/mam-cung-ben-ben-song-audit-20261027/README.md) xác nhận bản sửa chưa được áp dụng vào lượt xuất này. Backend PID 9788 khởi động 11:46 trước các sửa trên đĩa; input UI có renderBehavior nhưng compiled spec/result không có manifest mới.

Ngoài vấn đề nạp backend, phát hiện **S03/C01/V02 chưa hoàn chỉnh về migration phân cảnh cũ**: 18/18 beat cũ khớp `remotionBeatKey` hiện tại. Key chưa chứa scene contract revision, trong khi resolve gán layoutRevision mới chưa chứng minh đã replan. Vì thế restart đơn thuần không đủ để nghiệm thu.

| Việc cần đối ứng tiếp | Điều kiện đạt |
| --- | --- |
| Scene contract revision riêng, tham gia planning/cache key | Đổi contract buộc replan/repair đoạn cũ chưa đạt; không đổi key khi chỉ toggle/fps |
| Chỉ ghi revision sau assess thành công | Resolve geometry không tự nâng dấu xác nhận contract ngữ nghĩa |
| Invalidate scene/compiled/review theo dependency | Không xuất lại spec cũ sau khi migrate; giữ voice/SEO và artwork dùng được |
| Nhận diện phiên bản backend đang phục vụ | Log/manifest cho truy được phiên bản thật; xác nhận nạp code trước chạy sản xuất |
| Hồi quy trên saved job cũ bằng mock | Chứng minh 18 đoạn cũ không bị coi đạt chỉ vì hash nội dung giống; resume phần đã migrate không hỏi lại |

Đây là bổ sung sau kiểm video người dùng vừa chạy. Lượt audit chỉ đọc/trích ảnh, chưa sửa runtime hoặc restart.

## 18. Đối ứng theo mẫu ĐI ĐÁM MA ĐỪNG LẠY BỐN LẠY

Chi tiết trong [chuẩn chất lượng Remotion theo mẫu](motion-remotion-reference-quality-2026-10-27.md). Đã bổ sung scene contract revision, migration đọc checkpoint cũ, compiler guard, bỏ dấu hoàn tất hình/xuất khi tiếp tục production lỗi thời, giữ voice/SEO/artwork, camera theo thời gian từng shot và focus cho hình cận. Backend mới PID 1944 đã khởi động 16:08:34 ngày 27/10/2026, nghe cổng 3002, HTTP 200. Artwork AI chưa được nghiệm thu trên một lượt mới.

Chuẩn hình là minh họa đơn giản, đúng người/vật/quan hệ, kiến trúc ổn định, toàn/cận theo lời và hiệu ứng môi trường có nguồn. Tư thế phụ có thể giản lược. Chưa đóng các mục nghiệm thu hình, MP4/âm thanh thật hoặc toàn bộ plan chỉ bằng các bộ kiểm giả lập.
