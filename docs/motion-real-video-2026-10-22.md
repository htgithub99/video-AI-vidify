# Kiểm tra một video thật khoảng 2 phút — 22/10/2026

Truyện thử: **Góc Bàn Thờ Ông Xó**, gói **Tối giản mặt nạ** (`minimal_mask`), khung 16:9, 1920×1080, 30 fps. Nội dung gồm 20 khung minh họa, 17 câu kể và 3 câu thoại, dài khoảng 112 giây. Chạy các API của tool đang mở tại cổng 3002, dùng DeepSeek cho nội dung, Gemini cho dựng cảnh và giọng VieNeu của kênh Truyện ma. Bản nháp đang nhập trên giao diện của người dùng được giữ nguyên.

## Bằng chứng

- [MP4 bản cuối có nhạc nền](../storage/output/motion-video/goc-ban-tho-ong-xo-16x9-standard-1792673503014.mp4): xuất thành công lúc 19:52:09, 111,951 giây, 19.657.968 byte, thời gian xử lý 326 giây.
- [Ảnh xác nhận trong mục Kết quả của tool](../scratch/real-video-2min-20261022/tool-results.png): bản mới nằm đầu danh sách.
- [Thư viện ảnh đối chiếu từng câu](../scratch/real-video-2min-20261022/index.html): ảnh trích từ MP4, kèm câu kể và dữ liệu vị trí.
- [Kiểm tra bố trí và lời thoại](../scratch/real-video-2min-20261022/audit.json): 20 khung, không thiếu tài nguyên, không có lỗi được bộ kiểm phát hiện; đoạn kể không có cửa sổ nhấp miệng, ba đoạn thoại chỉ định đúng người nói.
- [Log xuất bản cuối](../scratch/real-video-2min-20261022/render-job.json).
- [Thông tin MP4](../scratch/real-video-2min-20261022/probe.json).
- [Các chỉnh sửa dữ liệu sau rà ảnh](../scratch/real-video-2min-20261022/visual-repairs.json).

## Các lỗi phát hiện trong lượt chạy và cách sửa

| Lỗi | Nguyên nhân và thay đổi |
|---|---|
| Bà đang nằm nhưng đổi thành đứng khi nói | READ trộn hành động nói với tư thế thân. Thêm trạng thái tư thế và nối tiếp trạng thái theo nhân vật, địa điểm, chương và hồi tưởng; giữ nằm/ngồi khi nói nếu câu kể chưa yêu cầu đổi tư thế. Chuẩn hóa chõng/giường về loại chỗ tựa phù hợp. |
| Dựng bếp bị dừng vì thiếu điểm đặt cho vách đất | Đối tượng hình học của cảnh bị xem là đồ đạc cần điểm đặt. Bộ kiểm phân biệt vách nền với vật treo tường; đồ đạc, vật treo và chỗ tựa vẫn phải có điểm đặt thật. Dùng chung bộ kiểm cho kho, cache, cảnh ghép và cảnh vẽ mới, chuyển lý do thiếu cho AI vẽ lại. |
| Sàn che ghế và chõng | Thứ tự nhóm SVG do AI trả về đặt sàn sau đồ đạc. Renderer đưa lớp sàn về trước lớp đồ đạc, áp dụng cả nền đã cache; prompt cũng yêu cầu đúng thứ tự. |
| Người nghe che khuất bà nằm đang nói | Góc qua vai không phù hợp với người nói ở tư thế thấp. Tự đổi sang góc thấy các nhân vật khi có người nằm/ngồi thấp trên chỗ tựa. |
| AI thêm bóng ma ở câu chỉ nhắc tiếng quạt hoặc mùi trầu | Prompt cũ gợi thêm ghost cho hiện tượng chưa nhìn thấy. Đổi điều kiện: chỉ vẽ hình ma khi lời kể xác nhận có hình thể nhìn thấy. |
| Cùng chén nước bị chia thành nhiều đạo cụ | Bổ sung quy tắc giữ ID vật xuyên các cách gọi chung, vật liệu và nhiệt độ; chuyển từ cầm tay sang mặt bàn không tạo vật mới. |
| Xuất được video nhưng mất nhạc nền | `loudnorm TP=-12` không hợp lệ với FFmpeg; đường dự phòng xuất giọng đọc nên job vẫn hoàn thành. Sửa thành `TP=-9`, tăng phiên bản cache nhạc và thêm test chạy bộ lọc FFmpeg thật ở ba mức âm lượng. |

