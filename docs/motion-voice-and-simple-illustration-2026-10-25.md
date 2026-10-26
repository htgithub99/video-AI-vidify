# Giọng Thần trùng và minh họa đơn giản — 25/10/2026

## Quy tắc sản phẩm

Hình chỉ minh họa nội dung: đúng nhân vật, bối cảnh, vị trí, đồ vật, chủ sở hữu và trạng thái quan trọng. Được dùng một hình cho nhiều câu khi tình huống còn đúng. Cử chỉ phụ hoặc động tác khó có thể để lời kể diễn đạt; không buộc dựng thêm động tác tay, đường đi hay mọi động từ. Không bỏ người, vật chứng hoặc kết quả làm thay đổi cốt truyện. Chỉ chọn tài nguyên trong đúng gói, không sinh thêm tài nguyên khi sản xuất.

## Sửa trong lượt này

- Kênh Truyện ma chuyển người kể sang mẫu `Thần trùng - Trùng tang kỳ truyện.mp3`. Cắt mẫu sạch ở 128,32–139,52 giây, đo nhịp trên cửa sổ 120–180 giây. Giữ các giọng nhân vật đã phân vai, không đổi đồng loạt thành giọng người kể. Lệnh cấu hình có sao lưu, kiểm tham số và phục hồi cấu hình nếu thất bại.
- Hồ sơ lưu tên, dấu vân tay mẫu, tốc độ và khoảng nghỉ. Bản đo cửa sổ có nhịp ước lượng 3,7/giây, phát âm khi có tiếng 5,27/giây. Đây là phép ước lượng âm học, không phải đếm âm tiết chính xác. Manifest tại `scratch/thantrung-voice-20261025/config-backup/manifest.json`.
- Giữ nguyên phụ âm nhỏ ở đầu/cuối bằng cắt biên PCM bảo thủ; bỏ lọc nhiễu/deesser mạnh trên tiếng TTS sạch, nén nhẹ và giữ giới hạn đỉnh. Áp dụng cùng đường xử lý cho người kể và các vai. Không áp hai lần hệ số làm chậm khi đã có hồ sơ đo mẫu; giới hạn điều chỉnh tốc độ để tránh kéo/ép tiếng quá mức.
- Khoảng nghỉ theo mệnh đề, câu hỏi, đổi vai, kết câu và chương. Trừ khoảng im lặng sẵn có ở hai đầu clip, tránh cộng chồng cùng một khoảng nghỉ vào mọi chỗ nối.
- Đóng băng hồ sơ nhịp trong mỗi lượt chạy. Hiệu chỉnh một giọng trong lượt cũ không ghi đè mẫu mới mà người dùng vừa chọn ở cấu hình toàn cục.
- Kiểm âm thanh độc lập với review ảnh: phát hiện clip im lặng, kiểm số đoạn TTS trả về, nhận dạng từng câu, retry hữu hạn đúng câu. Nhận dạng phát hiện hai từ lệch liên tiếp cả khi tỷ lệ tổng nhỏ. Giữ phương án đạt hoặc tốt nhất qua các lần thử; không thay bằng lần cuối kém hơn. Những câu còn nghi vấn có trạng thái riêng và danh sách nghe lại trên UI, không gắn nhãn đạt chỉ vì hết retry; không dùng thời gian từng từ chưa đáng tin cho phụ đề.
- Tăng phiên bản xử lý, nhận dạng và cache để bản đã ghép theo quy tắc cũ được tạo lại đúng phần phụ thuộc.
- Tìm hữu hạn nhiều bố cục hợp lệ thay vì dừng ngay ở bố cục đầu tiên. Xếp hạng theo trọng tâm, độ gọn, khả năng nhìn người/đồ và tính liên tục; vẫn giữ quan hệ vị trí, tư thế, vật đỡ và quyền sở hữu là điều kiện cứng. AI chỉ chọn mã phương án, code giữ tọa độ. Cập nhật prompt đọc cảnh, chia hình và review theo quy tắc minh họa đơn giản.

## Kiểm đã hoàn tất

- TypeScript không báo lỗi; format các file triển khai theo cấu hình 400 cột.
- Kiểm giọng bằng PCM/FFmpeg thật với bộ tạo tiếng và nhận dạng giả lập: bảo toàn âm nhỏ ở biên, retry clip im lặng, giữ phương án tốt nhất, phân biệt loại khoảng nghỉ, cache không retry vô hạn và hồ sơ lượt chạy không bị đổi giữa chừng.
- Kiểm phổ tín hiệu tổng hợp: dải phụ âm nhỏ được giữ tốt hơn bộ lọc cũ 1,31 dB so với năng lượng nguyên âm, không clipping; không kém bộ lọc nhẹ gần nhất. Con số này không thay thế đánh giá độ rõ chữ bằng tai.
- Kiểm nhịp voice và cache, chọn kho ở hai gói, quan hệ vị trí, visual contract, liên tục tư thế và chia cảnh thành công.
- Kiểm hồi quy phòng AI, đổi nhà cung cấp, upload, hủy/reload, polling job, giữ log trên UI, đồng bộ miệng đúng người nói và camera/chuyển cảnh nhẹ thành công. Các kiểm phòng AI dùng giao diện cục bộ giả lập; không đồng nghĩa dịch vụ ngoài luôn sẵn sàng.

