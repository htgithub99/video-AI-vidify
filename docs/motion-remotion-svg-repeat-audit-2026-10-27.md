# Đối chiếu lỗi SVG lặp lại ngày 27/10/2026

## Phạm vi và bằng chứng

Đọc code hiện tại, log lượt dựng bắt đầu 11:13:24, các file debug đã lưu và tiến trình lắng nghe cổng 3002. Thời gian trình bày theo Asia/Saigon. Không gửi yêu cầu AI, không tiếp tục hoặc tạo video mới.

Request `90221a1fd598e4de724029b7283ae5cadbd741cd1468c28978db719d6f7fc94d` có hai file trong `storage/output/motion-video/ai-debug/`, hậu tố `-1.json` và `-2.json`:

| Thuộc tính | Lần 1 | Lần 2 |
| --- | --- | --- |
| Thời gian | 11:16:35 | 11:17:16 |
| AI | gemini-chat | gemini-chat |
| Model | gemini-flash::low | gemini-flash::low |
| Độ dài chuỗi SVG | 10.511 ký tự | 10.511 ký tự |
| Hình cơ bản | 87 | 87 |
| Thẻ mở g | 7 | 7 |
| Thẻ mở gradient | 10 | 10 |
| Thẻ đóng bất kỳ | 0 | 0 |

Hai chuỗi `response.svg` giống hệt nhau theo so sánh phân biệt hoa thường. Toàn bộ response không hoàn toàn giống nhau. JSON có đủ artifactType, requestId, svg và anchors, nhưng chuỗi SVG không có `</svg>`, `</g>` hay thẻ đóng gradient.

Tổng cộng 17 file debug của 9 request vẽ SVG Gemini từ lúc bắt đầu lượt này đều có 0 thẻ đóng. Đây là tập phản hồi bị từ chối đã lưu, không phải thống kê toàn bộ phản hồi thành công/thất bại của dịch vụ Gemini.

## Vì sao chuyển DeepSeek và vì sao cứ lặp

1. Bộ kiểm XML gặp cây thẻ không hoàn chỉnh. SVG có nhiều hình cơ bản vẫn có thể không render đúng vì gradients/groups bị lồng sai; không thể nhận ảnh chỉ dựa vào số hình.
2. Contract cho từng tài nguyên thử sửa nội dung theo ngân sách. Lần sửa của request trên vẫn có đúng cùng SVG hỏng, nên chuyển tuyến AI theo cấu hình. Đây là phục hồi dữ liệu, không phải kết luận dịch vụ Gemini mất kết nối.
3. Backend vẫn là PID 82144, khởi động 10:49:13 với `node --import tsx server.ts`, không chạy chế độ watch. File bộ đọc và kiểm SVG được sửa lúc 11:00:14; chỉ dẫn escape SVG được sửa lúc 11:03:08. Tiến trình hiện tại chưa nạp các sửa này. Tải lại web chỉ nạp giao diện.
4. Đường cũ đọc Gemini bằng innerText và yêu cầu JSON văn bản. Chuỗi SVG có nguy cơ bị Markdown/HTML xử lý. Việc tất cả thẻ đóng đồng loạt mất trên nhiều phản hồi là dấu hiệu đáng nghi của cùng một lỗi truyền/đọc; chưa đủ chứng cứ để xác định AI tạo thiếu thẻ hay DOM chat làm mất chúng. Room của lượt đã dừng không còn được dùng để đối chiếu nguồn ban đầu.

## Bản sửa đã có trên đĩa và giới hạn kiểm chứng

- Chỉ dẫn vector yêu cầu encode mọi ký tự `<` trong chuỗi JSON thành literal `\u003c`, gồm cả thẻ đóng; JSON.parse phục hồi ký tự gốc.
- Tác vụ vector ưu tiên textContent của code block khi có.
- Lỗi XML mới liệt kê thẻ còn mở hoặc thẻ đóng không khớp. Log từ chối lưu đầy đủ trước log đổi tuyến AI.
- Có revision checkpoint để mở lại một ngân sách sửa cho dữ liệu từng thất bại, giữ phần đã đạt.

Cần khởi động lại backend để các sửa này có hiệu lực. Hệ thống phê duyệt tự động đã chặn thao tác restart ở lượt trước kể cả sau khi người dùng cho phép. Lượt kiểm này không thử lách chặn. Chưa xác nhận hết lỗi bằng AI thật sau khi nạp code mới.

