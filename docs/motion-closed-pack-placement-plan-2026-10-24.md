# Kế hoạch kho đóng theo gói và bố cục cố định

Hướng cập nhật theo yêu cầu người dùng: [kế hoạch sửa toàn bộ kho cũ và dựng bằng hình minh họa](motion-illustrated-library-plan-2026-10-24.md). Bản mới ưu tiên tư thế tĩnh, bố cục đơn giản như Chiếc khăn Piêu và cấu hình bật/tắt review ảnh; thay thế các đề xuất mở rộng chuyển động/tương tác không cần thiết bên dưới. Tài liệu này giữ lại bối cảnh thiết kế và lịch sử triển khai.

Ngày: 24/10/2026. Trạng thái: đã triển khai kho đóng, bổ sung kho lõi và kiểm bố cục cho hai gói; chưa hoàn tất kiểm toàn bộ cảnh/thoại của 22 nguồn và toàn bộ biến thể trong ma trận. Chi tiết thực tế, kiểm thử và giới hạn: [báo cáo triển khai](motion-closed-pack-placement-implementation-2026-10-24.md). Các phần đề xuất bên dưới giữ vai trò mục tiêu; không phải mọi mục đều đã hoàn thành.

## 1. Mục tiêu và nguyên tắc bắt buộc

- Video chọn gói nào thì chỉ sử dụng tài nguyên, tư thế, trạng thái và mẫu bố cục đã duyệt của gói đó. Hai gói đầu tiên là `minimal_mask` — Tối giản mặt nạ và `chibi_folk` — Chibi màu dân gian.
- Bổ sung tài nguyên ở quy trình xây kho riêng. Khi tạo, sửa hình, tiếp tục hoặc render video: không gọi AI vẽ nhân vật, sprite, đồ vật, mảnh cảnh hoặc cả cảnh; không tự sinh biến thể rồi ghi vào kho; không trộn phong cách.
- Được ghép các thành phần có sẵn thành cảnh của dự án và dựng hình bằng engine. Đây là lắp ráp tài nguyên đã duyệt, không tạo thêm mẫu tài nguyên. Kết quả ghép và bản xem trước lưu theo dự án, không tự cài vào kho chung.
- Ưu tiên đúng quan hệ: ai ở đâu, trên vật nào, phía trước/sau vật nào, đang cầm/đeo thứ gì, chạm vào đâu. Không lấy đủ số lượng asset làm tiêu chí đạt.
- Hình minh họa đơn giản như mẫu: chọn các trạng thái tĩnh có ý nghĩa; không yêu cầu mô phỏng chuyển động phức tạp để thể hiện một sự việc.
- Cùng một địa điểm giữ cấu trúc và đồ nội thất xuyên cảnh; đổi góc máy hoặc thay trạng thái không làm tự đổi phòng.
- AI chọn ý nghĩa, vai và mã tài nguyên hợp lệ. Code quyết định hình học, điểm tiếp xúc, độ sâu và kiểm tra ràng buộc.

Kho hữu hạn có thể mở rộng cho nhiều truyện nhưng không thể cam kết mọi sự vật hoặc hành động tưởng tượng đều đã có. Mục tiêu vận hành là giải quyết khả năng minh họa trước khi chạy các bước tốn thời gian, có phương án trong kho và không dừng giữa chừng chỉ vì thiếu một mẫu bố cục.

## 2. Điểm xuất phát đã xác nhận từ code

