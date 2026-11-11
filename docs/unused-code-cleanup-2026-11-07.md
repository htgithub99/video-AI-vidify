# Dọn code không dùng — 07/11/2026

Đã xóa **324 khai báo export không còn tham chiếu** và **4 file bỏ hoang**, đồng thời dọn import/helper phụ thuộc đã mất chỗ dùng. Khoảng 1.100 dòng code được loại bỏ. Các thay đổi triển khai HTML Canvas trước đó được giữ nguyên.

## Những phần đã xóa

- `src/constants/motionProfiles/sceneContext.ts`: bộ ghép context SVG không còn caller.
- `src/constants/motionProfiles/sceneContract.ts`: hợp đồng đầu ra SVG cũ không còn caller.
- `src/lib/motionEffectIdentity.ts`: suy diễn effect/layer không còn caller.
- `src/lib/motionPose.ts`: suy diễn tư thế không còn caller.
- Helper sửa layer/opacity, chọn ID để kiểm hình, so độ lệch nhận dạng/palette và wrapper preview/plan đã bỏ.
- Prompt, type, enum, regex và hằng số UI không còn dùng, gồm các bản sao trong `sourceText.ts`/`motionRuntime.ts`.
- Nhánh console interceptor không còn người đăng ký; giữ logger hiện đang được gọi.
- Điều kiện `restart` không thể đi tới trong nhánh SVG sau khi router đã chuyển thao tác này sang Canvas; tùy chọn `review` không được scene builder sử dụng; điều kiện thời lượng lặp lại cùng kết quả.

Danh sách khai báo đã xóa lưu tại `scratch/code-maintenance/cleanup-changes.json`. Snapshot trước dọn nằm trong `scratch/code-maintenance/before-cleanup/`; chúng giữ cả thay đổi workspace có từ trước, không phải bản reset Git.

## Những phần vẫn cần giữ

- Renderer, đọc dữ liệu, kiểm tra và dựng lại SVG còn có caller phục vụ dự án cũ.
- Chế độ kho, pipeline giọng/ASR, SFX, phụ đề, SEO và các cấu hình đang hoạt động.
- Component các trang ứng dụng được tải bằng default/dynamic import, bao gồm ProjectList và skeleton của nó.
- API/helper được các bài kiểm tra hoặc công cụ phát triển gọi, như `renderRemotionVideo`, `resetMotionAiRoom`, `remotionStoryRecoveryPending`, `openSunoPlaylistDialog`.

Không coi một export là thừa chỉ vì bộ phân tích symbol không theo được destructuring từ dynamic import, default export hoặc code đưa vào callback trình duyệt. Đã đối chiếu thêm tên trong toàn bộ source và các nơi truy cập namespace.

## Công cụ rà soát

Sửa `scripts/audit-unused-code.ts` để lấy thêm file từ **tsconfig**, ngoài danh sách file Git. Component `src/features/projects/components/ProjectList.tsx` đang được ứng dụng sử dụng nhưng không nằm trong danh sách file Git; bộ rà cũ đã bỏ sót file này. Các khai báo nó cần được giữ lại.

Kết quả cuối: `npm run audit:unused` quét **1.242 file**, trả **`candidates: []`**. Rà export tiếp chỉ còn các trường hợp default export/dynamic import được xác nhận có dùng; không còn khai báo đủ điều kiện xóa theo rà symbol cộng tham chiếu văn bản.

## Kiểm tra

| Kiểm tra | Kết quả |
| --- | --- |
| `npx tsc --noEmit` | Qua |
| ESLint các file thay đổi | Qua |
| `npx vite build` | Qua; còn cảnh báo kích thước chunk như trước |
| `npm run test:motion-html` | Qua: transport, ba profile, preview, retry/resume, lỗi frame muộn, ghi lại raw |
| `npm run test:motion-settings` | Qua: backend và giao diện Chrome, đủ 19 cấu hình, lưu/khôi phục, ASR |
| `npm run test:motion-html-export` | Qua: xuất 1080p/30fps, audio/SFX/phụ đề, trộn Canvas/SVG |
| `scripts/verify-source-refactor.ts` | Qua, gồm 32 callback trình duyệt được serialize |
| `git diff --check` | Qua |

`npm run test:feature-boundaries` còn lỗi có sẵn: `src/hooks/useCaptchaAlert.ts:4` import `src/features/motion/lib/motionAlertBeep.ts` từ shared code. Import này có nguyên trong Git HEAD và hai file không bị đợt dọn này thay đổi. Không ghi nhận bài kiểm tra kiến trúc này là đã qua.

Các kiểm tra trên dùng fixture, Chrome/FFmpeg thật khi cần; không gửi lại AI/TTS thật hoặc xóa lịch sử Gemini trong đợt dọn code này.