## Giới hạn kiểm chứng

Phiên làm việc không có công cụ nghe trực tiếp âm thanh. Chỉ có phép đo, nhận dạng, kiểm luồng/giải mã và file để nghe đối chiếu; chưa kết luận cảm xúc, âm sắc hay độ rõ từng chữ bằng tai. Không cam kết mọi đầu vào hoặc dịch vụ AI bên ngoài sẽ không bao giờ lỗi.

Lượt video thật dùng lại kịch bản và dữ liệu đọc cảnh đã có để kiểm phần chọn bố cục mới → voice mới → render. Không coi lượt này là xác nhận toàn tuyến nguồn → DNA → biên kịch mới → SEO đã đạt chất lượng sáng tác.

## Kết quả chạy thật

- Job dựng `b7b9d9ee-055f-462c-8e34-b1814ec51d35`; job xuất `8bde95ad-c6c0-4964-bf83-3f63187988cb`, hoàn tất 00:42:51 ngày 25/10 giờ Việt Nam.
- Gói Chibi màu dân gian, 21 kế hoạch hình, 26 đoạn hình trên timeline, 3 nhân vật; review ảnh AI tắt. Các ảnh và tài nguyên đều lấy từ kho.
- Khi Gemini từ chối một yêu cầu chọn bố cục, tool thử DeepSeek Standard; do DeepSeek chưa đăng nhập nên chuyển ChatGPT Auto thành công. Các nhóm còn lại dùng Gemini. Không phải lỗi vẽ ảnh và không phát sinh tài nguyên ngoài kho.
- Voice mới: 107,727 giây; nhịp đo 3,658/giây, nhịp khi có tiếng 5,6/giây, đoạn nói trung vị 1,93 giây, 37,9 khoảng ngừng/phút. Không ép đủ 120 giây bằng cách kéo âm thanh.
- Trong 20 clip: 19 qua ngưỡng nhận dạng, 1 cần nghe đối chiếu. Câu cuối bắt đầu “Khi nắng đầu ngày lọt qua cửa…” có độ lệch tốt nhất khoảng 11%, hai từ liên tiếp bị nhận dạng khác; được giữ trạng thái `review`, không coi là đã xác nhận sai phát âm hoặc đã đạt rõ chữ.
- Bản thử riêng sáu nhóm giọng dài 38,776 giây: người kể, nam/nữ trưởng thành, nam/nữ cao tuổi và trẻ em đều qua ngưỡng kiểm tự động hiện tại sau retry hữu hạn. “Qua ngưỡng” không đồng nghĩa nhận dạng khớp tuyệt đối hoặc đã được nghe duyệt.
- Khi xuất, tool đóng Chrome AI sau khi hoàn tất tác vụ; render bằng hai luồng, H.264/AAC, 1280×720, 24fps, 4,2 MB, âm lượng đo −14,0 LUFS. Giải mã toàn bộ âm thanh và hình ảnh bằng FFmpeg không báo lỗi.
- Đã xem 26 ảnh giữa đoạn và bốn bảng ảnh biên từ chính MP4: giữ đủ hai bát khi quay lại bàn; người đứng/ngồi/nằm độc lập; bà nhắm rồi mở mắt, ngồi dậy gần sáng; người nằm ở giữa hai cháu; Nam trước cửa và Út phía sau. Cử chỉ ra hiệu im lặng được để lời kể thể hiện, không coi là lỗi thiếu diễn hoạt.
- Khung hình vẫn thiên về góc nhóm và còn khoảng tường trống; không kết luận bố cục đã giống mẫu hoàn toàn. Không lấy đổi góc liên tục hoặc thêm động tác khó làm điều kiện hoàn thành.

File bàn giao:

- [MP4 chạy thật](../storage/output/motion-video/tieng-go-ben-cua-bep-kiem-kho-minh-hoa-16x9-draft-1792863758804.mp4).
- [Bản thử sáu nhóm giọng](../storage/output/motion-video/giong-than-trung-ro-chu-20261025.mp3).
- [Thông số, kiểm giải mã và ảnh trích](../scratch/thantrung-voice-20261025/live-2m/final-frame-audit.json).
- Bốn bảng ảnh `scratch/thantrung-voice-20261025/live-2m/final-board-1.jpg` đến `final-board-4.jpg`; ảnh biên `boundary-board-*.jpg`.