| Hiện trạng | Hệ quả | Việc cần làm |
|---|---|---|
| `pipelinePuppet.ts` còn gọi vẽ nhân vật, sprite, props, sets; `setComposer.ts` còn vẽ mảnh mới | Chưa đáp ứng yêu cầu kho đóng | Chặn ở cả điều phối và hàm vẽ/ghi tài nguyên, gồm đường phục hồi và tiếp tục job |
| Có 17 loại `blocking`, nhưng mỗi cảnh phải có composition tương thích tư thế/chỗ tựa | Có loại tương tác không có nghĩa mọi biến thể đều dùng được | Lập ma trận mẫu đã duyệt theo vai, tư thế, chỗ tựa, góc nhìn và gói |
| `setComposer.ts` đã biến đổi spots, bounds và compositions theo mảnh cảnh | Có nền tảng tái sử dụng | Nâng thành lắp ráp có kiểm tra tiếp xúc và khả năng tương thích |
| Mảnh AI vẽ mới hiện có thể được ghi với `spots: []` | Có hình nhưng chưa đủ khả năng đặt người/vật | Kho chỉ xuất bản mảnh có đầy đủ hồ sơ tiếp xúc cần thiết |
| Kiểm bối cảnh có so khớp `fixtureStates` | Cửa/đồ đạc đổi trạng thái dễ tạo nhu cầu vẽ cả cảnh | Tách trạng thái của từng thành phần khỏi danh tính địa điểm |
| Continuity giữ tư thế và vật cầm qua các khung | Có thể giữ cả trạng thái đã lỗi thời | Chuyển trạng thái bằng sự kiện rõ ràng, kiểm mâu thuẫn với hành động mới |
| `reference-coverage.json` ghi `overview_and_selected_frames`, `exhaustiveSceneInventory: false` | Chưa đủ bằng chứng đã kiểm hết mọi cảnh của 22 video | Hoàn tất sổ cảnh từ dữ liệu đã lưu, ghi rõ phần thiếu, không gán nhãn đã kiểm toàn bộ |

Các lỗi cần thành ca hồi quy: người nằm tự đứng hoặc tiếp tục nằm khi đã ra cửa; khăn đeo lên đầu hoặc quá lớn; vật cũ còn trên tay; bát đặt nhầm thành giếng; khói/mùi sai nguồn; ma đi thay vì bò; tiếp xúc vai không thực hiện; cận cảnh không hiện chi tiết được kể.

## 3. Tách tài nguyên đến đơn vị có thể kiểm chứng

Không tách thành các nét vẽ hoặc mọi bộ phận cơ thể chỉ để tăng số file. Một đơn vị nên có ý nghĩa sử dụng độc lập, hình học ổn định và điểm neo kiểm được. Khi tương tác cần nhiều điểm tiếp xúc, xuất bản thêm cụm lắp ráp đã duyệt thay vì buộc AI ghép từng chi tiết tùy ý.

| Lớp | Tài nguyên tách riêng | Dữ liệu bắt buộc |
|---|---|---|
| Nền không gian | Phòng, sân, đường làng, bờ nước, rừng, nghĩa địa… | Sàn, chân tường/chân trời, phối cảnh, vùng được đặt đồ và vùng cấm |
| Cấu trúc | Cửa, cửa sổ, vách, cột, cầu thang, hàng rào… | Điểm lắp, mặt trong/ngoài, trạng thái, vùng che |
| Nội thất | Giường, phản, chiếu, ghế, bàn, bàn thờ, quan tài, giếng, thuyền… | Mặt đỡ, ghế/mặt nằm, trước/sau/hai bên, sức chứa, bounds, hướng và độ sâu |
| Nhân vật | Mẫu người theo tuổi/vai, góc nhìn, trang phục của từng gói | Tỉ lệ, điểm chân, tay, vai, cổ, đầu/miệng, tư thế hỗ trợ và giới hạn biến đổi |
| Tư thế | Đứng, ngồi ghế, ngồi sàn, quỳ, nằm, cúi, bò, giơ tay… | Điểm tiếp xúc, chỗ tựa hợp lệ, hướng nhìn và khả năng cầm đồ |
| Đạo cụ | Bát, đũa, khăn, tiền, nhang, đèn, dao, chổi, gậy, sách… | Kích thước theo người, hướng, điểm cầm, điểm đặt, chỗ đeo, nguồn hiệu ứng nếu có |
| Trạng thái vật | Cửa mở/đóng, bát đầy/vơi, đèn sáng/tắt, khăn khô/ướt… | Cùng danh tính vật, trạng thái đã duyệt, giữ điểm lắp và hình học tiếp xúc |
| Dấu vết/hiệu ứng | Cơm nổi, nước tràn, vết bẩn, khói, mùi, sương… | Bề mặt hoặc bộ phận phát sinh, phạm vi, hướng; không đặt vào tọa độ tùy ý |
| Cụm tương tác | Giường + người nằm + người chăm; bàn + người ngồi; cửa + hai phía… | Vai, tài nguyên bắt buộc, các điểm tiếp xúc và giới hạn camera |

