# Motion: tối đa 5 room AI, gồm 3 dựng cảnh và 2 nội dung

## Phạm vi

Áp dụng chung cho Remotion và luồng Kho khi có yêu cầu AI. Giữ cấu trúc prompt dựng cảnh của ba kiểu hình, model đã chọn, chính sách dự phòng và cấu hình AI duyệt ảnh. Kho chỉ ghép tài nguyên có sẵn không phát sinh yêu cầu AI vẽ để lấp đầy tab.

## Nguyên nhân cũ

- Nội dung chính có một worker, nội dung phụ có hai worker, dựng cảnh có ba worker. Tổng bình thường là sáu room.
- Ba room mở sẵn chưa được ghi nhận trong danh sách room của phiên. Khi AI chính bị tạm khóa và yêu cầu chuyển thẳng sang dự phòng, tab mở sẵn có thể còn nguyên. Mô phỏng trước sửa tái hiện chín room.
- Các phiên biên tập giữ tab khi nhàn rỗi; giới hạn từng phiên không giới hạn được tổng room của Motion.
- Xác minh CAPTCHA mở project riêng, có thể phát sinh thêm tab ngoài các worker.

## Chính sách hiện tại

| Nhóm | Worker | Giới hạn |
| --- | --- | --- |
| Dựng cảnh | `motion-scene-first`, `motion-scene-second`, `motion-scene-third` | 3 |
| Hỗ trợ nội dung | `motion-primary`, `motion-second` | 2 dùng chung |

- Nội dung chính, tác vụ phụ, SEO, phân cảnh, phân vai, chỉ đạo âm thanh và duyệt ảnh dùng chung hai slot nội dung. Hết slot thì xếp hàng; không chiếm slot vẽ.
- Chuẩn bị dựng cảnh mở đồng thời ba room của AI được chọn, không gửi prompt chỉ để mở room. Lời gọi chuẩn bị trùng nhau dùng chung Promise.
- Bộ quản lý room vật lý dùng chung toàn backend Motion giữ tối đa ba room vẽ và hai room nội dung, kể cả khi nhiều phiên còn giữ tab.
- Request dùng lại room đúng project/worker/provider. Khi cần thay AI hoặc tái sử dụng slot của phiên khác, phải đóng room cũ xong mới được mở room mới.
- Không thu hồi room đang chạy. Khi mọi slot của nhóm đều bận, tác vụ tiếp theo chờ. Room nhàn rỗi được ưu tiên thu hồi theo lần sử dụng gần nhất.
- Đóng tab thất bại phải giữ bản ghi tab; không coi slot đã trống rồi mở thêm tab. Lỗi điều hướng kèm lỗi đóng tab cũng giữ bản ghi để thu hồi lại.
- Ngữ cảnh đã gửi được theo dõi riêng với quyền sở hữu room mở sẵn. Sau thu hồi hoặc thay thế, request kế tiếp khôi phục ngữ cảnh đã chốt theo chính sách hiện hành. Artifact tự chứa dữ liệu vẫn giữ chính sách không gửi thêm ngữ cảnh.
- CAPTCHA dùng chính project/worker đang giữ slot. Nếu cần đổi từ Chrome ẩn sang hiện, đóng room cũ trước rồi chuẩn bị lại cùng định danh; không tạo project CAPTCHA riêng.
- Hủy khi chuẩn bị phải chờ thao tác mở room kết thúc và dọn room xuất hiện muộn trước khi giải phóng slot. Promise chuẩn bị lỗi được xóa để tiếp tục được.
- Reload/thay room phục hồi nằm trong thời gian giữ slot; không truy cập room cũ sau khi slot đã giao cho tác vụ khác.

Giới hạn là số room AI của Motion, không bao gồm tab do người dùng mở hoặc browser xuất video. Ba room mở sẵn không có nghĩa luôn có ba request đang vẽ: cảnh phụ thuộc cảnh mẫu phải chờ dữ liệu; nhà cung cấp có thể xử lý tuần tự ở các thao tác riêng. Giới hạn nội dung thấp hơn của nhà cung cấp, như Claude, vẫn được giữ.

## Kiểm chứng

`scripts/verify-motion-room-budget.ts` dùng service Motion thật với transport giả lập, bộ đếm room vật lý và storage tạm:

- Khác AI và cùng AI: tối đa năm request, ba vẽ và hai nội dung. Yêu cầu nội dung thứ ba chờ slot.
- Mở sẵn AI đã bị tạm khóa rồi chuyển dự phòng: không còn phát sinh chín room; tổng room vật lý không vượt năm.
- Hai phiên giữ tab chia sẻ cùng ngân sách; tab nhàn rỗi được thu hồi, ngữ cảnh được khôi phục khi quay lại.
- CAPTCHA khi các room còn lại hoạt động không mở project xác minh riêng.
- Đóng tab lỗi không cấp thêm slot; một worker không được cấp hai lần khi đang thay provider.
- Hủy yêu cầu xếp hàng và hủy chuẩn bị khi mở tab trả kết quả muộn không rò room.

`scripts/verify-motion-scene-fallback.ts` giữ kiểm chứng Gemini, ChatGPT, DeepSeek, Claude; ba room mở đồng thời không gửi prompt; pipeline Remotion với bốn cảnh và checkpoint, dự phòng bật/tắt, hủy và tiếp tục.

`scripts/verify-motion-ai-recovery.ts` kiểm chứng phục hồi model/ảnh tham chiếu, phản hồi muộn, hủy, lưu SVG, truyền lỗi và phiên nội dung. Fixture phân biệt pool vẽ ba worker và nội dung hai worker; kiểm tra khôi phục ngữ cảnh dùng artifact cần ngữ cảnh.

`scripts/verify-chat-room-lifecycle.ts` kiểm chứng thao tác trên Chrome cục bộ, gồm đóng room bắt buộc thành công và giữ bản ghi khi đóng tab thất bại.

Không gửi yêu cầu AI thật và không tạo video trong lượt sửa này.

## Trạng thái kiểm tra bản sửa

TypeScript, ESLint các file nguồn sửa, audit nguồn (0 comment, 0 literal ngoài constants), feature boundaries, bundle backend, kiểm thử ngân sách room, phục hồi AI, dự phòng cảnh, single-draw, phiên biên tập, vòng đời room Chrome và bố cục nút đều đạt.

Suite test:motion-scene-ai còn dừng ở verify-motion-scene-ai-settings.ts:111 vì fixture không mô phỏng hai request /api/motion-video/story/compile để tạo xem trước. Chạy cùng fixture với toàn bộ constants đã sửa lấy từ HEAD trước thay đổi vẫn tái hiện đúng lỗi này. Test giao diện đó không nạp các service server sửa trong lượt này; các kiểm thử server phía sau đã chạy riêng và đạt. Không sửa luồng xem trước để né fixture.
