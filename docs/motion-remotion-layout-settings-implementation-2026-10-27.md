# Đối ứng bố cục và cấu hình Video Motion

Ngày: 27/10/2026. Phạm vi: [plan đã duyệt](motion-remotion-layout-settings-root-fix-plan-2026-10-27.md).

**Cập nhật sau lượt xuất thực tế 15:35:** [audit video mới](video-references/mam-cung-ben-ben-song-audit-20261027/README.md) xác nhận backend chưa nạp bản sửa. Đồng thời phát hiện migration scene contract còn thiếu: cả 18 đoạn cũ vẫn khớp planning key mới. Các kết quả offline bên dưới không chứng minh lượt xuất này đã dùng bản sửa; S03/C01/V02 cần bổ sung revision scene, invalidation và hồi quy dữ liệu cũ như mục 17 của plan.

## Kết quả chính

- Tách ba lựa chọn: chuyển động nhân vật, hiệu ứng cảnh và camera. **Giữ tư thế không khóa mưa/khói/lửa**. Mặc định người giữ yên, hiệu ứng nhẹ, camera cố định.
- Áp dụng cùng contract qua UI, lưu dự án, API, production snapshot, compile, preview và render. Dữ liệu cũ `characterMotion` chỉ chuyển sang actor; không tự bật zoom. Kết quả xuất lưu cấu hình hiệu lực để truy lại.
- Bố trí theo vai trò và phần hình thực: kiến trúc gắn vùng nền; vật đỡ/người ngồi dùng contact tương ứng; đồ cầm giới hạn theo người; dấu vết dùng mặt sàn. Bỏ phép co cả cụm làm cửa/cột rời vị trí lắp.
- Mỗi địa điểm có thiết kế nền chung. Time/weather tách khỏi kiến trúc. Đồ vật dùng identity/state và thay đổi có bằng chứng; chỉ kế thừa những món được đánh dấu còn hiện diện. Không tự thêm lại người đã rời cảnh.
- Dữ liệu khai báo ban đầu tách khỏi trạng thái đã kế thừa. Sửa trạng thái/cất vật ở cảnh trước tính lại cảnh sau; không giữ nhầm object kế thừa từ lần resolve trước. Đồ cầm không tự rơi xuống sàn khi chủ thể không hiện diện; vật trên bàn giữ vật đỡ cần thiết.
- Remotion có lớp mưa/sương theo vùng, khói/hơi/lửa theo nguồn, sway theo pivot. Kết quả là hàm của frame/fps và seed; seek hoặc thứ tự render không làm đổi hình. Nguồn theo cùng biến đổi của node/camera. Tắt hiệu ứng vẫn giữ hình tĩnh cho clue được đánh dấu cốt lõi.
- Actor Remotion chỉ có chuyển động rất nhẹ khi được phép và không bị khóa bởi contact. Camera bật chạy tối đa khoảng 1,2% trong 24 giây, giới hạn theo chủ thể ở mép. Nhánh kho cũng tách cờ actor/effects/camera, ngừng nhấp nháy ma và không chớp trắng với cấu hình mới.
- Giữ pool room hiện có: lập các đoạn độc lập, resolve state theo thứ tự rồi dựng độc lập. Review sửa một state thì các cảnh phụ thuộc được dựng/kiểm lại, có giới hạn số vòng.
- Sửa riêng anchor/region bằng metadata, giữ SVG đã đạt. Bundle fingerprint đi theo import thực nên đổi component/helper không dùng nhầm bundle cũ.
- Khóa hình có trạng thái: cùng một mô tả đồ vật nhưng đầy/rỗng hoặc mở/đóng khác nhau không tái dùng nhầm SVG. Có kiểm mock hai trạng thái riêng và resume không vẽ lại chúng.

## Module chính

| Nhóm | File |
| --- | --- |
| Contract, migration, UI text | `src/constants/motionRenderBehavior.ts`, `src/lib/motionRenderBehavior.ts`, `src/types/motionVisual.ts` |
| UI và dữ liệu lưu | `src/components/MotionVideoCreator.tsx`, `src/hooks/useMotionStudio.ts`, `src/components/motion-video/MotionRemotionScenes.tsx` |
| API/production/export | `src/server/services/motionProductionActions.ts`, `motionProductionService.ts`, `motionRenderService.ts` |
| Geometry/contact | `src/lib/motionRemotion.ts`, `motionRemotionGeometry.ts`, `src/constants/motionRemotionLayout.ts` |
| State và asset pipeline | `src/server/services/remotion/sceneContinuity.ts`, `sceneContract.ts`, `scenePipeline.ts`, `vectorCutoutInspector.ts`, `storyCompiler.ts` |
| Hiệu ứng và render | `src/lib/motionRemotionEffects.ts`, `src/remotion/SceneEffects.tsx`, `StoryComposition.tsx`, `src/server/services/motionRemotionRenderService.ts` |
| Adapter kho | `motion-engine/puppet2d.js` |

Các thay đổi có sẵn về parser SVG/cutout, retry room, log, pagination, voice, SEO và nguồn kho được giữ. Không sửa/xóa dữ liệu kho trong đợt này.

## Kiểm tra đã chạy

