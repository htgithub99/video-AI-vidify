# Bổ sung tài nguyên và cố định bố cục — 22/10/2026

Đã cài trực tiếp **236 tệp tài nguyên** vào `storage/output/motion-video/kit-library`, từ **34 mẫu thiết kế mới**, đủ cả `minimal_mask` (Tối giản mặt nạ) và `chibi_folk` (Chibi màu dân gian). Mỗi gói dùng nét, bảng màu, tỷ lệ người và cách vẽ thân sẵn có của chính gói đó.

[Xem 10 bảng ảnh kiểm tra](video-references/fixed-library-20261022/index.html). Mỗi bảng bối cảnh chứa 12 cảnh cùng lời minh họa, có bản ngày/đêm và lật ngang. Ảnh gốc vẫn nằm trong scratch để xem lớn; không nhân thêm hàng trăm ảnh lẻ vào docs.

## Nguồn đối chiếu và phạm vi

Lượt này đã xem 22 ảnh `overview.jpg` trong [kho tham khảo](video-references/khuatmatkytruyen/index.html), mỗi ảnh gồm 36 khung chọn mẫu; đã đối chiếu thêm hai bảng phong cách gốc và bảng placement-examples. Không khẳng định đã xem từng khung trong toàn bộ 14.050 ảnh lưu trữ hoặc nghe hết âm thanh của 22 video. Bổ sung là SVG nguyên bản học bố cục, không chép hình hoặc nội dung truyện.

Các nhóm cảnh được rút ra từ những bố cục lặp lại trong mẫu và tài nguyên hiện có:

| Nhóm bố cục | Nguồn tham khảo tiêu biểu | Tài nguyên bổ sung |
|---|---|---|
| Hai người ngồi nói chuyện; nhà sư tiếp khách | Ván bài phần 2, Thần trùng | Phòng trà, phòng tiếp khách nhà chùa có tượng Phật, hai ghế và bàn trà |
| Người bán đứng sau quầy; khách đứng trước | Cuốn sổ nợ | Cửa hàng tạp hóa, quầy che phần thân dưới người bán, mặt quầy đặt sổ |
| Thầy đứng cạnh bảng, học sinh ngồi sau bàn | Phí Phông | Lớp học, hai chỗ ngồi, lối đi giáo viên |
| Người nằm, người đứng đầu giường, người thăm ngồi ghế | Thần trùng, Con ranh, Ác giả ác báo | Phòng thăm bệnh có giường, ghế riêng, bàn thuốc và hai vị trí cạnh giường |
| Hai người nằm riêng trên chiếu | Én ơi | Phòng hai chiếu, gối và vị trí người quan sát |
| Thầy sau bàn lễ, đồ cúng ở mặt bàn | Thiên Linh Cái, Ma xó, Thần trùng | Phòng lễ, bàn đỏ có ba mặt đặt vật riêng |
| Người nằm trên phản, người thân hai bên | Quỷ nhập tràng | Phòng canh tang, phản, nến có hình và nguồn sáng tương ứng |
| Người ngoài chuồng, heo trong hàng rào, có máng ăn | Heo 5 móng | Sân chuồng heo có rào trước/sau, nền chuồng và máng |
| Người ngồi ghế dài, người khác đứng cạnh | Khăn Piêu, Én ơi | Hiên nhà sàn, ghế dài hai chỗ |
| Người nằm võng, đồng đội đứng cạnh, nồi ở bếp | Người con anh hùng | Trại rừng có võng và bếp riêng |
| Người thợ sau bàn, dụng cụ trên bàn | Nhóm cảnh đồ nghề trong Ác giả ác báo; mở rộng vai thợ mộc đã có | Xưởng mộc, bàn thợ, chồng ván, chỗ đặt đục/thước |

Bảng trên là quy tắc bố cục và nguồn gợi ý; không khẳng định từng tên tài nguyên mới xuất hiện nguyên dạng trong video nguồn.

## Những gì đã cài