Tên kỹ thuật và mô tả cho AI dùng tiếng Anh chuẩn, có mã khái niệm ổn định; giao diện dùng tên tiếng Việt. Tên đồng nghĩa Việt/Anh được chuẩn hóa về cùng khái niệm, không coi mọi từ gần nghĩa là cùng một vật. Ví dụ phải phân biệt giếng với mương, khăn đeo cổ với khăn đội đầu, giường với phản khi khác công dụng trong cảnh.

## 4. Hợp đồng gói và khả năng sử dụng

Thiết kế bổ sung hồ sơ phiên bản gói gồm: tài nguyên đã duyệt, mã khái niệm, biến thể, tư thế hỗ trợ, cụm bố cục, trạng thái, quan hệ được phép và phương án minh họa thay thế đã kiểm. Đây là dữ liệu đề xuất, chưa có đủ trong schema hiện tại.

- Hai gói dùng chung ý nghĩa của mã nhưng có hình và hình học tiếp xúc riêng. Không lấy tọa độ tay/cổ của mặt nạ áp thẳng sang chibi.
- Mọi asset dùng trong một video phải truy được tới mã và phiên bản đã duyệt của gói; các thành phần trong cảnh ghép cũng phải thỏa điều này.
- Asset lỗi, thiếu tư thế hoặc thiếu điểm neo được cách ly khỏi lựa chọn sản xuất. Giữ bản cũ để khôi phục dự án, không xóa hàng loạt kho hiện tại.
- Job chụp danh sách tài nguyên và phiên bản khi bắt đầu; tải lại trang hoặc chạy tiếp không đổi tài nguyên ngầm.
- Lật cảnh phải biến đổi cả hình học và nhãn định hướng. Trái/phải theo thế giới và trái/phải theo người phải được phân biệt; danh tính vai không đổi chỉ vì lật máy.
- Ngày/đêm và các trạng thái cửa dùng chung hình học gốc khi hợp lý; không nhân số thiết kế bằng cách chỉ đếm bản lật hoặc bản đêm.

## 5. Mở rộng mẫu bố cục cố định

Mỗi dòng dưới đây là một họ mẫu cần rà soát/bổ sung, không phải tuyên bố đã triển khai. Mỗi họ có biến thể có ý nghĩa theo truyện, tối thiểu kiểm đúng các tổ hợp tư thế thực sự được dùng, không sinh toàn bộ tích tổ hợp máy móc.

