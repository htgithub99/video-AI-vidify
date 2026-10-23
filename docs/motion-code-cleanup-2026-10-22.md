# Dọn code trong các file đang thay đổi — 22/10/2026

Phạm vi: 99 file nguồn JavaScript/TypeScript/CJS và Python, gồm các file đang thay đổi lúc bắt đầu và các module dùng chung được tách thêm. Giữ nguyên trạng thái stage của Git; không commit và không chỉnh kho media đã cài đặt.

## Thay đổi

- Rà soát cú pháp và bảo đảm không còn comment trong phạm vi code được xử lý.
- Gom text, URL, thông báo, nhãn, cấu hình và dữ liệu mẫu vào các module constants theo chức năng. Các đường dẫn import, chỉ thị môi trường và khai báo enum/type vẫn giữ ở vị trí cú pháp cần thiết.
- Chuyển cấu hình renderer sang `motion-engine/texts.js`; bỏ khóa `DAY` khai báo trùng với cùng giá trị.
- Tách `motionStoryFields.ts`, `motionPuppetValues.ts`, `motionVerificationValues.ts`, `seed_texts.py`, `seed_utils.py` và `kitSeedTexts.cjs`. Dùng chung các hàm chuẩn hóa khóa, token, chỗ tựa, thời gian, mã tài nguyên và kiểm tra hình học.
- Dùng lại `MotionSelectField` cho phần FPS và encoder, gộp import trùng và bỏ import Python không dùng.
- Đọc catalog TypeScript qua trình biên dịch thay cho regex phụ thuộc xuống dòng; giữ nguyên dữ liệu tài nguyên khi format.
- Format ở chiều rộng 400, thu gọn object và bỏ dòng trống ngoài nội dung chuỗi/template. Giữ nguyên khoảng trắng nằm trong prompt, SVG và chuỗi dữ liệu.

## Kết quả xác minh

- TypeScript: `npx tsc --noEmit` đạt.
- ESLint trên toàn bộ 85 file JavaScript/TypeScript/CJS trong phạm vi đạt.
- Frontend Vite build và server bundle đạt. Vite vẫn có cảnh báo kích thước chunk; server bundle vẫn có cảnh báo `import.meta` của module `security.ts` ngoài phạm vi sửa.
- Sinh lại 1.086 tài nguyên và so sánh với bản trước khi dọn: không khác dữ liệu sau khi loại trường thời gian `updatedAt`.
- Catalog đồ ghép của cả hai phong cách giống bản trước: mỗi phong cách 83 đồ ghép và 20 nền.
- Hai trình cài tài nguyên chạy thử thành công: 236 và 120 tài nguyên, không ghi vào kho đã cài.
- 19/23 bài kiểm tra hồi quy đạt, gồm chọn AI, phục hồi tác vụ, giải phóng Chrome, định tuyến dựng cảnh, lời thoại/miệng, nhịp đọc, VieNeu thực tế, tính liên tục tư thế, vị trí cảnh, thứ tự che khuất và nhạc nền.

## Bốn bài kiểm tra cũ còn lỗi

Không sửa hành vi sản phẩm hoặc thêm lại module cũ để làm các bài này xanh:

| Bài kiểm tra | Nguyên nhân |
| --- | --- |
| `verify-motion-scene-contract.ts` | Import `motionProductionDesign.ts` không còn tồn tại. |
| `verify-motion-voice-timeline.ts` | Import `motionGenService.ts` không còn tồn tại. |
| `verify-motion-render-controls.ts` | Import `MOTION_ASSET_BASE` và `resolveMotionAsset` không còn được export bởi renderer hiện tại. |
| `verify-motion-voice-mood.ts` | Kỳ vọng cường độ người kể bằng `0.4`, trong khi cấu hình đã có trước đợt dọn dùng `NARRATOR_SHARE = 0.35`, cho kết quả `0.28`. Đối chiếu AST xác nhận `src/lib/motionVoice.ts` giữ nguyên logic so với bản sao trước đợt dọn. |

Bản sao nguồn trước khi sửa, kết quả lint, log từng bài kiểm tra và dữ liệu so sánh nằm trong `scratch/change-code-cleanup-20261022/`.