| Loại | Mẫu mới | Tệp cài | Chi tiết |
|---|---:|---:|---|
| Bối cảnh hoàn chỉnh | 12 | 192 | 4 biến thể × ngày/đêm × 2 gói |
| Đạo cụ | 12 | 24 | Bát cơm, bát rỗng, đĩa cúng, chén trà, cốc nước, lọ thuốc, nhiệt kế, xe tải đồ chơi, kéo, điếu cày, hộp diêm, thước vuông |
| Nhân vật mẫu | 6 | 12 | Bác sĩ, chủ tạp hóa, nữ sinh, lính hải quân, nam và nữ chịu tang |
| Đồ đạc ghép cảnh | 4 | 8 | Ghế đơn, bộ hai ghế/bàn trà, bộ hai chiếu, bàn lễ |
| Tổng | **34** | **236** | Hai phong cách sẵn có |

Tên, mô tả và nhãn điểm đặt mới bằng tiếng Anh; từ khóa tìm kiếm giữ cả Việt và Anh. Hai người chịu tang là người sống, không thuộc nhóm ghost. Không cài lại toàn bộ staging; chỉ 236 ID được installer cho phép. Bản cài đầu đã ghi nhận 236 tài nguyên thêm mới; các lượt cài lại trong cùng lần sửa cập nhật chính 236 ID đó. Không thay 90 ảnh của hai gói mẫu gốc.

## Cách cố định theo câu kể

- Giữ nhân vật bằng ID gắn với vai trong truyện; bối cảnh chứa các điểm theo chức năng như `chair_left`, `bed`, `bed_head`, `behind_counter`. Không vẽ nhân vật cứng vào ảnh nền: cùng cảnh còn dùng được cho các vai khác.
- READ giữ trạng thái riêng của từng người. COMPOSE và layout gắn người vào đúng loại điểm: đứng, ngồi, nằm; giữ hướng nằm khi lật cảnh, độ cao mặt ghế và quyền sở hữu vật cầm.
- Sửa trường hợp `action: talk, support: chair`: tư thế thân là ngồi, vẫn giữ lời thoại/cử chỉ. Kiểm tra nhiều người ngồi cùng lúc phải có đủ điểm riêng; người yêu cầu ghế cụ thể được ưu tiên đúng ghế.
- Bộ chọn bối cảnh kiểm đủ loại và số chỗ tựa ngay khi lọc kho và chọn biến thể. AI nhận danh sách ID hợp lệ riêng cho từng nơi. Cảnh cache, cảnh ghép và cảnh vẽ thêm đều đi qua điều kiện này.
- Prompt dựng cảnh nhận tất cả tổ hợp trạng thái khác nhau tại nơi đó, thay vì chỉ dựa vào vài câu đầu. Nếu kho chưa đáp ứng, vẫn dùng đường ghép cảnh/vẽ cảnh đang có; không tự cho người nằm lên ghế hoặc đưa thuyền vào phòng để né lỗi.
- Sửa thứ tự lớp vẽ chung: người, đạo cụ chính, đạo cụ phụ và nhóm `data-occ` đi theo độ sâu. Tách nhóm che khỏi ảnh nền và ảnh foreground để không bị vẽ lặp. Heo phía trong rào, vật phía trước rào phải hiển thị khác nhau.
- Cache SVG dùng toàn bộ nội dung SVG làm khóa. Khóa cũ chỉ đọc mỗi ký tự thứ bảy nên có thể trả nhầm hình khi hai SVG cùng kích thước chỉ khác màu; kiểm tra điểm ảnh đã tái hiện được trường hợp đó.

Tư thế vẫn là hình minh họa đơn giản theo hệ puppet hiện có. Không thêm mô phỏng xương, nắm tay nhiều điểm hoặc hàng loạt hành động chi tiết.

## Nguồn và cách tái tạo

