# Kiểm thử Video Motion bằng DeepSeek — 27/10/2026

## Kết luận

**Chưa đạt yêu cầu hình ảnh và thời lượng.** Backend đã xuất MP4 thành công, nhưng trạng thái `completed` không chứng minh bố cục đúng lời kể.

- Production: `d6d88170-368e-4144-8579-7ffef156b9f6`.
- Gửi qua API production thật của tool lúc 21:03:26; hoàn tất 21:21:00, gồm thời gian kiểm tra, sửa và khởi động lại backend.
- Cả `aiExecution` và `sceneAiExecution`: `deepseek-chat`, `deepseek-standard`, `room-only`, `strictProvider: true`. Các dòng AI thực hiện trong log chỉ ghi DeepSeek Standard.
- Chọn 1 phút, Remotion horror, nhân vật và camera cố định, hiệu ứng nhẹ, phụ đề bật, review ảnh và ASR tắt.
- 5 nhịp lời kể, 6 cảnh hình; xuất 1280×720, H.264, 30 fps, có AAC stereo.
- Thời lượng thật **38,933 giây**, không phải 60 giây.

## Bằng chứng

- Video: [MP4](../storage/output/motion-video/bat-tro-tren-ban-tho-di-tu-16x9-draft-1793110851089.mp4).
- [Bảng ảnh lấy từ MP4](../scratch/deepseek-one-minute-20261027/index.html).
- [Ảnh ghép 6 cảnh](../scratch/deepseek-one-minute-20261027/contact-sheet.jpg).
- [Metadata, timeline, vị trí và phân vai](../scratch/deepseek-one-minute-20261027/audit.json).
- [Request gốc](../scratch/deepseek-one-minute-20261027/request.json).

## Kiểm từng cảnh

| Cảnh | Thời gian | Nhận xét từ ảnh MP4 |
| --- | --- | --- |
| 1 | 0–9,2 s | Nhìn rõ cha và con, nhưng bát giống đĩa; dấu tay thành hình bàn tay dựng nổi khỏi tro. Chưa diễn tả đúng dấu in trong bát. |
| 2 | 9,2–14,4 s | Cổng được ghép ngay trên vách/sàn gian nhà, không thể hiện sân ngoài. Khung bàn thờ và cửa chồng vị trí, khó đọc không gian. |
| 3 | 14,4–18,2 s | Bát và đèn có đặt trên bàn thờ, nhưng bàn thờ cao hơn đầu người; người quá nhỏ so với đồ vật. Cảnh ghi `detail` nhưng tiêu điểm vẫn ở xa bên phải. |
| 4 | 18,2–24,8 s | Có bà áo trắng phía sau cổng, đúng màu lời kể. Tuy nhiên cổng giống lồng đặt trong nhà; bát/đèn đổi hình và cách hiển thị so với cảnh trước. |
| 5 | 24,8–32,9 s | Cha và con đứng rõ, không cần dựng động tác bịt miệng. Tuy nhiên cổng vẫn nằm trên cùng mặt phẳng trong nhà, bát/đèn ở quá cao. |
| 6 | 32,9–38,9 s | Giữ nhận diện cha/con, câu thoại của con có vai riêng. Bát trở về hình bát sâu nhưng dấu bàn tay quan trọng không còn đọc được. Bàn thờ vẫn quá lớn. |

Nhân vật giữ nhận diện tương đối thống nhất; trẻ thấp hơn người lớn. Phụ đề không có nền hộp. Không cần bổ sung động tác phức tạp để sửa các lỗi trên.

## Nguyên nhân đã đối chiếu với dữ liệu và code