Sau khi nạp code mới, đối chiếu phản hồi tiếp theo: ký tự escape có đến đúng prompt hay không, nguồn code textContent có giữ đủ thẻ đóng không, và lỗi mới cụ thể ở thẻ/thuộc tính nào. Nếu còn mất thẻ, cần giữ cả nguồn code và văn bản hiển thị để xác định chính xác tầng gây mất, thay vì tăng retry hoặc bỏ kiểm XML.

## Giao diện

- Phân trang Remotion không nhận disabled theo busy. Trang cuối trước đây khóa riêng nút Trang sau vì không còn trang; nay ẩn nút không còn đích đến, giữ các số trang và hướng chuyển hợp lệ sử dụng được.
- Hai dòng trạng thái/lý do được căn sát dưới vùng ảnh, ngay trên lời kể; chữ dài vẫn rút gọn và có title để đọc đầy đủ.
- Các nơi dùng Pagination khác giữ hành vi mặc định.

## Lớp đồ vật có nền trắng/ngà

Lượt `86dce294-7b93-47d5-aaf4-8af32d1541e9`, cảnh `c1_event_d33afd9f94c6:0`: SVG cột có hình chữ nhật phủ kín 400×900 màu `#F5EEDD`; SVG lư hương có nền gradient phủ kín 900×700 kèm tường và sân gạch. Nhân vật không có nền này. Thành phần Img của Remotion không tự thêm nền trắng.

Nguyên nhân: prompt dùng chung chỉ dẫn cho bối cảnh và chủ thể, ngữ cảnh đồ vật/nhân vật chưa truyền rõ kind; kiểm XML và anchors chưa kiểm độ trong suốt. Cache tiếp tục giữ các SVG hợp lệ về cú pháp nhưng sai loại lớp.

Bản sửa ngày 27/10:

- Truyền kind ở mọi yêu cầu vẽ và tách chỉ dẫn background/character/prop. Chủ thể có khoảng trong suốt quanh mép; bối cảnh được phủ kín khung. Màu trắng trong áo/đồ vật vẫn giữ nguyên.
- Kiểm hình chữ nhật nền trực tiếp và kiểm kênh alpha của SVG raster 64×64. Chỉ loại lớp chủ thể rỗng hoặc gần như đặc kín toàn khung (tỷ lệ alpha cao ít nhất 98,5%, bốn góc ít nhất 95%); không chấm chi tiết nghệ thuật hay tư thế. SVG dùng gradient/path cũng được kiểm.
- Không nhận SVG sai nền làm candidate cho sửa anchors. Trước khi dựng tiếp, chuyển lớp cache lỗi sang invalidAssets giữ nguyên bản gốc và lý do, hủy review tương ứng rồi dựng lại lớp thiếu. Không tự tiếp tục lượt đã dừng.
- Kiểm trước preview với nền chữ nhật rõ ràng và trước xuất ảnh/video bằng kiểm alpha, kể cả dữ liệu cache cũ. Nhánh dùng kho không đi qua bộ kiểm này.
- Revision phục hồi mới giữ phần đã đạt và mở lại ngân sách sửa của request từng lỗi khi cần.

Kiểm chứng offline: `npm run test:motion-remotion`, `npm run test:motion-response-contracts`. Bộ hồi quy dùng chính hai SVG lỗi, kiểm thêm gradient/path phủ nền, áo/bát trắng trên nền trong suốt, defs/clip/opacity, sửa đúng một lớp cache và giữ các lớp còn lại. Không gọi AI/TTS thật và không tạo video thử. Đây chưa phải xác nhận kết quả vẽ mới từ AI thật.

Đã khởi động lại backend theo yêu cầu mới của người dùng lúc 11:36:46 ngày 27/10: PID 82144 → 40112, `node --import tsx server.ts`. Tiến trình mới lắng nghe cổng 3002 và GET `/` trả HTTP 200. TypeScript `tsc --noEmit` và `git diff --check` đều đạt. Lượt video vẫn cancelled, không tự resume. Log khởi động còn cảnh báo kết nối trình duyệt sinh ảnh hỗ trợ chưa sẵn sàng; việc khởi động HTTP thành công không xác nhận kết nối đó hoặc một lượt AI thật thành công.