Chrome phục vụ AI đã được đóng thành công khi chuyển sang xuất video; hai lượt xuất đều đi qua bước này.

Lượt xuất đầu hoàn thành nhưng nhạc nền bị bỏ qua do lỗi bộ lọc. Sau sửa, đã xuất lại qua API render của tool; log xác nhận soạn nhạc `eerie`, ghép âm thanh và đo đầu ra **−14,0 LUFS**, không còn lỗi `TP` ngoài giới hạn. Đã giải mã luồng âm thanh từ MP4 cuối bằng FFmpeg, mã thoát 0.

## Phạm vi chỉnh dữ liệu và phạm vi kiểm chứng

Sau lượt AI đầu, có rà ảnh và sửa trực tiếp dữ liệu bản thử: bỏ bóng ma không được kể là nhìn thấy, giữ người cháu trên ghế cạnh chõng, thống nhất chén nước và chỉnh điểm tiếp xúc với mặt chõng theo SVG thật. Những thay đổi này có nhật ký riêng. Các quy tắc và lỗi renderer tương ứng đã được sửa trong code, nhưng bản MP4 này có bước rà sửa dữ liệu, không phải bằng chứng rằng mọi truyện mới đều tự động đúng ngay lần đầu.

Đã kiểm bằng mắt đủ 20 ảnh đại diện của 20 khung trong MP4. Đây là kiểm từng cảnh minh họa, không phải xem từng khung trong toàn bộ 3.359 khung hình chuyển động. Hành động vẫn là minh họa đơn giản; động tác nắm tay và đồ vật nhỏ không phải mô phỏng tiếp xúc tay chi tiết.

Lượt xuất hoàn chỉnh này dùng **Tối giản mặt nạ**. **Chibi màu dân gian** được kiểm bằng bộ bố cục ảnh tĩnh cùng với gói Tối giản mặt nạ: 104 ảnh, chưa xuất thêm một truyện hoàn chỉnh riêng cho gói Chibi trong lượt này. Hai gói đã nhận 236 tệp tài nguyên bổ sung; xem [báo cáo kho](motion-fixed-library-2026-10-22.md).

Đã kiểm thời lượng, luồng hình/âm thanh và giải mã âm thanh. Chưa có bước nghe đánh giá chất giọng bằng tai, nên không dùng kết quả kỹ thuật để khẳng định giọng kể tự nhiên hoặc đạt nhịp kể của video mẫu.

## Kiểm tra đã chạy

```powershell
npx tsc --noEmit
npx tsx scripts/verify-motion-posture-continuity.ts
npx tsx scripts/verify-motion-set-requirements.ts
npx tsx scripts/verify-motion-depth-order.ts
npx tsx scripts/verify-motion-fixed-compositions.ts
npx tsx scripts/verify-motion-music-mix.ts
```

Bộ kiểm tư thế bao gồm giữ nằm/ngồi khi nói, đổi địa điểm/hồi tưởng, hành động đi/chạy và góc máy khi người nói nằm. Bộ kiểm bối cảnh bao gồm vách nền, vật treo tường, số chỗ tựa và phản hồi cho AI khi vẽ thiếu. Bộ kiểm lớp vẽ kiểm điểm ảnh của đồ đạc phía trước sàn và vật che. Test nhạc chạy FFmpeg thật với loudnorm và tự hạ nhạc khi có lời.

Các tệp `run.py`, `audit.py`, `review.py`, phản hồi AI và kết quả các bước được giữ trong `scratch/real-video-2min-20261022` để đối chiếu.
