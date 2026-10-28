# Rà soát code Video Motion — 28/10/2026

> Cập nhật sau khi được yêu cầu triển khai: B01–B08 đã được sửa và kiểm tra cục bộ. Mục 1–6 giữ bằng chứng của lần audit trước khi sửa; mục 7 ghi kết quả triển khai và phần còn lại. Không chạy video hoặc gọi AI thật.

## 1. Phạm vi và trạng thái

- Theo yêu cầu tạm dừng thử video để kiểm tra code. Lượt `37810897-856c-4a26-a51f-96f06ae0c285` đã ở trạng thái `cancelled`.
- Không gọi AI, không tổng hợp giọng, không render video, không khởi động lại backend trong lượt kiểm tra này.
- Không sửa hoặc xóa code chức năng; giữ nguyên các thay đổi Git đã có. Chỉ thêm báo cáo và công cụ kiểm tra cục bộ trong `scratch/motion-code-audit-20261028/`.
- Lập đồ thị import và kiểm tra TypeScript cho 304 file có tên/đường dẫn Motion, Puppet, Remotion, tổng 38.233 dòng. Đây là phạm vi quét tĩnh, không có nghĩa đã đọc thủ công từng dòng của cả 304 file.
- Đọc các đường điều khiển chính: UI/hook → API/controller → production/job/checkpoint → phân tích/kịch bản/SEO → kho/Remotion → giọng → compile → render/công bố. Kiểm tra thêm đường tải bộ Canvas JavaScript và cấu hình chuyển động.
- Đồ thị import là phân tích tĩnh; các nhánh tương thích, công cụ chuyển dữ liệu và script kiểm tra được đối chiếu riêng trước khi kết luận code thừa.

## 2. Kết luận

Có lỗi logic và code còn lại từ các kiến trúc cũ. Model yếu có thể làm phản hồi kém, nhưng không giải thích hết việc mất tiến độ, gọi dựng lại quá nhiều hoặc đứng trạng thái chờ.

Tám phát hiện dưới đây gồm lỗi đã tái hiện và khoảng trống kiểm tra đã chứng minh bằng dữ liệu. P1 là ưu tiên sửa trước khi chạy sản xuất; P2 là vấn đề hiệu năng, cấu hình hoặc trạng thái cần xử lý tiếp.

| Mã  | Mức              | Vấn đề                                                         | Tác động                                                           |
| --- | ---------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| B01 | P1               | Lỗi ghi log đầu lượt thoát khỏi khối bắt lỗi                   | Lượt đứng `queued`, không có thông báo lỗi, còn khóa xử lý         |
| B02 | P1               | Phản hồi phân tích nguồn cũ ghi đè nguồn mới                   | Nội dung dùng để tạo video có thể khác ô nguồn đang hiển thị       |
| B03 | P1               | Tiếp tục viết toàn bộ kịch bản bỏ `gen` đã nhận                | Có thể mất tham chiếu hình/tài nguyên đã dựng khi lưu script mới   |
| B04 | P1               | Sửa thời lượng nhận phản hồi rỗng là thành công                | Không sửa lời kể nhưng vẫn xóa danh sách mục cần sửa               |
| B05 | P2               | Khóa cảnh phụ thuộc dữ liệu quá rộng, rồi truyền sang cảnh sau | Dựng lại nhiều cảnh, tốn request, tăng thời gian và rủi ro lỗi AI  |
| B06 | P1 về chất lượng | Tọa độ thiết kế chưa được đối chiếu với SVG thực tế            | Hình sai vị trí/tỷ lệ nghiêm trọng vẫn hợp lệ về cấu trúc          |
| B07 | P2               | Bật chuyển động vẫn chấp nhận SVG không có animation           | Video vẫn có thể như ảnh đứng dù đã bật cấu hình                   |
| B08 | P2               | Dùng “dựng chưa xong” để kết luận cần phân cảnh lại            | Log gây hiểu sai, tiến độ lùi và reset marker bước không cần thiết |

### B01 — Lỗi đầu lượt không đưa tác vụ về trạng thái lỗi

Vị trí:

