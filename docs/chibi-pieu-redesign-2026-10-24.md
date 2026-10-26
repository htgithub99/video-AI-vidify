# Chibi theo ảnh Khăn Piêu — 24/10/2026

## Sửa thân dưới sau khi đối chiếu lại ảnh người dùng — phiên bản 3

Phiên bản 2 bên dưới còn sai ở hình dáng chân: đường bao quần khoét lên giữa hai ống và hai ellipse vẽ bàn chân riêng; các sprite ngồi/quỳ/ngồi xổm còn có phần chân chìa ra hoặc khe giữa chân. Ảnh người dùng gửi thể hiện thân dưới khép gọn thành một khối, không có hai bàn chân tách rời.

Phiên bản 3 sửa tại bộ tạo SVG dùng chung: quần có đường bao kín, váy/áo dài không còn hai bàn chân bên dưới; ngồi/quỳ/ngồi xổm giữ phần thân dưới liền khối và gọn dưới thân. Nằm dùng chính bộ thân mới được engine xoay. Không đổi tỷ lệ, rig, điểm neo hoặc code bố cục. Cập nhật mô tả phong cách tiếng Anh để tránh lần tạo kho sau quay về dáng chân cũ.

Đã cài 59 nhân vật và một style, giữ ID và tên; 2.116 bản ghi khác không đổi nguyên byte. Phiên bản `chibiDesignVersion: 3`. Bản sao và manifest mới ở `scratch/chibi-pieu-closed-legs-20261024`, tách khỏi bản sao phiên bản 2. Snapshot đã lưu của dự án cũ cần dựng lại để nhận bộ hình mới.

Đã dựng 146 ảnh bằng engine thật, không có lỗi engine được trả về; xem sáu bảng nhân vật đủ 59 mẫu và bảng cảnh, cùng các ảnh tư thế nam/nữ đại diện. Đạt `verify_chibi_pieu.py --installed` và Python compile cho bộ tạo hình. Không dùng kết quả hồi quy phiên bản 2 để khẳng định đã chạy lại mọi kiểm thử ở phiên bản 3.

[Xem bộ ảnh mới](../scratch/chibi-pieu-closed-legs-20261024/index.html) · [Đối chiếu thân dưới trước/sau](../scratch/chibi-pieu-closed-legs-20261024/boards/lower-body-comparison.jpg).

## Lịch sử thiết kế phiên bản 2

Đã đối chiếu ảnh người dùng gửi với các bảng cảnh đã trích từ “Chiếc khăn Piêu – Bùa Yêu Kỳ Truyện”, nhất là cảnh hội, đưa khăn, giơ tay, ngồi, nằm và chải tóc. Đây là thiết kế minh họa tĩnh theo đặc trưng hình dáng của mẫu; không phải bản sao từng nhân vật trong video.

## Thay đổi trong kho

- Cập nhật đúng 59 nhân vật và 1 gói kiểu vẽ Chibi đang có, giữ ID, tên và các liên kết tài nguyên. Không thêm bản nhân vật trùng ID hay thay đổi bối cảnh/đồ vật.
- Đầu chiếm khoảng nửa chiều cao đứng, tóc có khối, nét mặt có mũi và lông mày; mắt vui và mắt nhắm dùng nét cong. Thân gọn, áo ngắn, quần/váy tối, bàn tay và chân nhỏ. Các nhân vật vùng cao có hoa văn dệt, thắt lưng và chi tiết cổ áo.
- Nhân vật `festival_woman` có tóc dài, hoa cài, áo hồng, khóa bạc và thắt lưng vàng theo ảnh người dùng. Mô tả tiếng Anh cũng được sửa cho khớp hình.
- Đứng, quay trái/phải/lưng dùng cùng bộ hình. Ngồi, quỳ và ngồi xổm dùng phần thân/chân riêng, không chứa đầu hay mặt vẽ sẵn. Engine ghép đầu, mặt và tay đúng một lần. Nằm tiếp tục xoay toàn bộ hình để giữ đầu gắn với thân.
- Giơ tay và che mặt có cấu hình Chibi riêng; tay che mặt nằm trên khuôn mặt. Khi tắt chuyển động nhân vật, vẫy tay và cử động tay nói chuyện cũng đứng yên.

## Nguồn dùng chung

`src/constants/motionChibi.json` là nguồn tỷ lệ và thông số khuôn mặt dùng chung cho preset TypeScript và bộ tạo SVG Python. `chibi_design.py` lưu hình học/trang phục; `chibi_art.py` tạo hình; `migrate_chibi_pieu.py` cập nhật kho có bản sao và kiểm SHA-256 trước khi ghi. Chuẩn hóa style giữ lại cấu hình mũi; tạo lại kho bằng `build_assets.py` cũng dùng bộ hình mới.

Phiên bản `chibiDesignVersion: 2`. Bản sao trước/sau và manifest nằm tại `scratch/chibi-pieu-20261024`. Migration giữ 2.116 bản ghi ngoài phạm vi thay đổi nguyên byte. Kho Tối giản mặt nạ được giữ nguyên. Những dự án đã giữ snapshot cũ tiếp tục giữ bộ hình cũ cho đến khi người dùng dựng lại; không sửa ngầm video đã hoàn tất.

## Kiểm tra

- Dựng 146 ảnh bằng engine thật: 59 nhân vật × trước/sau ở bốn tư thế, 6 nhân vật đại diện × 18 hành động và 4 góc quay, cùng 4 cảnh kiểm bố cục. Không có lỗi engine được trả về.
- Gộp thành 13 bảng JPG, có ảnh trước/sau và nhãn tư thế. Đã xem trực tiếp các bảng đại diện cùng các cảnh bàn ăn, đầu giường, hai người nằm và chải tóc. Việc dựng được ảnh không có nghĩa mọi câu truyện đã được kiểm nội dung.
- `verify_chibi_pieu.py --installed`: đạt kiểm SVG, liên kết/ID, cấu trúc tư thế, tỷ lệ, SHA-256 bản cài và 2.116 bản ghi ngoài phạm vi.
- `tsc --noEmit`: đạt.
- Kiểm hồi quy luồng dựng: đạt cả hai gói, gồm tiếp tục dự án không gọi AI lại, bật/tắt duyệt ảnh và sửa bố cục trước khi tạo giọng. AI được mô phỏng trong kiểm thử này.
- Kiểm kho đóng sau khi đổi tỷ lệ: 854 kiểm tra, 82 ảnh, không gọi AI; đạt.
- Hai script cũ `verify-motion-characters.ts` và `verify-motion-render-controls.ts` không chạy được do đang tham chiếu module/export của engine cũ (`motionGenService.ts`, `MOTION_ASSET_BASE`). Không dùng kết quả của hai script này để tuyên bố kiểm đạt.

Ảnh và trang xem: `scratch/chibi-pieu-20261024/index.html`; kết quả máy: `verification.json`, `render-review.json` trong cùng thư mục.

Lượt thử AI trước đó `bae30978-409c-473d-b09b-0f5c94783d87` vẫn bị Google giữ ở CAPTCHA và đã được hủy riêng trước khi thay kho. Chưa có MP4 hoàn tất từ lượt đó; các ảnh kiểm trên không cần gọi AI và không phải một lượt xuất video mới.
