# Video truyện ma đối chiếu mẫu — 28/10/2026

## Kết quả thực tế

- Production: `f3d013bf-c3fe-41f8-bef3-679b90bcfb2b`, trạng thái `completed`.
- Tên: **Dấu dép quay vào**. Nội dung mới, dựng qua API production của chính Video Motion.
- MP4: `storage/output/motion-video/dau-dep-quay-vao-16x9-standard-1793121848493.mp4`.
- Thời lượng thực: 64,033 giây; 1920×1080, H.264, 30 fps; AAC 64,033 giây.
- 7 nhịp kịch bản, 9 cảnh xuất; dữ liệu lưu còn các cảnh của phiên bản kịch bản trước nhưng chúng không tham gia timeline.
- Hai nhóm AI: DeepSeek Standard, room-only, strictProvider; không fallback.
- Remotion horror; nhân vật chuyển động đơn giản; hiệu ứng nhẹ; camera cố định; review ảnh AI tắt; phụ đề bật.
- Mức âm đo trên MP4: -14,05 LUFS, true peak -0,97 dBTP. Đây là kiểm tra tín hiệu; chưa phải xác nhận nghe và so sánh đầy đủ chất giọng với mẫu.

## Mẫu và giới hạn đối chiếu

[ĐI ĐÁM MA ĐỪNG LẠY BỐN LẠY](https://www.youtube.com/watch?v=a6oQO7GqGwo&t=385s). Dùng các khung tham chiếu đã lưu và quan sát rải rác trong đoạn phát để đối chiếu mặt nhợt, màu đêm, nhân vật đơn giản, phòng có chiều sâu, khung toàn xen khung cận. Không coi đây là phân tích toàn bộ video mẫu từng frame.

Kết quả **chưa giống mẫu 100%**. Tạo hình, độ sâu phòng, bố trí người qua các góc cắt, diễn xuất và cảnh cận bàn tay vẫn còn thô. Một số lời kể nói ngồi nhưng hình dùng đứng để tránh dáng ngồi không có vật đỡ, theo phạm vi minh họa đơn giản người dùng đã chấp nhận. Không đánh giá thành công xuất MP4 là đã đạt chất lượng nghệ thuật của mẫu.

## Sửa trong lượt chạy

- Chuẩn hóa hướng nét và hình người mặc áo đơn giản cho horror. Renderer dựng các nhân vật đủ điều kiện bằng vector chung, giữ giới tính, màu áo và áo trắng của bóng ma. DeepSeek vẫn phân cảnh và dựng nền/đạo cụ; nhân vật có trang phục đặc biệt và profile khác giữ đường dựng SVG hiện có.
- Thêm chớp mắt xác định theo thời gian; giữ miệng khép cho người kể. Bảo toàn cấu hình bật/tắt chuyển động.
- Khung cận nhân vật dùng phần thân trên thay vì luôn lấy cả người.
- Chuẩn hóa anchor của hiệu ứng: không nhầm mã node/vùng với điểm vật lý; rain/fog dùng vùng nền.
- Kiểm tra phiên bản hình chỉ trên các cảnh thuộc kịch bản hiện hành; cảnh cũ ngoài timeline không chặn xuất.
- Không đưa node chú thích vào hình truyện ma; giữ phụ đề độc lập và giữ label ở profile khác.
- Ghế thấp và quan tài dùng giới hạn tỷ lệ riêng so với người lớn.
- Hợp nhất alias của đạo cụ từ phân tích nguồn và yêu cầu phân cảnh, tránh lặp cùng một quan tài. Chỉ khớp tên chủ thể ở đầu cụm; không nhầm “bàn thờ có di ảnh” với di ảnh.
- Dáng ngồi của hình người dựng chung chỉ dùng khi có tiếp xúc ghế hợp lệ; trường hợp khác dùng dáng đứng ổn định.

## Kiểm tra

- TypeScript, kiểm hình người horror, Remotion integration, staging, geometry và render behavior đã đạt; `git diff --check` đạt.
- Đã trích và xem khung giữa của cả 9 cảnh từ đúng MP4 cuối.
- Đã kiểm hai khung 3,6 và 4,0 giây từ MP4, trong cùng cảnh và vùng mặt nhân vật. Sai khác pixel trung bình 4,469 trên thang 0–255; có thay đổi hình chớp mắt, không chỉ thay phụ đề.
- Không chạy video 5 hoặc 20 phút.

## Hồ sơ kiểm tra

`scratch/horror-reference-one-minute-20261027/` chứa `audit.json`, `audio-levels.txt`, `animation-check.json`, `scene-01.jpg` tới `scene-09.jpg`, `contact-sheet.jpg`, `comparison.html` và request đầu vào.

Trang xem: `http://127.0.0.1:3002/scratch/horror-reference-one-minute-20261027/comparison.html`.