- `src/server/services/motionProductionService.ts:81`: tạo cấu hình chạy.
- `src/server/services/motionProductionService.ts:84`: ghi log cấu hình.
- `src/server/services/motionProductionService.ts:230`: khối `try` chính mới bắt đầu.
- `src/server/services/motionProductionService.ts:486`: `void run(...)` không có bộ xử lý rejection ngoài cùng.

**Tái hiện:** tạo thư mục production tạm, cố tình để đường dẫn thư mục log là một file. Gọi service với dữ liệu hợp lệ. Ghi log báo `EEXIST`; Promise bị reject ngoài khối bắt lỗi. Trạng thái vẫn `queued`, `job.error` trống và file khóa còn tồn tại. Chưa có bước AI nào chạy.

Điều này chứng minh đường xử lý lỗi bị hở khi lưu log gặp vấn đề; không khẳng định ổ đĩa của lượt video trước thực tế gặp `EEXIST`.

**Hướng sửa:** đưa toàn bộ vòng đời sau khi nhận quyền xử lý vào `try/finally`; có bộ xử lý lỗi ở điểm khởi chạy. Lỗi ghi log không được ngăn cập nhật lỗi và giải phóng owner. Nếu cả ghi snapshot cũng hỏng, cần trả trạng thái lỗi từ bộ nhớ và ghi chẩn đoán bằng logger độc lập.

### B02 — Nhập nguồn có tranh chấp phản hồi

Vị trí:

- `src/features/motion/components/MotionVideoCreator.tsx:322`: mỗi lần đổi text đều gọi `parseSource`.
- `src/features/motion/hooks/useMotionStudio.ts:641`: callback `parseSource`.
- `src/features/motion/hooks/useMotionStudio.ts:650`: chờ request rồi cập nhật `source` mà không kiểm tra phiên bản text.

**Tái hiện:** lấy chính biểu thức callback từ file bằng TypeScript AST, chạy với request giả lập. Nhập nguồn A rồi B; cho B trả về trước, A trả về sau. Kết quả `rawText` là B nhưng `source` lại của A. Nhánh `catch` của request cũ cũng có thể xóa nguồn mới thành `null`.

**Hướng sửa:** gắn số phiên bản request, chỉ nhận kết quả/lỗi nếu vẫn khớp text hiện tại; hủy request cũ và debounce việc parse. Áp dụng cùng quy tắc ở cả nhánh thành công và thất bại.

### B03 — Mất tài nguyên khi tiếp tục viết toàn bộ

Vị trí:

- `src/server/services/motionProductionActions.ts:176`: `keepGen` chỉ dùng `carryGen` nếu không có `chapterIds`; bỏ qua `body.gen`.
- `src/server/services/motionProductionActions.ts:180`: checkpoint dùng giá trị này.
- `src/server/services/motionProductionActions.ts:242`: script cuối dùng giá trị này.
- `src/features/motion/hooks/useMotionStudio.ts:794`: UI cũng chỉ gửi `gen` khi có danh sách chương cụ thể.

**Tái hiện:** gửi `resume:true`, beat đã đầy đủ, `gen` chứa tài nguyên đã nhận, không truyền `chapterIds`, tắt editor pass. Không cần gọi AI. Job hoàn thành, beat được giữ nhưng `result.gen` là `undefined`.

Lỗi nằm ở nhánh tiếp tục/viết toàn bộ. Không phải mọi lần resume production đều mất hình: các bước script đã đánh dấu hoàn thành thường được bỏ qua.

**Hướng sửa:** phân biệt rõ viết mới, tiếp tục và viết lại chương. Tiếp tục phải giữ `gen`; sau khi nội dung đổi chỉ làm mất hiệu lực phần thực sự phụ thuộc nội dung đó. `carryGen` giữa các phần truyện và `gen` của phần hiện tại cần quy tắc riêng.

### B04 — Phản hồi sửa thời lượng rỗng được chấp nhận

Vị trí:

- `src/server/services/motionStoryService.ts:2043`: hàm đánh giá bản sửa.
- `src/server/services/motionStoryService.ts:2045`: chỉ truyền mục tiêu độ dài khi phục hồi draft, không truyền khi nhận phản hồi mới.
- `src/lib/motionChapterRepair.ts:68`: thiếu patch thì giữ dòng cũ.

