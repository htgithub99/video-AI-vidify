# Nguyên nhân dừng lượt 20 phút — 25/10/2026

Lượt cảnh `11fa29a2-b030-4a33-a6ba-ad6bcca02f28` dừng lúc 12:36:12 ở bước lập nhịp hình. Chưa đến chọn/ghép tài nguyên đầy đủ hoặc render MP4. Không có bằng chứng từ lượt này để quy lỗi cho thiếu kho, tọa độ nhân vật hoặc FFmpeg.

## Chuỗi đã xác nhận

1. `planPuppetStoryboard` chèn toàn bộ danh mục ngữ nghĩa của gói vào từng nhóm nguồn, kể cả nhóm chỉ có một câu. Dựng lại yêu cầu đầu còn thiếu bằng dữ liệu đã lưu và chính hàm hiện tại thu được 54.918 ký tự; danh mục chiếm 49.408 ký tự, khoảng 89,97%. Câu nguồn của nhóm: “Bốn mùa luân chuyển, ngọn gió heo may cuối năm lại thổi xao xác qua mái tranh nghèo.”
2. Bộ gửi chia yêu cầu vượt 24.000 ký tự thành các phần 18.000 ký tự. Yêu cầu trên cần bốn tin ngữ cảnh và một tin thực hiện. Đây là số tin cần thiết nếu lần gửi thành công; không nói rằng lượt lỗi đã gửi đủ năm tin. Trong chín bản chụp lỗi cuối của các yêu cầu, tám bản còn đang ở phần ngữ cảnh đầu và cả chín đều có thông báo 1095.
3. Log chi tiết trong khoảng 12:26:40–12:36:15 có 26 sự kiện `chat_request_failed` của bước này, tất cả mang `GeminiChatRequestRejected:8:1095`. Dữ liệu StreamGenerate đã lưu có HTTP 200 với khung lỗi, không có dữ liệu trả lời. Lỗi xảy ra trước khi có kế hoạch hình hợp lệ để kiểm.
4. Nhánh phục hồi coi lỗi trên là lỗi nhà cung cấp có thể thử lại: hai reload rồi một room mới. Sau khi hết chu kỳ, `planPuppetStoryboard` lại bắt lỗi và bắt đầu chu kỳ khác, tối đa ba lượt. Ba worker không có cơ chế dùng chung để tạm nghỉ sau khi cùng gặp một loại từ chối; semaphore giới hạn số việc đồng thời, không điều tiết nhịp gửi theo tình trạng dịch vụ.
5. Cuối cùng lỗi gốc bị thay bằng `S.INVALID`: “Kế hoạch hình chưa phủ đúng lời kể hoặc có mốc đổi hình không hợp lệ.” Đây là lỗi phân loại/giữ nguyên nhân trong code, không phải bằng chứng JSON đã trả sai mốc.

## Kiểm đối chứng và giới hạn kết luận

Kiểm bằng một phòng riêng trên đúng hồ sơ Chrome của tool. Yêu cầu thử chỉ 125 ký tự nhưng chưa gửi được: Google chuyển ngay sang `google.com/sorry`, hiển thị reCAPTCHA và thông báo phát hiện lưu lượng truy cập bất thường từ mạng máy tính. Ảnh và URL được lưu tại `scratch/thantrung-voice-20261025/audit-gemini-small.jpg` và `audit-gemini-small.json`. Thử nghiệm này xác nhận tình trạng chặn truy cập tại 12:53; không phải thử nghiệm gửi ngắn thành công/thất bại với mã 1095.

Không có tài liệu giải nghĩa 1095 trong bằng chứng hiện có. Không kết luận mọi 1095 đều là CAPTCHA, cũng không chứng minh chỉ riêng tool gây chặn mạng. Vì CAPTCHA chặn trước gửi, chưa hoàn tất đối chứng cùng thời điểm giữa prompt ngắn, prompt dài trung tính và phần ngữ cảnh thật. Dừng thử gửi thêm, không vượt trang xác minh.

## Hướng sửa đúng phạm vi nguyên nhân

- Lập nhịp hình dùng khả năng minh họa có liên quan đến nhóm nguồn, không gửi lại toàn bộ mô tả kho cho từng câu. Bước chọn tài nguyên vẫn phải kiểm ID và ràng buộc bằng kho đầy đủ tại máy. Ngữ cảnh dùng chung có phiên bản được nạp một lần cho mỗi room, chỉ cập nhật khi cần.
- Một tầng sở hữu giới hạn phục hồi lỗi dịch vụ. Tầng kiểm kế hoạch chỉ sửa khi đã nhận dữ liệu kế hoạch nhưng dữ liệu không đạt; không dùng yêu cầu “sửa mốc hình” để phục hồi lỗi dịch vụ.
- Khi nhiều worker cùng bị từ chối, dùng nhịp chờ chung theo nhà cung cấp; giữ tính độc lập của các room khi đang hoạt động bình thường. Khóa Gemini phải tiếp tục có hiệu lực.
- Giữ nguyên lỗi gốc, giai đoạn con, số phần đã nhận và tiến độ nhóm đã lưu. Chỉ phát lỗi “kế hoạch sai mốc” khi bộ kiểm thật sự nhận và từ chối một kế hoạch.
- Sau khi truy cập Gemini được xác minh, kiểm lần lượt yêu cầu ngắn, ngữ cảnh có kích thước tương đương và yêu cầu thật, rồi mới tiếp tục nhóm thiếu. Không viết lại phần đã chấp nhận.

Lượt kiểm tra này không sửa code sản phẩm, không khởi động lại backend và không hủy lượt tạo giọng đang chạy. Bằng chứng số lượng tại `scratch/thantrung-voice-20261025/audit-root-metrics.json`.