1. **Bàn thờ bị coi là kiến trúc gắn tường.** Node `ban_tho_c1` có `role: fixture`, `mount: wall`, thay vì vật đỡ có mặt bàn. `remotionRole` tin role AI trả về. `remotionMountRegion` còn xét cả cụm tiếng Việt “kê cạnh cửa”, nhận thành cửa và dùng vùng `doorway`. Bàn thờ và cửa cùng nhận vùng x=0,74, y=0,185, rộng=0,208, cao=0,593. Vì vậy bảng vị trí hợp lệ về số nhưng sai loại và sai tỷ lệ thực tế.
2. **Cổng ở xa chưa có quan hệ không gian ngoài nhà.** Cổng không có socket `gate` được xác nhận từ nền. Fallback dựng vùng cổng x≈0,33, y=0,26, rộng=0,34, cao=0,62 ngay trên bố cục trong nhà. Quan hệ `behind` đặt bà sau cổng, nhưng không đưa cả nhóm ra ngoài sân hoặc thu nhỏ theo khoảng cách.
3. **Dấu tay chưa được biểu diễn như trạng thái bề mặt của vật chủ.** Cảnh đầu có node decal `dau_tay`, `inside` bát, nhưng tài nguyên và điểm tiếp xúc cho hình bàn tay nổi. Cảnh cuối chỉ giữ mô tả dấu tay trong node bát, không có lớp dấu tay riêng; tài nguyên đã ghép không thể hiện được chi tiết ấy. “Có node/asset” chưa đồng nghĩa với giữ được manh mối nhìn thấy.
4. **Ngưỡng thời lượng hiện quá rộng cho lựa chọn 1 phút.** `motionDurationQa` cho phép tỷ lệ từ 0,5 tới 1,75. Giọng 38,905/60≈0,648 được coi là cảnh báo, production dùng timeline theo giọng và xuất 38,933 giây. Đây không phải lỗi mux hay render cắt mất 21 giây.
5. **Cổng kiểm hình hiện kiểm chủ yếu cấu trúc và hình học.** Các scene có đủ asset, quan hệ và tọa độ để render; chưa bắt được đồng thời sai loại vật, vị trí ngoài/trong nhà, tỷ lệ với người và manh mối bề mặt biến mất. Review AI đang tắt theo cấu hình thử.

## Lỗi phát hiện và đã sửa trong lượt thử

Bước lấy chủ đề bị dừng dù DeepSeek trả đúng JSON và trích dẫn tồn tại nguyên văn. Nguyên nhân cụ thể: validator yêu cầu một alias xuất hiện thành cụm liên tiếp trong evidence, nhưng prompt không nêu điều kiện này; thông báo sửa chỉ ghi lỗi chủ đề chung.

Đã bổ sung yêu cầu vào prompt, trả lỗi riêng cho alias/evidence và dùng recovery revision để bản nháp đã hết lượt được thử lại một lần theo hợp đồng sửa mới, giữ lịch sử từ chối. Không bỏ kiểm chứng nguồn và không chuyển nhà cung cấp.

Sau nạp backend và resume cùng production, bước này chạy qua. Những lỗi SVG sau đó gồm thẻ đóng không khớp, thẻ/tài nguyên không hỗ trợ và XML sai cấu trúc đã được tool phục hồi bằng DeepSeek; dựng đủ 6 cảnh và xuất được MP4.

Kiểm tra sau sửa: `verify-motion-folk-story.ts`, `tsc --noEmit`, `git diff --check` đều qua. Các lỗi hình và độ dài ở trên chưa được sửa trong lượt đánh giá này.

## Âm thanh và giới hạn đánh giá

- File MP4 có âm thanh, 38,90 giây audio; loudness đo lại -14,06 LUFS, true peak -0,91 dBTP, LRA 1,50 LU.
- Nhịp đọc do tool đo: 3,239 âm tiết/giây tính cả khoảng nghỉ; đoạn nói hoạt động 5,39 âm tiết/giây.
- Người kể dùng `custom-thantrung-narrator-v2-20261025`; câu cuối của trẻ dùng voice child riêng.
- ASR tắt, các clip mang trạng thái `unchecked`. Đã kiểm metadata và mức âm, **chưa xác nhận nghe rõ từng chữ hoặc giọng giống mẫu bằng đánh giá nghe trực tiếp**.

## Phần cần sửa tiếp theo từ kết quả thử

- Chuẩn hóa loại chủ thể trước bố trí: bàn thờ/bàn là vật đỡ; tên vị trí đi kèm không được biến nó thành cửa hoặc kiến trúc.
- Bố trí theo vùng không gian: cổng ngoài sân, nhân vật ngoài sân và tỷ lệ chiều sâu đi cùng nhau; fallback không gắn cổng lên vách trong nhà.
- Giữ manh mối như dấu tay bằng trạng thái/lớp bề mặt ổn định gắn vật chủ, tái sử dụng xuyên cảnh.
- Đặt tỷ lệ vật đỡ theo người và mặt đất, rồi mới đặt bát/đèn lên mặt bàn; không kéo vật đỡ theo kích thước socket cửa.
- Dùng thời lượng giọng đo thực để điều chỉnh lượng nội dung tự nhiên cho video ngắn; không làm chậm giọng hoặc kéo ảnh trống để đủ phút.

Không cần tăng độ chi tiết động tác để giải quyết các vấn đề này.