**Tái hiện:** bản cũ có 6 đơn vị lời kể, chương đặt 60 giây, mục tiêu kiểm thử 192 đơn vị. AI giả lập trả `{"beats":[]}` đúng một lần. Hàm trả lại nguyên lời cũ, danh sách `pending` trở thành rỗng và coi thao tác sửa hoàn thành.

Đây không phải yêu cầu bắt thời lượng chính xác. Vấn đề là phản hồi không sửa gì lại được ghi nhận như đã sửa. Khi âm thanh vẫn lệch nghiêm trọng, production có thể tốn thêm một vòng rồi dừng ở giới hạn sửa.

**Hướng sửa:** kiểm tra patch có tác động lên đúng mục đang cần sửa; phản hồi rỗng/không liên quan không được xóa `pending`. Thời lượng vẫn dùng khoảng dung sai rộng và âm thanh thực tế làm căn cứ. Không quay lại ép số từ chính xác hoặc yêu cầu viết lại cả chương.

### B05 — Phụ thuộc cache quá rộng và lan truyền

Vị trí:

- `src/server/services/remotion/sceneKeys.ts:12`: hash toàn bộ `analysis.cast`, `analysis.places` và toàn bộ beat.
- `src/server/services/remotion/scenePipeline.ts:60`: checkpoint cũng gắn với toàn bộ beats/cast/places.
- `src/server/services/remotion/scenePipeline.ts:190`: khóa composition thêm khóa composition cảnh trước cùng nhóm địa điểm.

**Tái hiện:** thêm một địa điểm không dùng trong beat làm khóa beat đổi. Chỉ thêm một khoảng trắng cuối lời kể cũng làm khóa đổi. Khóa plan đổi kéo khóa composition đổi; khóa cảnh trước lại tham gia khóa cảnh sau.

Nội dung lời kể thực sự đổi có thể cần đọc lại phân cảnh; không được giữ hình bất chấp thay đổi ý nghĩa. Tuy nhiên thay đổi dữ liệu không liên quan hiện cũng có thể kéo theo đọc lại và vẽ lại, thay vì chỉ cập nhật timeline hoặc cảnh bị ảnh hưởng.

**Hướng sửa:** tách dấu phụ thuộc của lời kể, phân cảnh, thiết kế, SVG và timeline. Chuẩn hóa khoảng trắng; chỉ lấy cast/place dùng trong cảnh. Cảnh sau phụ thuộc nhận dạng/phối cảnh đã chốt cần thiết, thay vì phụ thuộc toàn bộ chuỗi khóa của cảnh trước.

### B06 — Thiết kế tọa độ chưa bảo đảm vị trí trong ảnh

Vị trí:

- `src/lib/motionSceneDesign.ts:4`: kiểm cấu trúc và số hữu hạn của placements.
- `src/lib/motionSceneComposition.ts:40`: kiểm group, layer, animation và tham chiếu nhân vật.
- `src/lib/motionSceneComposition.ts:56`: gọi lại bộ kiểm design, không đo hình SVG.
- `src/server/services/remotion/vectorCutoutInspector.ts:151`: cảnh composition không đi qua bộ kiểm cutout từng asset.
- `src/features/motion/remotion/StoryComposition.tsx:40`: dựng nguyên SVG do AI trả về.

**Tái hiện:** design khai báo nhân vật bên phải, rộng 10%, cao 50% khung. SVG thực tế chứa group nhân vật là hình chữ nhật phủ toàn bộ 1280×720. `normalizeSceneComposition` vẫn chấp nhận vì group/ID/metadata hợp lệ.

Bộ kiểm cutout bỏ qua SVG toàn cảnh là hợp lý, vì toàn cảnh vốn có nền. Khoảng trống ở đây là chưa có phép đối chiếu hình học riêng cho composition. Metadata thiết kế đúng chưa chứng minh hình ảnh đã tuân thủ metadata.