| Kiểm tra | Kết quả/phạm vi |
| --- | --- |
| `npx tsc --noEmit --pretty false` | Đạt |
| `npm run test:motion-remotion` | Đạt: partial repair, checkpoint/cache, anchors, QA, SVG/cutout và review mock |
| `npx tsx scripts/verify-motion-render-behavior.ts --render` | Đạt: tám tổ hợp; frame Canvas thật và 16 still Remotion; seek xác định; toán học fps 24/30/60; geometry bốn aspect |
| `npx tsx scripts/verify-motion-render-behavior.ts --lighting` | Đạt: nền revision mới đổi ánh sáng theo ngày/đêm; nền cũ không bị phủ tối thêm lần nữa |
| `npx tsx scripts/verify-motion-render-behavior.ts` | Đạt thêm: sửa state phía trước, removal, ownership, ID collision, camera giữ mép, emitter theo actor; API normalize và transitive dependency fingerprint |
| `npx tsx scripts/verify-motion-remotion-qa.ts` | Đạt thêm: tư thế phụ được đơn giản hóa; thiếu region chỉ sửa metadata; đổi behavior không tạo lại artwork; trạng thái khác dùng biến thể riêng và resume tái dùng đúng |
| `npx tsx scripts/verify-motion-production-runner.ts` | Đạt mock: song song, resume, idempotency, cancel, persist và fencing |
| `npx tsx scripts/verify-motion-effect-routing.ts` | Đạt |
| `npx tsx scripts/verify-motion-closed-pipeline.ts` | Đạt pipeline mock với hai gói kho đã cài |
| `scripts/inspect-motion-saved-layout.ts … --stills` | 17/17 cảnh lưu tính geometry và render still được; không chỉnh saved job |

Không gọi AI/TTS thật; không tạo/resume video sản xuất và không restart backend. Các kiểm tra ảnh/Canvas không phải lượt chạy tạo video của người dùng.

## Bằng chứng hình

Đầu vào là video/saved job trong [audit gốc](video-references/mam-com-cung-audit-20261027/README.md). Ảnh mới **dùng lại SVG đã lưu**, không gọi AI sửa artwork.

- [Bảng 17 cảnh sau khi dùng solver mới](../scratch/motion-layout-offline-20261027/69216e40-c6eb-467b-8a97-74f9674fb29e/contact-sheet.jpg).
- Đối chiếu ảnh gốc / solver mới: [cảnh 1–6](../scratch/motion-layout-offline-20261027/69216e40-c6eb-467b-8a97-74f9674fb29e/comparison-1.jpg), [7–12](../scratch/motion-layout-offline-20261027/69216e40-c6eb-467b-8a97-74f9674fb29e/comparison-2.jpg), [13–17](../scratch/motion-layout-offline-20261027/69216e40-c6eb-467b-8a97-74f9674fb29e/comparison-3.jpg).
- [Tọa độ, lời thoại và nhu cầu metadata](../scratch/motion-layout-offline-20261027/69216e40-c6eb-467b-8a97-74f9674fb29e/layout.json).
- [Ma trận frame Remotion](../scratch/motion-behavior-20261027/remotion-matrix.json), [ma trận Canvas](../scratch/motion-behavior-20261027/library-matrix.json).

Quan sát có cải thiện: người ngồi không còn đặt chân lên mặt ghế; mâm cầm giảm kích thước; cột/cửa/ngạch cửa không còn đi qua kích thước đạo cụ chung; di ảnh có mô tả đặt trên bàn được nối vào vật đỡ khi đủ căn cứ.

**17/17 là kết quả kỹ thuật, chưa phải 17/17 cảnh đúng nghĩa và đẹp.** Nền cũ vẫn chứa bàn/cửa/mưa đã vẽ dính, thiết kế giữa các nền cũ vẫn khác nhau; state sai đã viết vào SVG không thể khử bằng đổi tọa độ. Một số ảnh cũ vẫn thiếu anchor chuẩn hoặc có pose/artwork chưa phù hợp. Không coi bảng này là video hoàn chỉnh đã sửa xong.

## Cách áp dụng với dự án cũ

1. Reload chỉ khôi phục dữ liệu và cấu hình; không tự gọi AI để thay hình.
2. Khi chủ động dựng/tiếp tục, pipeline kiểm revision và yêu cầu nền theo contract mới: kiến trúc chung, nội thất/hiệu ứng tách lớp. Giữ kịch bản, voice/SEO và tài nguyên còn đạt; thiếu metadata sửa đúng asset.
3. MP4 đã xuất không bị thay đổi. Export dùng spec/snapshot đã chuẩn hóa của lượt xuất.

Backend hiện chạy chưa được restart trong đợt này; tiến trình không tự reload module sẽ cần nạp lại backend để dùng code mới.

## Phần chưa đóng nghiệm thu

- Chưa chạy một lượt AI thật sinh lại các nền theo policy mới, chưa xác nhận bằng ảnh rằng mọi vật thể/trạng thái đều đúng lời kể. Continuity cần identity/evidence do model khai đúng; code không chứng minh được mọi suy luận ngôn ngữ.
- Chưa chạy MP4 mới để kiểm toàn bộ đường xuất, chưa kiểm đủ tổ hợp UI/manual/auto với mọi cấu hình âm thanh. Preview/still/export dùng chung composition nhưng kiểm still không thay cho nghiệm thu MP4.
- Chưa thay phong cách artwork hoặc chứng minh giống video mẫu bằng hình mới. Độ tương phản và tỷ lệ trên dữ liệu thực cần xem lại sau khi chủ động dựng.
- Nhánh kho giữ chuyển cảnh hiện có; Remotion dùng cắt cảnh. Chưa hợp nhất một chính sách fade/dip giữa hai engine.
- Không thay voice/filter hoặc đánh giá rõ chữ bằng kiểm kỹ thuật. Mẫu nghiệm thu voice tiếp tục là **Thần trùng - Trùng tang kỳ truyện**.

Trạng thái từng mã S01–V04 nằm ở mục 16 của plan. Plan còn mở phần nghiệm thu trên, không khẳng định mọi video luôn thành công chỉ từ bộ test offline.
