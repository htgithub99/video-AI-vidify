# Khung SVG nhân vật trong prompt dựng cảnh

Đã đưa khung SVG đã duyệt vào prompt dựng cảnh thật. Lịch sử và giải thích dùng chung `characterFrames/history-explainer.ts`; truyện ma dùng `characterFrames/horror.ts`. Khung được chèn một lần trong request có nhân vật toàn thân, không thêm lượt AI thiết kế hoặc request khác. Sơ đồ không người và chi tiết không dùng khung này. Cấu hình AI duyệt ảnh cảnh giữ nguyên.

Khung khóa hình học, không khóa tóc, tuổi, khuôn mặt, trang phục và phụ kiện của truyện. Prompt yêu cầu giữ phép chuẩn hóa bên trong, chỉ dùng một phép đặt vị trí/scale đều bên ngoài; môi trường và bố cục do AI vẽ. Không thêm code chỉnh hình học cảnh sau khi vẽ. Đã tăng revision của ba profile để thay đổi có mặt trong khóa đầu vào dựng mới.

## Kiểm chứng trực tiếp

Gemini 3.8 Flash, mức Trung bình; mỗi kiểu một request trong room mới; không upload ảnh. Prompt sinh trực tiếp bằng hàm prompt production. Tất cả kết quả là JSON hợp lệ và SVG render được, không sửa cú pháp hoặc hình học. So raw SVG với SVG qua `normalizeFirstSceneComposition`: 0 pixel khác ở cả ba cảnh.

| Kiểu | Kết quả |
|---|---|
| Lịch sử | Giữ hình học đầu/thân/chân; hai nhân vật chính và bốn lính nền. Mái khiên còn hở khỏi tay: lỗi trong đầu ra AI gốc. Chưa đạt hoàn chỉnh về tiếp xúc vật thể. |
| Giải thích | Hai người giữ khung chung; tóc, áo, quần theo cast; đứng chạm nền. Đạt trong cảnh thử. |
| Truyện ma | Giữ đầu mặt nạ, thân vòm và normalization transform; tóc/trang phục theo cast. Đạt khung riêng trong cảnh thử. |

Một cảnh mỗi kiểu chưa chứng minh độ ổn định xuyên video hoặc tư thế ngồi/quỳ. Các mẫu để chuyển động cố định nhằm kiểm tra hình học, không phải kiểm tra animation.

Trang kết quả, prompt, phản hồi nguyên bản, SVG và thông số: `scratch/character-svg-frame-tests-20261031/index.html`.

## Kiểm tra code

- `npm run test:motion-profile-isolation`: qua cả năm script.
- `npx tsc --noEmit`: qua.
- `git diff --check`: qua.

## Da trắng và phát lại JSON qua renderer thật

Đổi da lộ và mặt nạ sang `#ffffff` cho cả ba profile; frame SVG và grammar thống nhất quy tắc này. Tóc, trang phục và phụ kiện theo truyện. Quy tắc màu da ưu tiên hơn mô tả cast/identityMemory cũ. Revision hiện tại: lịch sử 23, giải thích 13, truyện ma 22.

Ba JSON từ lượt Gemini được giữ nguyên, có SHA-256 trước khi phát lại. Script thử nhập trực tiếp các hàm production `buildRemotionScenes`, `compileRemotionStory`, `renderRemotionStill`, `renderRemotionVideo`. Callback AI chỉ phát lại JSON đã lưu và kế hoạch cảnh tương ứng, không gửi request AI mới. Tắt review AI, camera và chuyển động để kiểm tra hình học gốc. Không ghi vào dự án của người dùng.

Cả ba cảnh được pipeline nhận, biên dịch và xuất MP4 1280×720, 30fps, 6.7 giây, 201 frame. Thời lượng/spec lấy từ compiler thật. `validateMotionMedia` kiểm thông số và giải mã toàn bộ ba MP4 thành công. Đã xem ảnh preview và lấy frame từ MP4. Khác biệt màu nhỏ giữa preview và frame video đến từ render/scale và H.264; không tuyên bố hai ảnh này trùng pixel. Khiên ở lịch sử vẫn hở khỏi tay như SVG gốc. Hai kiểu còn lại giữ đúng bố cục và khung người trong lượt thử.

JSON cũ giữ màu da cũ, vì không sửa đầu vào khi kiểm renderer. Prompt mới và frame trắng được xuất riêng để dùng cho lượt AI tiếp theo. Trang kết quả: `scratch/character-svg-frame-tests-20261031/tool.html`; log và thông số: `tool-replay-results.json`. Script tái lập: `replay-tool.ts`, `verify-tool.ts`, `tool-gallery.ts` trong cùng thư mục.

Sau thay đổi da trắng: bộ năm script `test:motion-profile-isolation` và TypeScript đều qua.