**Hướng sửa:** giữ quyền thiết kế/vẽ của AI; bổ sung kiểm tra cục bộ có dung sai cho group thiết yếu: có hiển thị, không văng khung, không vô tình phủ kín cảnh, vị trí và tỷ lệ không lệch nghiêm trọng so với thiết kế đã chốt. Đo hình thực tế thay vì chỉ tin metadata. Sai khác nhỏ và tư thế minh họa đơn giản là cảnh báo; sửa riêng group lỗi khi sai nghiêm trọng. Không khôi phục hàng loạt công thức ép động tác chi tiết.

Kiểm tra hình học cũng không thể tự chứng minh nhân vật đúng nét, đồ vật đúng nghĩa hoặc ảnh đủ đẹp. Phần đó vẫn cần chất lượng AI và review phù hợp.

### B07 — Cấu hình bật chuyển động mới là điều kiện cho phép chạy

Vị trí:

- `src/lib/motionSceneComposition.ts:107`: thiếu animation được chuyển thành `[]`.
- `src/lib/motionSceneComposition.ts:175`: chỉ chạy animation đã được AI cung cấp.
- `src/server/services/remotion/scenePipeline.ts:325`: thiếu kênh chuyển động chỉ ghi log rồi vẫn đánh dấu cảnh sẵn sàng.
- `src/features/motion/remotion/StoryComposition.tsx:42`: các hiệu ứng renderer cũ chỉ chạy ở cảnh không có composition.

**Tái hiện:** composition có nhân vật, animation rỗng được chấp nhận. Đặt `actors:simple`, `sceneEffects:gentle`, `camera:fixed`; SVG ở giây 0 và giây 3 hoàn toàn giống nhau. Không chạy render để kiểm tra này.

Không phải mọi cảnh đều cần nhân vật hay hiệu ứng. Nhưng nếu người dùng đã bật cấu hình và cảnh có chủ thể phù hợp, hiện chưa có bảo đảm AI cung cấp chuyển động tương ứng. Bật lại sau khi đã có cảnh tĩnh cũng chưa làm khóa vẽ thay đổi theo phần animation còn thiếu.

**Hướng sửa:** phân biệt khả năng của cảnh với cấu hình bật/tắt; nếu cần, yêu cầu AI bổ sung riêng metadata/chuyển động nhẹ vào group đã có. Không vẽ lại cả cảnh và không ép động tác phức tạp. Cảnh thiếu kênh cần được hiển thị đúng trạng thái thay vì chỉ coi là đã đáp ứng đầy đủ cấu hình.

### B08 — Nhầm trạng thái chưa hoàn thành với lỗi thời

Vị trí:

- `src/server/services/remotion/sceneKeys.ts:32`: `remotionStoryBuildCurrent` trả `false` khi chưa có composition, khi dữ liệu lỗi hoặc khi revision cũ.
- `src/server/services/motionProductionService.ts:233`: gom mọi trường hợp `false` vào nhánh reset scene/render.
- `src/server/services/motionProductionService.ts:238`: ghi log phân cảnh lại theo quy tắc mới.

**Tái hiện:** tạo script có plan đúng revision và khóa hiện tại, chỉ chưa có composition. `remotionStoryPlanCurrent=true`, `remotionStoryBuildCurrent=false`, nên vẫn đi vào nhánh log phân cảnh lại.

Nhánh này không trực tiếp xóa toàn bộ `state.scenes`; pipeline có thể dùng lại cảnh hợp lệ. Tác động đã xác định là phân loại/log sai, lùi progress và xóa marker bước. Việc vẽ lại còn phụ thuộc kiểm khóa ở pipeline.

**Hướng sửa:** trả trạng thái có lý do: chưa hoàn thành, lỗi từng cảnh, lỗi thời, đổi cấu hình hoặc đã sẵn sàng. Resume phần thiếu không nên có cùng cách xử lý với nâng revision.

## 3. Code thừa, code cũ và các phần không được xóa nhầm

### 3.1. Không tìm thấy nơi sử dụng

