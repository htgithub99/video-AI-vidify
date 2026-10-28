# Giảm phân cảnh và áp dụng cấu hình Video Motion

## Cấu hình

- Thêm **Nhịp hình** cho cả Dùng kho và Remotion: **Ít · chậm**, **Vừa**, **Nhiều**. Mặc định là Ít.
- Thời gian giữ hình định hướng lần lượt khoảng 14, 9, 6 giây. Đây là hướng dẫn biên tập mềm; không ép số hình, không chặn video do thời lượng mỗi hình.
- Cấu hình nằm trong `visualSettings.pacing`, đi qua request, lưu dự án, khóa cache và bản nháp riêng theo lựa chọn. Đổi nhịp hình giữ kịch bản, giọng và hồ sơ tài nguyên; phân cảnh được lập lại theo lựa chọn mới.

## Remotion

1. Giữ nguyên nhịp kể của kịch bản và các utterance để không ảnh hưởng voice, phụ đề, SEO.
2. Gom các nhịp liên tiếp theo chương, nơi, thời điểm và thời tiết. Giới hạn mỗi yêu cầu khoảng 45 giây lời kể, 32 câu hoặc 8 nhịp. Đây là giới hạn payload, không phải một nhóm bắt buộc có một hình.
3. AI chọn các khoảng câu minh họa, có thể phủ nhiều nhịp kể. Chỉ đổi hình vì sự kiện hình ảnh quan trọng, manh mối, nơi/thời điểm hoặc trạng thái mâu thuẫn; không chia chỉ do đổi câu/người nói.
4. Gộp bản phân cảnh liên tiếp trùng nhiệm vụ, bối cảnh và dữ liệu hình trước khi thiết kế/vẽ. Giữ riêng các manh mối hoặc trạng thái khác nhau.
5. Lưu cảnh một lần dưới nhịp đầu nhóm; `sourceBeatIds` ghi đúng các nhịp mà cảnh thực sự minh họa. Progress/pagination không đếm cảnh dùng chung nhiều lần.
6. Ghép hình trên timeline câu toàn video, lấy mốc clip voice thực khi có. Mỗi cảnh dùng đúng khoảng câu; mốc thoại chỉ dành cho nhân vật đang nói, phụ đề và SFX vẫn theo nhịp nguồn.
7. Sau voice, cảnh dưới 3 giây chỉ có log nhắc kiểm tra; không tự dời manh mối hoặc dừng video để đạt số giây cứng.
8. Retry theo một nhịp sẽ xử lý nhóm chứa nhịp đó; cache nhóm nhận biết thay đổi ở mọi nhịp thành viên. Giữ dữ liệu cũ cho tới khi có kế hoạch thay thế hợp lệ.

## Dùng kho

- Giữ bộ storyboard đã có khả năng một hình phủ nhiều câu/nhịp.
- Áp dụng cùng Nhịp hình trong prompt và cache profile; bỏ gợi ý 5–10 giây cố định để tránh chỉ dẫn trái nhau.
- Không thêm AI vẽ ngoài kho hoặc thay đổi bộ ghép vị trí.

## Cấu hình khác

- Xuất thủ công lấy cấu hình nhạc/chất lượng/cổng xuất từ trạng thái mới nhất trước khi gửi yêu cầu.
- Tách dấu nhận diện bản xuất khỏi dấu ghép hình: đổi nhạc, âm lượng, chất lượng hoặc encoder làm MP4 xem trước cũ hết tương thích mà không phải phân cảnh/vẽ lại.
- Kết quả production công khai thêm cấu hình xuất đã dùng để khôi phục trang không đánh dấu nhạc cũ thành lựa chọn mới.
- Tiếp tục production vẫn dùng snapshot ban đầu và log rõ quy tắc này. Thay đổi lựa chọn trên UI áp dụng vào lượt mới hoặc dựng/xuất thủ công.
- Công tắc nhân vật/hiệu ứng/camera vẫn độc lập. Nếu AI không tạo chuyển động tương ứng, ghi rõ đang dùng hình tĩnh; không dựng chuyển động ngẫu nhiên làm sai vị trí.
- Review ảnh vẫn kiểm ảnh tĩnh, chưa phải kiểm toàn bộ chuyển động.

## Kiểm chứng

- `npm run test:motion-pacing`: mock AI, ba nhịp dùng một kế hoạch và một hình, timing voice/thoại/phụ đề, đổi nơi/thời điểm, giới hạn payload, cache/retry và nhịp hình, gộp cảnh trùng an toàn, cấu hình nhạc và hồ sơ kho.
- `npm run test:motion-remotion`: hồi quy bộ dựng, thiết kế, SVG, sửa từng nhóm, nhiều kiểu hình và kiểm dữ liệu.
- `npx tsx scripts/verify-motion-storyboard.ts`: storyboard Dùng kho và renderer.
- `npx tsx scripts/verify-motion-production-runner.ts`: phục hồi, song song, lưu tiến độ, hủy và khóa lượt chạy.
- `npm run test:motion-behavior`: tám tổ hợp cấu hình chuyển động/hiệu ứng/camera và Canvas.
- `npx tsx scripts/verify-motion-visual-drafts.ts --fixture`: đổi chế độ, reload, cache và phục hồi bằng API giả lập.
- `npx tsc --noEmit --pretty false`.

Không chạy AI thật, TTS thật hoặc tạo video mới trong lượt sửa này. Các bài kiểm thử xác minh đường xử lý và dữ liệu; chất lượng tranh và số cảnh AI thực sự chọn vẫn cần đánh giá ở lượt người dùng tạo tiếp theo.