| Họ mẫu | Biến thể cần chuẩn hóa | Quan hệ bắt buộc |
|---|---|---|
| 1. Hai người trò chuyện | Đứng–đứng, đứng–ngồi, ngồi–ngồi; đối diện/cạnh nhau | Đúng hướng, khoảng cách, chỗ ngồi |
| 2. Nhóm trò chuyện | 3–5 người, chủ/khách, một người phản ứng | Vai chính không bị quần chúng chiếm chỗ |
| 3. Chăm người nằm | Người chăm đứng/ngồi/quỳ bên giường, phản, chiếu, võng | Đầu/chân người nằm, mép mặt đỡ, khoảng tiếp cận |
| 4. Nhiều người bệnh | Hai người nằm/ngồi, một hoặc hai người chăm | Không dùng chung điểm nằm, không xuyên người |
| 5. Chải tóc/chăm sóc | Người được chăm ngồi/đứng, người làm phía sau/bên cạnh | Tay và dụng cụ ở vùng đầu/tóc |
| 6. Người lớn và trẻ | Dắt tay, ngồi cạnh, trẻ trong nôi | Tỉ lệ tuổi, đúng điểm tay và mặt đỡ |
| 7. Bế/cõng | Bế trẻ, cõng người; cụm tĩnh được dựng riêng | Điểm đỡ nhiều vị trí; không dùng một người thu nhỏ dán tùy ý |
| 8. Đỡ/khiêng | Đỡ người yếu, hai người khiêng | Phân vai và nhiều điểm tiếp xúc đã duyệt |
| 9. Trong/ngoài cửa | Gõ, hé nhìn, đứng ngưỡng, mở cửa | Mặt trong/ngoài, tay với cánh cửa, lớp che |
| 10. Cửa sổ/vách | Nhìn ra/vào, bóng sau cửa, áp sát vách | Nhân vật đúng phía và đúng vùng lộ hình |
| 11. Bàn ăn/bàn làm việc | Ngồi/đứng quanh bàn, đặt bát, viết sổ | Mặt bàn, ghế, tay, đồ trên bàn |
| 12. Trao/nhận đồ | Một/ hai tay, đặt xuống rồi nhận | Một vật, chuyển chủ tại sự kiện, không nhân đôi |
| 13. Quầy/sạp | Người bán, khách, giao hàng/tiền | Đúng phía quầy và vật che phần dưới |
| 14. Bàn thờ/cúng | Đứng/quỳ, đặt lễ, cắm nhang | Lễ trên mặt thờ, khói từ đầu nhang |
| 15. Tang lễ | Người nằm trong quan tài, người quỳ/đứng, đoàn tang | Mặt đỡ và lớp che; khăn tang đúng chỗ |
| 16. Mộ/nghĩa địa | Viếng, đào, người/ma sau mộ | Khoảng trước/sau, bề mặt đất và vật che |
| 17. Giếng/ao/mương | Nhìn xuống, múc nước, vật nổi | Phân biệt đúng loại nơi chốn và bề mặt nước |
| 18. Bờ sông/cứu người | Trên bờ, trong nước, kéo lên | Mực nước, điểm tay; không chuyển người thành đứng trên mặt nước |
| 19. Thuyền | Chèo, ngồi, cập bến, đứng bờ | Điểm ngồi, mái chèo và thành thuyền che đúng |
| 20. Cầu thang/gác | Trên/dưới, lên/xuống minh họa bằng trạng thái | Cao độ chân và bậc/mặt sàn tương ứng |
| 21. Lao động/sinh hoạt | Quét, nấu, bổ củi, gánh, giặt | Tay với cán, đầu chổi với đất, đồ gánh với vai |
| 22. Đi/tìm kiếm | Đơn, đôi, hàng, cầm đèn/đuốc | Hướng chung, cự ly và vật cầm đúng tay |
| 23. Đuổi/chặn/lùi tránh | Người đuổi, người chạy, người chặn | Thứ tự tương đối và hướng, dùng tư thế tĩnh phù hợp |
| 24. Ma xuất hiện | Sau cửa/mộ/cây, đứng/ngồi/nằm/bò | Dùng mẫu nhân vật cùng gói và preset ma đã duyệt, đúng độ che và độ rõ |
| 25. Tiếp xúc gần | Nắm tay/vai, ghé tai, cúi sát, cắn vai khi truyện yêu cầu | Cụm thân/tay/đầu riêng; có ảnh chứng minh tiếp xúc |
| 26. Cột/xà/mái | Trên gác/xà, người quan sát bên dưới | Điểm tựa, cao độ và đường nhìn |

