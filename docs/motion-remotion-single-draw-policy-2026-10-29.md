# Dựng cảnh Remotion bằng một yêu cầu

## Luồng đang áp dụng

- AI hỗ trợ nội dung đọc và chia phân cảnh; AI dựng video minh họa chỉ vẽ cảnh.
- Mỗi cảnh mới gửi một yêu cầu chứa lời kể, chủ thể, phong cách, cấu hình chuyển động và tham chiếu chung. AI trả cùng lúc `design`, `svg`, `layers`, `animations`, `continuityNotes`.
- Toàn bộ yêu cầu dựng cảnh được gửi trong một tin chat, kể cả khi dài hơn ngưỡng chia ngữ cảnh mặc định. Không có các tin nạp từng phần rồi tin yêu cầu thực thi. Chính sách này chỉ áp dụng cho artifact dựng cảnh; các tác vụ nội dung khác giữ cơ chế chia ngữ cảnh hiện có.
- Giữ nguyên prompt dựng cảnh, luật tạo hình và mẫu tham chiếu của cả ba kiểu hình Truyện ma, Lịch sử và Giải thích. Wrapper gửi tin thống nhất với JSON trong code block và SVG dạng văn bản theo prompt hiện tại.
- Đã bỏ yêu cầu AI thiết kế không gian riêng trước khi vẽ SVG.
- Cảnh đầu của địa điểm là tham chiếu chung; các cảnh còn lại dùng tham chiếu đó và chạy qua nhóm worker có giới hạn. Cảnh tham chiếu hỏng không chặn các cảnh sau.

## AI duyệt ảnh cảnh

**Tắt:** nhận một phản hồi vẽ; không gửi yêu cầu sửa JSON/SVG, bổ sung chuyển động, đổi model hay duyệt ảnh. Giữ nguyên hình render được; metadata thiết kế/chuyển động không dùng được được bỏ qua tại máy. Không áp QA hình học hay bắt đủ chuyển động để dừng cảnh. Cấu hình chuyển động vẫn được gửi trong yêu cầu đầu và áp dụng khi phát.

**Bật:** vẫn vẽ thiết kế và SVG cùng một yêu cầu đầu; giữ bước duyệt ảnh qua AI hỗ trợ nội dung, chỉ yêu cầu sửa khi có lỗi nội dung chính được xác nhận bằng bằng chứng nhìn thấy. Tối đa ba vòng duyệt và tổng sáu lần gọi qua contract cho phần vẽ/duyệt/sửa trong một lượt xử lý cảnh. Metadata, nhóm hình thiếu ID, chẩn đoán hình học hoặc chuyển động phụ không tự phát sinh yêu cầu vẽ bổ sung. Chuyển động thở nhẹ có thể được bổ sung tại máy theo cấu hình.

Nếu dịch vụ review không phản hồi hợp lệ, giữ hình render được ở trạng thái chưa được AI xác nhận (`build.review=false`), ghi cảnh báo và tiếp tục. Không đánh dấu đã duyệt khi chưa có kết quả phù hợp với phiên bản hình hiện tại. CAPTCHA và hủy tác vụ vẫn giữ cơ chế chờ/dừng hiện có.

## Cảnh hỏng

- Lưu trạng thái và nguyên nhân ở `scene.build`, hiển thị tại đúng thẻ cảnh; không đánh lỗi toàn nhóm lời kể.
- Hết lượt sửa hoặc vẽ không được vẫn tiếp tục các cảnh khác. Cảnh chưa render được dùng khung ghi rõ “Cảnh chưa dựng được · Cần tạo lại”, giữ lời kể và thời lượng của cảnh đó. Nếu có hình cũ render được và đúng tỷ lệ thì giữ hình đó, kèm cảnh báo.
- Không render SVG có script, liên kết/tài nguyên ngoài hoặc XML không dùng được.
- Tiếp tục cùng lượt dựng không tự thử lại cảnh đã thất bại. Nút **Tạo lại cảnh này** gửi ID của đúng cảnh và chủ động gọi lại AI; các cảnh khác, kịch bản và giọng giữ nguyên.
- Hủy tác vụ và chờ CAPTCHA vẫn giữ luồng hiện có. Lỗi phân cảnh nội dung hoặc đầu vào không đủ timeline vẫn được báo riêng; thay đổi này xử lý lỗi ở bước vẽ/duyệt cảnh.
- Chế độ dùng kho tài nguyên giữ luồng hiện có.

## QA và dọn prompt

- Prompt sửa nhận context có cấu trúc và draft hiện tại, bỏ SVG tham chiếu/acceptedScene trùng. Không ghép lại toàn bộ prompt vẽ mới khi sửa.
- Phân cảnh dùng ID ổn định từ nhân vật/địa điểm được cung cấp; không yêu cầu catalog tài nguyên không tồn tại. Phân biệt chủ thể nhìn thấy, manh mối bắt buộc và đồ vật chỉ được nhắc trong lời kể.
- Đã bỏ các prompt vẽ asset, sửa anchor và luật ghép asset cũ không còn caller. Giữ bộ đọc dữ liệu và renderer tương thích các cảnh cũ.
- Remotion dùng thời lượng audio thực hợp lệ để tiếp tục timeline; chênh lệch mục tiêu được cảnh báo, không tự viết lại truyện/tạo lại giọng chỉ để khớp thời lượng. Kiểm audio rỗng/hỏng, chữ bị mất, timeline và SVG không an toàn vẫn là bắt buộc. Chế độ kho giữ chính sách thời lượng đang có.

## Kiểm chứng

Chạy `npm run test:motion-single-draw`: AI giả lập, không gọi dịch vụ thật và không tạo video. Kiểm tra số yêu cầu, lỗi từng cảnh, mất SVG/metadata, SVG không an toàn, tham chiếu và chạy đồng thời, giữ timeline khi có cảnh hỏng, tiếp tục không gọi lại AI, tạo lại riêng một cảnh và bật duyệt ảnh.
