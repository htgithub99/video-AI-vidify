# Video Motion: nhịp chậm và vị trí dùng chung — 23/10/2026

Các thay đổi áp dụng theo dữ liệu cảnh và nhân vật, không theo tên truyện. Hai gói được kiểm là **Tối giản mặt nạ** và **Chibi màu dân gian**.

## Chuyển động và chuyển cảnh

- Camera mặc định `none`, bỏ cơ chế ép đổi góc sau mỗi hai câu.
- Cảnh dưới 8 giây giữ camera đứng yên. Cảnh dài dùng thời gian chuyển động tối thiểu 45 giây, zoom tối đa 0,8%, pan tối đa 0,6% chiều cao khung nhìn. Cảnh dài hơn 45 giây trải chuyển động trên toàn cảnh.
- Cận cảnh và đạo cụ dùng cùng tiến độ chậm. Bỏ lắc đạo cụ, nhấp nháy quầng sáng tự động; bóng đổ không còn nhấp nháy và chỉ tăng kích thước rất nhẹ.
- Chuyển cùng bối cảnh dùng hòa hình 1,2 giây; đổi bối cảnh dùng tối 1,6 giây. Giới hạn thời gian chuyển không quá 25% cảnh nhận. Góc phụ chỉ có thể xuất hiện khi khung chính dài hơn 20 giây.

## Giọng đọc

File tham chiếu: `C:/Users/Admin/Desktop/Thần trùng - Trùng tang kỳ truyện (1).mp3`.

Đã đo nhịp âm thanh và áp dụng cho cấu hình giọng của dự án. Nhịp ước lượng của file là 3,553 tiếng/giây; khoảng nghỉ mệnh đề/câu/hồi hộp/nhịp lần lượt khoảng 0,47/0,56/0,72/0,88 giây. Đây là phép đo âm học, không phải đếm âm tiết từ bản chép lời đã xác minh.

Thoại giữ nhịp thống nhất, không nhân thêm tốc độ AI chọn và hệ số tăng tốc do cảm xúc. Cảm xúc vẫn giữ sắc thái và âm lượng. Sau xử lý, câu thoại tiếng Việt đủ dài vượt 3,8 tiếng/giây được kéo chậm bằng `atempo`, giữ cao độ. Phiên bản cấu hình được đưa vào khóa cache để bản giọng cũ không được nhận nhầm là bản đã sửa.

Ba câu thoại thật trong video **Tiếng Cào Đêm Tiết Khí** đã được tạo lại bằng TTS:

| Câu | Trước, tiếng/giây | Sau, tiếng/giây |
|---|---:|---:|
| Đóng chặt then gỗ lại mau lên thằng ranh! | 4,818 | 3,700 |
| Ôi bu bu ơi, chân chúng nó lơ lửng không chạm đất kìa! | 4,779 | 3,728 |
| Chú Vinh ơi, tà ma lại hành thằng bé rồi, mau giữ nó lại! | 4,975 | 3,326 |

Khi kế hoạch giọng tách lời dẫn và lời nhân vật, compiler giữ liên kết với khung hình cũ. Chuyển động miệng chỉ được gắn vào người nói trong đoạn thoại.

## Vị trí và tài nguyên

- Chỗ tựa phải khớp loại đồ vật và quan hệ không gian; cùng chất liệu gỗ không làm giường khớp ghế. Dưới giường khác trên giường; trái/phải và trước/sau được kiểm riêng.
- Điểm tiếp xúc có thể lưu đồ đạc, quan hệ, vùng tiếp xúc và cao độ ghế/sàn. Di chuyển, phóng tỷ lệ và phản chiếu đồ đạc mang theo vùng tiếp xúc.
- Giữ điểm đặt của cùng nhân vật qua các câu trong cùng cảnh khi tư thế và chỗ tựa chưa đổi. Bối cảnh hư hỏng có trạng thái riêng và được duy trì qua lời kể tiếp theo trong cùng cảnh.
- Ưu tiên phiên bản tài nguyên đã sửa, theo chuỗi thay thế. Đổi hình học hoặc biến thể ngày/đêm làm mất hiệu lực cache khung và ảnh kiểm tra.
- Kiểm yêu cầu và dựng vị trí dùng đúng biến thể ánh sáng mà renderer hiển thị. Tiếp tục luồng dùng kho → ghép cảnh → vẽ phần thiếu khi không có bản phù hợp.
- Thêm 16 tài nguyên: phòng giường cao và nhà gỗ sụp một nửa × hai gói × ngày/đêm × hai hướng. Có chỗ nằm trên giường, nằm/ngồi co dưới gầm, ngồi mép giường, ghế riêng và đứng bên cạnh.

Đã dựng và xem 32 ảnh kiểm tra, gộp thành hai ảnh:

- [Tối giản mặt nạ](video-references/placement-20261023/minimal_mask.jpg)
- [Chibi màu dân gian](video-references/placement-20261023/chibi_folk.jpg)

## Kiểm chứng

- TypeScript, ESLint các tệp sửa trực tiếp.
- Kiểm quan hệ chỗ tựa, vùng tiếp xúc, ưu tiên bản sửa, trạng thái cảnh, vị trí liên tục và hình học bản ban đêm.
- Kiểm nhịp camera bằng hàm camera thật trong trình duyệt; kiểm cảnh ngắn đứng yên và giới hạn tốc độ zoom/pan.
- Kiểm nhịp giọng, cache, thời gian cảnh/phụ đề và tín hiệu sau xuất AAC.
- Kiểm tư thế, yêu cầu bối cảnh, vị trí hai gói, thứ tự lớp vẽ bằng điểm ảnh, người nói và SEO.
- Video thử [3 cảnh, 22,557 giây](../storage/output/motion-video/kiem-tra-3-canh-nhip-cham-16x9-draft-1792754533380.mp4): 1280×720, 30 fps, H.264/AAC; giải mã toàn bộ bằng FFmpeg không báo lỗi. Các khung ngắn trong bản này giữ camera đứng yên. Không có nhạc/SFX trong bản thử này.

Các báo cáo chi tiết nằm tại `scratch/placement-20261023/`: `preview-render.json`, `dialogue-comparison.json`, `stills-report.json`, `installed.json`. Phép đo file tham chiếu được lưu trong `scratch/current-motion-run/reference-pace-comparison.json`.

## Phạm vi xác nhận

Video đầy đủ 20 phút đã xuất trước đó vẫn được giữ nguyên; chưa tạo lại toàn bộ giọng và video dài bằng bản sửa này. Bản thử xác nhận xử lý kỹ thuật và nhịp đo được, chưa phải đánh giá chất giọng bằng tai. Tư thế trong hai gói vẫn là minh họa đơn giản; fallback ngồi co chưa có chi tiết khớp cơ thể. Kiểm hình học không tự chứng minh rằng mọi hình SVG do AI vẽ đều đúng ngữ nghĩa; cần tiếp tục kiểm ảnh ở những cảnh mới. AI trả thiếu kết quả kiểm ảnh sẽ được ghi rõ là chưa kiểm đủ, không báo tất cả đã đạt.