Các chi tiết khó nhưng quan trọng có mẫu insert/cận cảnh riêng: bàn tay, bàn chân, mắt, miệng, bát, nút thắt khăn, dấu vết, cửa và vật chứng. Insert vẫn phải lấy từ tài nguyên trong gói, đúng danh tính vật/người và đúng trạng thái; không dùng ảnh tượng trưng sai nội dung.

## 6. Bộ giải vị trí thay cho chọn điểm rời rạc

Đề xuất luồng: sự việc → đồ thị quan hệ → mẫu tương tác hợp lệ → gán vai → giải các điểm tiếp xúc → kiểm hình học → dựng ảnh.

Các loại quan hệ cần biểu diễn rõ:

- `supported_by`: người/vật được đỡ bởi giường, ghế, sàn, mặt bàn hoặc mặt nước.
- `attached_to`: khăn vào cổ/đầu, đòn gánh vào vai; có loại phụ kiện và hướng.
- `held_by`: vật thuộc tay nào; chỉ có một chủ tại một thời điểm, ngoại trừ mẫu hai người cùng giữ được duyệt.
- `in_front_of`, `behind`, `inside`, `outside`: mặt phẳng, độ sâu và vùng che.
- `touching`, `looking_at`, `near`: phân biệt chạm thật với chỉ đứng gần hoặc quay mặt về.

Đây là các khái niệm thiết kế bổ sung, không phải API đã tồn tại đầy đủ.

Ví dụ: A đứng chăm B nằm trên giường. B gắn mặt nằm của đúng giường; A gắn điểm chăm cạnh giường; cả hai giữ danh tính. Khi A đưa bát, bát chuyển từ mặt bàn sang tay A theo sự kiện. Khi B ngồi dậy, chuyển sang mẫu ngồi trên chính giường đó; không giữ tư thế nằm vì continuity cũ. Nếu B chỉ nói thì giữ tư thế nằm.

Quy tắc giải:

1. Gán ràng buộc cứng trước: nằm/ngồi, tiếp xúc, trong/ngoài, vật cầm/đeo. Sau đó mới xếp người phụ và cân bố cục.
2. Không dùng chống chồng hình để kéo một người khỏi điểm tựa. Nếu không đủ chỗ, chọn mẫu hợp lệ khác, đổi góc hoặc chia nhịp hình.
3. Khóa tỉ lệ theo gói và vật thể. Khăn không được phóng theo chiều cao toàn người; đồ đeo phải có điểm đeo tương ứng.
4. Khi xoay người nằm hoặc đổi tư thế, điểm tay, cổ, miệng và đồ gắn phải biến đổi cùng hệ tọa độ.
5. Camera chỉ cắt/cận theo vùng cho phép; vẫn phải thấy chi tiết mà nhịp hình cần minh họa.
6. Các sai số tiếp xúc và ngưỡng che khuất phải hiệu chỉnh từ mẫu của từng gói. Không coi một con số pixel tùy chọn là chứng minh hình đã đúng.

## 7. Trạng thái xuyên cảnh và quyền sở hữu đồ vật

- Mỗi người, vật và nơi chốn có danh tính ổn định; hiện tại/hồi tưởng có phạm vi trạng thái riêng.
- Ghi các sự kiện: cầm, đặt, trao, buông, đeo, tháo, đứng lên, ngồi xuống, nằm xuống, ra/vào cửa, đổi nơi chốn, mở/đóng cửa.
- Giữ trạng thái nếu chưa đổi, nhưng hành động mới có bằng chứng phải được kiểm trước khi kế thừa. Mâu thuẫn được giải quyết tại bước lập cảnh, không để engine tự đoán.
- Vật đã đặt xuống phải rời tay. Vật đã trao phải đổi chủ. Không nối tiếp vật cầm cũ chỉ vì người đó còn xuất hiện.
- Giữ bố trí đồ đạc theo địa điểm; trạng thái cửa, đèn hoặc vật chứng cập nhật từng thành phần thay vì sinh cả phòng mới.
- Quay cận rồi trở về toàn cảnh phải giữ cùng vị trí và trạng thái, trừ sự kiện có chủ đích.