- `python_scripts/kit_seed/fixed_compositions.py`: nguồn SVG, danh mục, điểm đặt.
- `scenes.py`, `spots.py`, `refprops.py`, `chars.py`, `pieces.py`: đăng ký vào bộ seed hiện có.
- `src/constants/motionPuppetSeed.ts`: metadata cho bộ chọn tài nguyên và seed.
- `python_scripts/kit_seed/install_fixed_compositions.py`: chỉ cài ID mới thuộc hai phong cách; kiểm XML, metadata, điểm đặt, liên kết đêm và số lượng; sao lưu trước khi ghi đè; từ chối tài nguyên tùy chỉnh.
- `python_scripts/kit_seed/review_fixed_compositions.py`: gom ảnh render thành bảng JPEG và trang HTML.

Chạy ở thư mục dự án bằng Python có Pillow và Node có Playwright:

```powershell
python python_scripts/kit_seed/build_assets.py scratch/fixed-library-20261022/staging
python python_scripts/kit_seed/export_pieces.py scratch/fixed-library-20261022/pieces
python python_scripts/kit_seed/build_pieces.py scratch/fixed-library-20261022/pieces scratch/fixed-library-20261022/staging
python python_scripts/kit_seed/install_fixed_compositions.py scratch/fixed-library-20261022/staging storage/output/motion-video/kit-library scratch/fixed-library-20261022 --apply
npx tsx scripts/verify-motion-fixed-compositions.ts
python python_scripts/kit_seed/review_fixed_compositions.py
```

Sao lưu trước lượt sửa: `scratch/fixed-library-20261022/before`. Bản cài và SHA256 từng tài nguyên: `scratch/fixed-library-20261022/installed.json`. Mỗi lượt cài lại có thư mục backup riêng. Chưa commit hoặc triển khai; có sử dụng ứng dụng dev để kiểm tra video thật ở lượt tiếp theo.

## Kiểm chứng

Đã chạy thành công:

- `tsc --noEmit`.
- `verify-motion-fixed-compositions.ts`: kiểm hash 236 tệp, metadata bốn biến thể, liên kết ngày/đêm, cấp chỗ tựa riêng; dùng READ/COMPOSE/layout thật với phản hồi AI giả lập, cố ý trả tư thế sai rồi kiểm kết quả. Render 96 ảnh tình huống và 8 ảnh xem đủ mẫu người/đạo cụ, tổng **104 ảnh tĩnh**.
- `verify-motion-depth-order.ts`: kiểm màu điểm ảnh trên canvas thật cho vật chính/phụ trước và sau vật che, có và không có người. Đồng thời phát hiện cache SVG trả nhầm màu.
- `verify-motion-blocking.ts`: 10 tình huống trước đó × 2 phong cách × bật/tắt chuyển động = 40 ảnh.
- `npm run test:motion-asset-catalog`, `npm run test:motion-speech`, `npm run test:motion-scene-ai`.

Kết quả và lời minh họa từng ảnh: `scratch/fixed-library-20261022/verification/report.json`. Có kiểm bằng mắt các bảng ảnh, ngoài kiểm dữ liệu và báo lỗi renderer.

Đã chạy thêm một truyện mới qua AI bên ngoài, TTS và xuất MP4 khoảng 112 giây bằng gói Tối giản mặt nạ, đồng thời rà đủ 20 cảnh với lời kể. Lượt chạy phát hiện thêm lỗi tư thế liên tục, yêu cầu điểm đặt cho vách nền, sàn che đồ đạc, góc máy che người nằm và nhạc nền; các lỗi đã được đối ứng trong code. Bản thử có bước chỉnh dữ liệu sau rà ảnh, nên chưa thể khẳng định mọi câu kể tùy ý sẽ luôn được AI hiểu và chọn đúng ngay lần đầu. Xem [báo cáo video thật và bằng chứng](motion-real-video-2026-10-22.md). Gói Chibi mới được kiểm qua ảnh tĩnh, chưa chạy thêm một truyện hoàn chỉnh riêng.