| File/hàm                                                                   | Bằng chứng                                                                                                     | Đề xuất                                                                                      |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/lib/motionRemotionCrowd.ts`                                           | `remotionSpiritCrowdAsset` chỉ xuất hiện tại nơi khai báo trong `src`/`scripts`; không có đường import runtime | Ứng viên xóa rõ nhất; kiểm tra build/tài liệu khi thực hiện                                  |
| `canReuseRemotionCharacter` trong `src/lib/motionRemotion.ts:25`           | Chỉ được gọi từ script kiểm tra, không từ luồng dựng hiện tại                                                  | Xóa nếu bỏ hợp đồng tái sử dụng asset của Remotion cũ; sửa test đi kèm                       |
| `measureMotionVoice` trong `src/server/services/motionAudioService.ts:352` | Không thấy caller trong `src`/`scripts`                                                                        | Bỏ API nội bộ chưa dùng nếu không còn kế hoạch đo trước giọng; giữ các hàm layout dùng chung |
| `_keepBrowser`, `release = _.noop` trong `motionStoryService.ts:517`       | Tham số không được đọc; release không làm gì                                                                   | Thu gọn chữ ký và caller khi tách module; giữ cơ chế session/owner đang hoạt động            |

### 3.2. Code đã rời luồng sản xuất nhưng test/công cụ cũ vẫn gọi

- `src/server/services/remotion/sceneContinuity.ts`: còn dùng bởi script inspect và các test staging/render behavior, không nằm trong import runtime từ các entry chính.
- `src/lib/motionRemotionSpace.ts`: dùng bởi bộ continuity cũ và test space.
- `src/lib/motionRemotionStructure.ts`: test còn kiểm các hàm tự dựng phòng/quan tài cũ; không thấy runtime gọi.

Các test này có thể chạy đạt nhưng không chứng minh pipeline composition mới đang cố định đúng vị trí. Cần chuyển test quan trọng sang entry `buildRemotionScenes → compileRemotionStory`, rồi mới bỏ code/test đã bị thay thế hoặc đưa phần đọc dữ liệu cũ vào module tương thích rõ ràng.

Không xóa toàn bộ `motionRemotion.ts`, `motionRemotionGeometry.ts`, renderer Canvas hoặc hệ Puppet chỉ vì có code cũ: preview, spec cũ và chế độ kho vẫn sử dụng một phần trong đó.

### 3.3. File không đi vào runtime nhưng vẫn có công dụng

`src/constants/motionPuppetCatalogMigration.ts` được `scripts/migrate-motion-asset-catalog.ts` sử dụng qua lệnh `motion:migrate-asset-catalog`. Đây là dữ liệu chuyển đổi kho, không phải code chết chỉ vì không xuất hiện trên đồ thị runtime. Có thể chuyển sang khu vực tooling; không xóa cùng tài nguyên đang dùng.

### 3.4. Nhánh không phải code chết

- `pipelinePuppet.ts` vẫn có cả kho đóng theo gói và nhánh tạo tài nguyên linh hoạt. UI hiện còn lựa chọn không dùng gói/style riêng, nên nhánh linh hoạt vẫn có đường vào. Nếu chỉ muốn hai chế độ “kho đóng” và “AI composition”, cần chốt loại bỏ lựa chọn cũ trên UI/API trước khi xóa nhánh này.
- Hook vẫn có thao tác viết lại chương, dựng lại, tạo giọng, compile và xuất thủ công. Backend production điều phối lượt tự động. Hai bên có lặp việc truyền cấu hình/kiểm điều kiện, nhưng các nút thủ công vẫn dùng được; không thể xóa hook rồi coi là dọn code thừa.
- Kiểm an toàn SVG, liên kết file âm thanh, dữ liệu script tối thiểu, khóa owner, ghi file nguyên tử, hủy tác vụ và kiểm MP4 vẫn cần giữ. Không hạ các kiểm tra này cùng QA thẩm mỹ/thời lượng.

## 4. Đề xuất tổ chức lại để giảm lỗi về sau

1. Một hợp đồng cấu hình hiệu lực dùng chung cho lượt tự động, thao tác thủ công, preview và export. Tránh dựng cùng payload nhiều lần trong hook/service.
2. Backend production chịu trách nhiệm vòng đời và trạng thái tiến độ; frontend theo dõi kết quả và gửi ý định thao tác. Các nút thủ công vẫn được giữ qua cùng hợp đồng.
3. Tách `motionStoryService.ts` thành quản lý room/recovery, chạy hợp đồng AI, phân tích nguồn/DNA, phát triển truyện, viết/sửa chương. File hiện 2.188 dòng khiến sửa QA dễ chạm logic phục hồi không liên quan.
4. Tách phần theo dõi job/log, cấu hình và thao tác biên tập khỏi `useMotionStudio.ts` (1.323 dòng); tách phần hiển thị khỏi `MotionVideoCreator.tsx` (1.347 dòng).
5. Tách rõ luồng kho đóng, composition mới và đọc spec cũ. Không để test của luồng cũ đại diện cho chất lượng luồng mới.
6. Giữ text dùng chung theo nhóm chức năng. Các hằng như `MOTION_TEXT_SYMBOL_*` hiện làm điều kiện và prompt khó đọc; đổi dần sang tên có nghĩa khi sửa đúng module, không đổi chuỗi hàng loạt chỉ để làm đẹp diff.

## 5. Thứ tự xử lý đề nghị

### Đợt 1 — Không mất dữ liệu, không đứng trạng thái

- B01: bao phủ lỗi đầu/cuối vòng đời và giải phóng khóa.
- B02: chống phản hồi nguồn đến trễ.
- B03: giữ tài nguyên khi tiếp tục, tách rõ ý định viết lại.
- B04: nhận biết bản sửa rỗng/không tác động; giữ QA thời lượng mềm.

### Đợt 2 — Dùng lại phần đã đạt và đáp ứng cấu hình

- B05: tách cache theo phụ thuộc thực sự; chỉ vẽ lại khi hình cần đổi.
- B08: phân biệt chưa làm xong và lỗi thời; sửa log/progress tương ứng.
- B07: bổ sung riêng animation còn thiếu theo cấu hình; không dựng lại hình đã đạt.

### Đợt 3 — Vị trí và chất lượng minh họa

- B06: đối chiếu SVG thực tế với design bằng kiểm tra có dung sai.
- Chỉ sửa group lỗi rõ ràng; cảnh vẫn là minh họa, không ép tư thế/hành động nhỏ.
- Chạy bộ trường hợp cục bộ gồm nhiều kiểu hình, số lượng người, đồ vật và tỉ lệ khung; không chỉ một câu chuyện.

### Đợt 4 — Dọn code sau khi khóa hành vi

- Xóa helper không dùng đã xác minh.
- Chuyển/xóa test và module Remotion cũ sau khi thay bằng test pipeline mới.
- Tách module lớn, thu gọn payload/cấu hình lặp, giữ chức năng kho và thao tác thủ công.

Đây là thứ tự đề nghị, chưa phải các mục đã sửa. Không có lời bảo đảm rằng thay code sẽ làm mọi model luôn tạo được hình đẹp; mục tiêu là code không làm mất phần đã đạt, không báo thành công giả và xử lý thất bại có trạng thái rõ ràng.

## 6. Bằng chứng và kiểm tra

- `scratch/motion-code-audit-20261028/inventory.json`: danh mục, đồ thị import, chẩn đoán TypeScript và kiểm cú pháp các file JavaScript engine.
- `scratch/motion-code-audit-20261028/reproduce.ts`: tái hiện B01–B08 bằng dữ liệu giả lập/hàm cục bộ.
- `scratch/motion-code-audit-20261028/reproduction.json`: kết quả chi tiết; `liveAiRequests:0`, `videoRenders:0`.
- TypeScript kiểm thêm `noUnusedLocals`/`noUnusedParameters`: không có chẩn đoán trong 304 file thuộc phạm vi. Điều này không phát hiện mọi export không dùng hay lỗi logic bất đồng bộ.
- `scripts/verify-motion-production-runner.ts`: đạt trong lượt audit này.
- `scripts/verify-motion-composition.ts`: đạt trong lượt audit này.
- Các phép tái hiện lỗi mới vẫn chứng minh vấn đề dù hai bộ kiểm hiện có đều đạt: cần bổ sung các trường hợp này vào kiểm thử hồi quy khi thực hiện sửa.
- Không chạy toàn bộ test suite, không đánh giá lại bằng video thật, không nghe/đánh giá chất lượng giọng trong lượt audit này.

## 7. Kết quả triển khai sau audit

### 7.1. Những phần đã sửa

| Mã  | Đối ứng chung trong code                                                                                                                                                                                                                                                                                 | Bằng chứng kiểm tra                                                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B01 | Bao phủ vòng đời production bằng bắt lỗi và giải phóng owner; xử lý rejection ngoài cùng. Log vẫn được giữ trong bản ghi khi ghi file log lỗi. Khi snapshot cuối không ghi được, trả trạng thái lỗi từ bộ nhớ và vẫn giải phóng khóa.                                                                    | Giả lập thư mục log là file; kiểm terminal error, log, không unhandled rejection, không giữ lock, tiếp tục được sau sửa đường dẫn. Giả lập snapshot cuối không ghi được; API vẫn trả error và khóa được giải phóng. |
| B02 | Bộ đọc nguồn dùng chung có debounce 300 ms, hủy request cũ, chỉ nhận kết quả của lần nhập mới nhất; bỏ nguồn cũ ngay khi text đổi. Hủy khi hook unmount.                                                                                                                                                 | Nguồn mới trả trước; lỗi/thành công cũ đến sau; xóa text; hủy trong debounce.                                                                                                                                       |
| B03 | Cả UI và backend giữ `gen` khi tiếp tục toàn bộ hoặc sửa chương; viết mới toàn bộ vẫn có ý định riêng.                                                                                                                                                                                                   | Gọi entry viết kịch bản với beat đã đạt, `resume:true`, không có `chapterIds`: giữ nguyên tài nguyên, không gọi AI.                                                                                                 |
| B04 | Mục sửa thời lượng vẫn pending nếu patch rỗng, sai ID hoặc lời kể không đổi sau chuẩn hóa khoảng trắng. Chấp nhận bản sửa có tác động mà không ép chính xác số từ.                                                                                                                                       | Phản hồi rỗng/sai ID/không đổi bị từ chối; bản sửa lệch độ dài nhưng có tác động được nhận; sửa từng phần giữ mục còn thiếu cho lượt sau.                                                                           |
| B05 | Chuẩn hóa chuỗi/đối tượng; khóa beat chỉ phụ thuộc cast/place liên quan và dữ liệu hình. Khóa composition tách khỏi khóa nguồn và khóa toàn cảnh trước. Checkpoint theo scope/cấu hình; yêu cầu con vẫn có khóa riêng. Nhận và chuyển khóa cache cũ khi dùng lại.                                        | Địa điểm/nhân vật không liên quan, khoảng trắng và thời lượng không làm mất cache. Chuyển cache cũ một/nhiều cảnh không gọi AI. Sửa cảnh trước chỉ dựng lại cảnh đó, giữ composition cảnh sau.                      |
| B06 | Đo `getBBox` và transform của các group thiết yếu bằng Chrome headless cục bộ, so với design bằng dung sai rộng. Chặn group trống, văng khung hoặc phủ khung sai nghiêm trọng. SVG qua kiểm an toàn trước khi đo; trang đo tắt JavaScript. Lỗi công cụ đo không bị coi là lỗi AI để gọi vẽ lại liên tục. | SVG nhân vật phủ toàn màn bị loại; tọa độ transform và khung dọc được đo đúng; sai khác vừa phải được nhận. Cache hình lỗi được sửa riêng group, giữ nền. Lỗi công cụ đo không phát sinh thêm lượt sửa AI.          |
| B07 | Bổ sung riêng metadata animation cho kênh đã bật còn thiếu khi cảnh có chủ thể phù hợp. Không nhận thay SVG/layers/design từ lượt bổ sung này; giữ animation đã đạt. Nếu vẫn thiếu, giữ hình và ghi đúng lỗi để tiếp tục.                                                                                | Bật chuyển động sau cảnh tĩnh chỉ gọi bổ sung animation; SVG giữ nguyên, khung ở hai thời điểm khác nhau. Bổ sung thất bại vẫn giữ hình đã đạt. Tắt người vẫn cho hiệu ứng cảnh chạy độc lập.                       |
| B08 | Phân biệt `ready`, `pending`, `outdated`, `invalid`. Chỉ trường hợp lỗi thời dùng log phân cảnh lại và giảm tiến độ; phần đang thiếu có log tiếp tục tương ứng. Marker compile/render phụ thuộc cảnh vẫn được làm mất hiệu lực khi cần.                                                                  | Plan hiện tại nhưng thiếu composition là pending; thiếu asset là invalid; revision cũ là outdated; cảnh đã đủ là ready. Thiếu kiểm hình/chuyển động cần bổ sung là pending.                                         |

Phát hiện bổ sung trong kiểm tra kho: `layoutPuppetFrame` dùng `spot.y` của cửa cho chân người đứng dù spot có `groundY`. Đã sửa quy tắc chung: người đứng lấy `groundY` khi có; tư thế ngồi/nằm giữ cơ chế tiếp xúc riêng. Kiểm chọn gói và kiểm quan hệ không gian đã đạt sau sửa.

### 7.2. Dọn code đã thực hiện

- Xóa `src/lib/motionRemotionCrowd.ts`, không có caller runtime hoặc script.
- Xóa export không dùng `measureMotionVoice` và import type tương ứng; giữ bộ layout/tạo giọng và các API đo tốc độ giọng đang dùng.
- Chuyển `canReuseRemotionCharacter`, continuity/space/structure cũ sang `scripts/legacy-motion-remotion/`; cập nhật các script inspect/kiểm tra. Các helper này không còn nằm trong `src`.
- Chuyển cấu hình chuyển dữ liệu catalog sang `scripts/legacy-motion-remotion/catalogMigration.ts`; công cụ migration vẫn giữ đường chạy.
- Bỏ `release = _.noop` và hai lời gọi không có tác dụng trong session AI.
- Giữ các module đọc/render spec cũ thực sự còn dùng cho preview, chế độ kho và thao tác thủ công.

### 7.3. Kiểm tra đã chạy

- `npx tsc --noEmit`.
- `scripts/verify-motion-audit-fixes.ts` (có lệnh `npm run test:motion-audit-fixes`).
- `scripts/verify-motion-production-runner.ts`.
- `scripts/verify-motion-prompt-resume.ts`.
- `scripts/verify-motion-composition.ts`.
- `scripts/verify-motion-qa-policy.ts`.
- `scripts/verify-motion-closed-pipeline.ts`: hai gói, phân cảnh/ghép kho/tiếp tục, dùng AI giả lập.
- `scripts/verify-motion-pack-selection.ts`: hai gói, 20 ảnh kiểm cục bộ; phát hiện và xác nhận sửa điểm chạm sàn cửa.
- `scripts/verify-motion-spatial-placement.ts`.
- Các script tương thích `verify-motion-render-behavior.ts`, `verify-motion-remotion-space.ts`, `verify-motion-remotion-staging.ts`, `verify-motion-remotion-qa.ts`.

Tất cả các mục trên đã đạt. Hai dòng logger báo lỗi lưu trong bài audit là lỗi được chủ động gây ra để kiểm phục hồi. Kiểm tra dùng dữ liệu/hàm AI giả lập; có dựng ảnh tĩnh cục bộ, không tổng hợp giọng thật, không gọi model và không render video. Không khởi động lại backend.

### 7.4. Giới hạn và việc tổ chức code còn lại

- Đây là sửa lỗi vòng đời, phụ thuộc dữ liệu, kiểm hình và áp dụng cấu hình; không chứng minh model sẽ luôn vẽ đẹp, đúng nghĩa từng đồ vật hoặc mọi video sẽ thành công.
- Kiểm hình học không xác nhận chất lượng nét vẽ, sắc thái truyện, màu trang phục hay độ hấp dẫn. Không khôi phục kiểm tư thế/hành động nhỏ hoặc bắt thời lượng chính xác.
- Các đề xuất tổ chức ở mục 4 chưa hoàn tất: chia nhỏ toàn bộ `motionStoryService.ts`, hook/UI và hợp nhất hợp đồng cấu hình xuyên UI/preview/export. Tham số `_keepBrowser` chưa dùng vẫn được giữ trong chữ ký session để tương thích caller hiện tại. Không đánh dấu các phần này là đã dọn xong.