## 8. Pipeline chỉ dùng kho và phương án khi thiếu

Luồng đích: khóa gói/phiên bản → đọc sự việc → kiểm khả năng minh họa toàn truyện → chọn tài nguyên và mẫu → ghép cảnh dự án → giải vị trí/trạng thái → dựng và kiểm ảnh → tạo âm thanh/render theo luồng hiện có.

Kiểm khả năng minh họa hoàn tất trước khi tạo voice, mở công việc vẽ hoặc bắt đầu render. Các bước AI biên kịch/phân cảnh được cung cấp khả năng thực tế của gói để ưu tiên cách thể hiện khả thi mà giữ cốt truyện và bằng chứng quan trọng.

Thứ tự tự xử lý khi không có mẫu chính xác:

1. Chuẩn hóa tên và tìm đúng tài nguyên cùng gói có đủ công dụng, tư thế và điểm tiếp xúc; không thay vật chỉ vì trùng từ khóa.
2. Ghép nền và các mảnh có sẵn bằng công thức tương thích đã duyệt.
3. Chọn biến thể bố cục/góc nhìn khác vẫn giữ nguyên sự việc và danh tính.
4. Chia một hành động phức tạp thành các hình tĩnh trước–sau hoặc insert từ kho, miễn vẫn thể hiện được chi tiết quan trọng. Không chẻ theo từng câu thoại hoặc tạo lặp vô nghĩa.
5. Nếu vẫn không có cách thể hiện đúng: báo phần thiếu cụ thể trước khi chạy sản xuất; đưa yêu cầu vào danh sách xây kho riêng. Không tự vẽ, không đổi truyện ngầm và không xuất hình sai để báo thành công.

Việc mở rộng kho thuộc giai đoạn bảo trì được yêu cầu riêng. Sau khi bổ sung và duyệt một phiên bản gói, các video tiếp theo sử dụng ngay phiên bản đó. Không thiết kế luồng phải xin thêm tài nguyên ở giữa mỗi video.

Phải chặn cả các đường phụ: làm lại hình, sửa QA, tạo biến thể sáng/tối, dựng sprite thiếu, dùng cache cũ, phục hồi lỗi và tiếp tục job cũ. Một cờ ở UI không đủ bảo đảm kho đóng.

## 9. Xây kho từ mẫu và mở rộng truyện dân gian

1. Lập sổ cảnh cho 22 nguồn từ ảnh và tài liệu hiện có. Gộp khung gần trùng, giữ ảnh đại diện cho từng thay đổi sự việc, tương tác, tư thế hoặc vật chứng.
2. Mỗi mục ghi: nguồn/thời điểm, lời kể tương ứng nếu đã có, nơi chốn, vai, tư thế, đồ vật, quan hệ, góc máy và dữ liệu còn thiếu. Không suy đoán lời thoại từ ảnh.
3. Phân biệt rõ đã xem bảng tổng quan, đã xem cảnh đại diện và đã đối chiếu toàn cảnh/thoại. Phần chưa đủ bằng chứng để trạng thái chưa kiểm.
4. Gom thành mẫu tái sử dụng; dựng hình riêng cho hai gói, học cách bố trí thay vì sao chép hình hoặc nội dung nguồn.
5. Bổ sung các môi trường truyện ma dân gian: nhà ngói, nhà tranh, nhà sàn, buồng ngủ, bếp, hiên, sân, bàn thờ, đình/chùa/miếu, nghĩa địa, đường làng, chợ/quán, bờ sông/mương/ao/giếng, đò, rừng, ruộng, cầu, trường/lớp và nơi chữa bệnh phù hợp bối cảnh truyện.
6. Nhân vật theo nhóm tuổi/vai và trang phục; phụ kiện và preset ma dùng lại cùng danh tính. Ưu tiên đủ năng lực biểu đạt và tỉ lệ đúng thay vì tăng nhiều mẫu gần giống nhau.
7. Chỉ xây tài nguyên thiếu trong ma trận, không nhân bản toàn bộ kho. Mỗi tài nguyên thêm phải gắn được vào ít nhất một ca bố cục đã kiểm.

Số lượng thiết kế sẽ chốt sau kiểm kê theo mã khái niệm và năng lực thực tế. Báo cáo tách thiết kế gốc khỏi bản ngày/đêm, lật hình và bản sửa; không dùng tổng file JSON để tuyên bố độ phủ.

## 10. Thứ tự triển khai và điểm nghiệm thu

| Đợt | Công việc | Đầu ra cần nghiệm thu |
|---|---|---|
| 1. Kiểm kê và đặc tả | Rà kho hai gói, nguồn mẫu, nhánh tạo tài nguyên, các lỗi thực tế; chốt schema và ma trận | Danh sách dùng được/thiếu/lỗi, danh mục mẫu ưu tiên, ảnh lỗi gốc và hợp đồng kho đóng |
| 2. Khung vị trí và trạng thái | Điểm tiếp xúc, quan hệ, ownership, chuyển tư thế, fixture states, bộ giải và kiểm hình học | Các ca từng sai dựng đúng trên tài nguyên thử chuẩn của cả hai gói; không còn duy trì vật/tư thế cũ sai |
| 3. Kho lõi và cụm bố cục | Chuẩn hóa tài nguyên đang có; bổ sung trước giường, bàn, cửa, đồ cầm/đeo và tiếp xúc gần; sau đó phủ các họ còn lại | Mỗi mẫu được duyệt có sheet ở cả hai gói, đủ hồ sơ neo và biến thể thiết yếu |
| 4. Lắp pipeline kho đóng | Preflight, chỉ mục năng lực, chọn tài nguyên, lắp cảnh, fallback và chặn mọi nhánh vẽ/ghi asset | Video mới, làm lại, tải lại, sửa QA và resume đều không sinh hoặc nhập tài nguyên ngoài phiên bản gói |
| 5. Mở rộng và kiểm tổng thể | Hoàn tất đối chiếu nguồn, mở rộng theo ma trận dân gian, chạy truyện chưa dùng khi thiết kế mẫu | Độ phủ được chứng minh bằng từng case; báo cáo thiếu trung thực; không chỉ chạy đúng một dự án |

Triển khai từng lát hoàn chỉnh: một họ mẫu phải đi qua dữ liệu kho → chọn mẫu → đặt hình → trạng thái → kiểm ảnh. Không đợi vẽ xong toàn bộ kho mới thử cơ chế đặt, cũng không bật kho đóng vào luồng sản xuất khi preflight và kho lõi chưa đủ.

## 11. Kiểm thử và tiêu chí đạt

### Kiểm tự động

- Mọi ID thuộc gói/phiên bản đã khóa, kể cả thành phần phụ và inset. Không có lời gọi tạo asset mới trong toàn bộ job hoặc đường phục hồi; so sánh danh sách/hash nội dung kho trước–sau. Số lần dùng và log vận hành tách khỏi nội dung asset đã duyệt.
- Không có ID/spot/anchor thiếu; sai loại mặt đỡ, xuyên vùng cấm, trùng slot không được phép hoặc tiếp xúc vượt sai số cho phép.
- Kiểm ở hình học sau biến đổi, gồm lật, xoay, co, nằm, ghép mảnh và camera; không chỉ kiểm dữ liệu nguồn.
- Trao/đặt/buông/đeo/tháo không để vật nhân đôi hoặc chủ cũ còn giữ. Chuyển tư thế hợp lệ, đổi người nói không đổi tư thế.
- Cận/toàn cảnh và hồi tưởng giữ đúng danh tính, bố trí và phạm vi trạng thái.
- Đầu vào AI lỗi hoặc trả thiếu được đọc lại có giới hạn, sau đó dùng bộ chọn mẫu xác định khi đủ dữ kiện. Không retry vô hạn, không sửa bằng vẽ mới.
- Kiểm âm tính: thiếu vật chứng thiết yếu phải được phát hiện trước sản xuất; hệ thống không lén lấy giếng thay mương hoặc một tư thế đứng thay tư thế nằm.

Tận dụng `verify-motion-blocking`, `verify-motion-fixed-compositions`, `verify-motion-placement-general`, `verify-motion-folk-blocking`, bộ `test:motion-visual-contract` và `test:motion-storyboard`. Bổ sung kiểm thử hành vi mới ở nơi cần thiết; kiểm schema/prompt đơn thuần không đủ.

### Kiểm hình thực tế

- Mỗi mẫu và biến thể đã công bố: ảnh người/đồ đặt thật, kèm lớp hiện neo/bounds để tìm lỗi; không duyệt chỉ bằng chấm spot trống.
- Cả hai gói; ngày/đêm; lật khi hỗ trợ; các tỉ lệ trẻ/người lớn; chế độ chuyển động bật/tắt với các mẫu có chuyển động.
- Xem ảnh cùng lời kể và sự kiện cần minh họa. Kiểm người đứng/ngồi/nằm, phía trong/ngoài, tay giữ đồ, khăn đeo, mặt bàn/nước, nguồn khói/mùi, điểm tiếp xúc và chi tiết cận.
- Ảnh gần giống hoặc tỉ lệ lỗi bằng không từ bộ giải chưa đủ để kết luận nội dung đúng. Các trường hợp AI không xác nhận đủ bằng chứng không được ghi đạt.
- Lưu contact sheet nhiều cảnh trong một ảnh, danh sách case và ghi chú đạt/lỗi. Mẫu chưa duyệt không được bật trong bản gói sản xuất.

Kiểm bằng stills trước. Video test chỉ thực hiện ở bước nghiệm thu được yêu cầu, sau khi các ảnh và kiểm hành vi đạt. Dùng nhiều truyện chưa tham gia thiết kế mẫu, gồm nhiều địa điểm và chuyển trạng thái; không lấy một video chạy xong làm bằng chứng đáp ứng mọi truyện.

## 12. Phạm vi file khi triển khai

- Schema và capability của gói: `src/types/motionPuppet.ts`, `src/constants/motionBlocking.ts`, `src/constants/motionPlacement.ts`, bộ danh mục/seed và dữ liệu kho.
- Chọn tài nguyên và chính sách kho đóng: `pipelinePuppet.ts`, `kitDraw.ts`, `kitLibrary.ts`, `setComposer.ts` cùng các điểm vào sửa hình/tiếp tục job gọi chúng.
- Quan hệ, trạng thái và continuity: `director.ts`, `visualContract.ts`, `readContinuity.ts`, `frameContinuity.ts` và module dùng chung mới nếu cần.
- Giải vị trí và dựng: `blocking.ts`, `layout.ts`, `compilePuppet.ts`, `motion-engine/puppet2d.js`, `motion-engine/texts.js`.
- Kho gốc và sheet kiểm: `python_scripts/kit_seed/`, `docs/video-references/`; cài chọn lọc sau khi duyệt, không ghi đè hàng loạt tài nguyên đang dùng.
- Sau khi triển khai đạt: cập nhật `HUONG_DAN_KHO_2D_CO_DINH.md` để thay các mô tả thiếu thì tự vẽ bằng quy tắc kho đóng mới. Hiện tại chỉ thêm kế hoạch này, không tuyên bố các thay đổi đã chạy.

Đích nghiệm thu là một hệ thống có thể chứng minh từng quan hệ trong hình bằng tài nguyên và bố cục đã duyệt của gói, phát hiện thiếu trước khi sản xuất, và tái sử dụng quy tắc cho các dự án tiếp theo.
