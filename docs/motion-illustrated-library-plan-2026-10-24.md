# Kế hoạch sửa kho cũ và dựng video bằng hình minh họa

Ngày: 24/10/2026. Trạng thái: đã triển khai phần lõi, cài đợt chuẩn hóa kho cũ và đang nghiệm thu luồng AI thật. Chi tiết, giới hạn và kết quả nằm trong [báo cáo triển khai](motion-illustrated-library-implementation-2026-10-24.md). Đây là hướng ưu tiên thay cho các phần mở rộng tương tác/chuyển động trong kế hoạch kho đóng trước đó. Các chức năng kho đóng và snapshot đã có vẫn giữ nguyên vai trò.

## 1. Mức chất lượng và phạm vi

Lấy cách tổ chức hình của **Chiếc khăn Piêu – Bùa Yêu Kỳ Truyện** làm chuẩn: hình minh họa rõ, người và đồ đúng chỗ, thay hình theo diễn biến cần thấy. Không biến lời kể thành yêu cầu mô phỏng mọi động tác.

Đối chiếu: [phân tích mẫu](pieu-scene-analysis-2026-10-23.md), [cách chia hình](motion-reference-scene-division-2026-10-24.md), [bảng ảnh #081–#120](video-references/khuatmatkytruyen/01-ZrgIi8a8dyA/analysis-20261023/boards/review-03.jpg). 341 mốc là các khoảng hình/góc/trạng thái phát hiện trong bản nguồn, không khẳng định 341 cảnh hoặc toàn bộ video bất động. Bản phân tích cục bộ không có âm thanh, nên không dùng nó để kết luận thông số voice.

Hai gói triển khai: Tối giản mặt nạ (`minimal_mask`) và Chibi màu dân gian (`chibi_folk`). Học cách bố trí của mẫu, giữ nhận diện riêng của mỗi gói. Luồng này là minh họa 2D; không xây thêm hệ dựng 3D.

- Dùng hình tĩnh, tư thế có sẵn, biểu cảm và cỡ cảnh để kể chuyện. Không yêu cầu đi bộ, quỹ đạo tay, mô phỏng trao đồ, va chạm hoặc chuyển tư thế liên tục.
- Một hình được giữ qua nhiều câu/người nói nếu còn đúng sự việc. Đổi hình khi có thông tin mới, phản ứng đáng thấy, đổi địa điểm/thời điểm hoặc thay trạng thái quan trọng.
- Một hành động được minh họa bằng hình đại diện hoặc kết quả. Vật chứng quan trọng và người thực hiện vẫn phải đúng.
- Khi tạo video, chỉ chọn/ghép tài nguyên cùng gói đã có; sửa hoặc thêm tài nguyên là công việc xây kho riêng.

## 2. Việc bắt buộc đầu tiên: sửa toàn bộ kho cũ

Không coi 144 hồ sơ bổ sung trước đó là đã sửa xong tài nguyên cũ. Theo [kiểm kê ngày 24/10](../scratch/old-library-audit-20261024/README.md), có 1.991 hồ sơ cũ trong sáu loại; 1.680 đủ điều kiện được chọn, 311 hồ sơ lịch sử không được chọn. Điều kiện được chọn không chứng minh đã đạt chuẩn hình minh họa mới. Mỗi gói còn dùng 59 nhân vật cũ; chúng chưa được tạo lại trong đợt bổ sung.

Mọi hồ sơ cũ phải có một dòng trong danh sách chuyển đổi: ID, gói, loại, nguồn hình, tình trạng, việc cần sửa, ID chuẩn và kết quả kiểm. Nhãn tối thiểu: giữ nguyên sau kiểm, sửa, tách/ghép lại, ánh xạ bản trùng, hoặc giữ lịch sử không dùng mới. Không bỏ qua cả nhóm cũ và không xóa hàng loạt hồ sơ lịch sử.

| Nhóm | Phần phải sửa/chuẩn hóa | Đầu ra kiểm được |
|---|---|---|
| Gói phong cách | Tỷ lệ người, nét, màu và kích thước tương đối nhất quán | Bảng mẫu người–đồ–nền của mỗi gói |
| Nhân vật | Hình đứng/ngồi/nằm và các hướng thực sự cần; mặt, tóc, áo, kích thước và điểm đặt nhất quán. Sửa lỗi chân ngắn/tỷ lệ Chibi cả dữ liệu lưu và nguồn sinh, không chỉ đổi hằng số | Ảnh trước–sau; cùng người ở các tư thế. Không bắt gói mặt nạ có cấu tạo giống Chibi |
| Đồ vật | Đúng loại, tỷ lệ, hướng và chỗ cầm/đeo/đặt; tên chuẩn tiếng Anh cho AI, nhãn Việt cho UI | Đồ trong tay, trên bàn, trên nền hoặc chỗ treo thích hợp; cận vật chứng rõ |
| Bối cảnh nguyên khối | Giữ hình tốt; sửa sai hình học. Tách phần cần thay/di chuyển/tái sử dụng và loại phần vẽ trùng khi ghép. Cảnh đủ tốt được dùng như bố cục dựng sẵn | Một địa điểm dùng lại được, không hai chiếc giường hoặc hai nồi do ghép đè |
| Nền và mảnh cảnh | Chuẩn hóa kích thước, vị trí lắp, thứ tự trước/sau và vùng đặt người/đồ cần thiết | Ghép thử với người và đạo cụ thật, không chỉ xem nền trống |
| Biến thể và bản trùng | Nối đúng ngày/đêm, hướng nhìn và trạng thái; chuẩn hóa khóa trùng, giữ ánh xạ ID | Không báo thiếu khi đã có biến thể; dự án cũ vẫn đọc đúng |

Tách theo đơn vị dùng độc lập: phòng, cửa, giường, bàn, chiếu, bếp, nồi, cây, mặt nước, đạo cụ. Không tách từng nét hoặc xây hệ giải phẫu. Không tách lại một hình nền tốt nếu không đem lại khả năng sử dụng cụ thể.

Tạo bộ mới trong thư mục chuẩn bị, kiểm ảnh rồi mới phát hành phiên bản kho. Lưu bảng ánh xạ và bản kho trước chuyển đổi; dự án đang dùng snapshot giữ nguyên hình của nó. Chỉ chuyển sang bản kho mới qua bước dựng lại rõ ràng.

## 3. Bộ bố cục minh họa đơn giản

Mỗi bố cục là một cách xếp ảnh đã kiểm, có vị trí vai, tư thế tĩnh, chỗ đặt đồ, hướng nhìn và thứ tự che. AI chọn bố cục và người đóng vai; code áp dụng vị trí theo bố cục. Không yêu cầu đầy đủ bảng tương tác cho mọi nền hoặc giải chuyển động cơ thể.

Ưu tiên các họ dùng nhiều: một người; hai/ba người nói chuyện; nhóm người; một người nằm và người cạnh bên; hai người nằm hai phía; người ngồi bên bếp/bàn; đứng ở cửa; người trên sàn và người dưới sân; người trên bờ; quan sát từ xa; cận mặt; cận vật; hình hồi tưởng và hình giải thích.

Mỗi họ có các tư thế và cỡ cảnh thực sự hữu ích, không nhân mọi tổ hợp thành file riêng. Bố cục có giường/ghế cần chỗ đặt theo mặt giường/ghế; bố cục đứng cần mặt nền; cảnh không có tiếp xúc không bắt khai báo tiếp xúc giả. Không buộc cảnh trò chuyện đơn giản phải có chuyển động hoặc chạm tay mới qua kiểm.

## 4. Lập hình theo điều người xem cần hiểu

| Lời kể | Hình cần dựng | Không yêu cầu |
|---|---|---|
| A đứng cạnh B đang nằm | A đứng cạnh giường/chiếu, B nằm đúng trên đó | Hoạt cảnh A bước tới hoặc B từ đứng chuyển sang nằm |
| Xoan chải tóc, có chi tiết tóc trên lược | Hình người ngồi và người phía sau; cận lược/tóc nếu là đầu mối | Vung tay chải, gỡ từng sợi rồi cuộn tóc |
| A đưa khăn cho B | Hình trao tĩnh đủ rõ hoặc B đã nhận khăn, tùy ý nghĩa câu | Quỹ đạo khăn và mô phỏng hai bàn tay chuyển giao |
| Người bị đẩy ngã | Hình ngã/nằm và người còn đứng; thêm hình trước đó nếu cần hiểu nguyên nhân | Va chạm cơ thể và chuyển động ngã liên tục |
| Có tiếng gọi hoặc mùi lạ | Người nghe/ngửi, hướng chú ý hoặc nguồn phù hợp khi đã được kể | Tự thêm một hồn ma hiện rõ khi truyện chưa cho thấy |
| Đồ được cất rồi lấy ra sau | Hình cất/cận vật khi cần và trạng thái cuối được ghi nhớ | Dựng mọi thao tác mở, nhấc, gập, đóng |

Storyboard chỉ cần biết: đoạn lời được phủ, địa điểm/thời điểm, người hiện diện, bố cục, tư thế tĩnh, vật quan trọng, trạng thái và mục đích của hình. Những động từ phụ không tự sinh thêm cảnh hay yêu cầu tài nguyên.

## 5. Chọn và ghép từ kho trước khi báo thiếu

1. Sửa bộ tìm kiếm để thấy đủ tài nguyên cùng gói, nhất là biến thể đêm có sẵn. Tên có dấu `~` không được là lý do loại ảnh cần dùng.
2. Dùng cảnh/bố cục dựng sẵn phù hợp trước; nếu chưa có thì ghép nền và mảnh đã có theo công thức đơn giản.
3. Nếu hình toàn khó thể hiện, chọn hình tĩnh khác, cận vật/cảm xúc hoặc trạng thái kết quả phù hợp. Không lấy cận mặt để bỏ qua một vật chứng hoặc quan hệ không gian bắt buộc phải thấy.
4. Chỉ kết luận thiếu sau khi phân biệt lỗi tìm, lỗi dữ liệu, lỗi ghép và thật sự thiếu hình. Nhiều tên tư thế/hành động trong lời kể không đồng nghĩa cần nhiều sprite mới.
5. Kiểm kế hoạch minh họa của toàn truyện trước khi sản xuất voice/hình; không để lỗi cơ bản của kho xuất hiện ở cuối job. Thiếu thật chưa giải được thì nêu rõ trước sản xuất, không âm thầm vẽ mới hoặc xuất hình sai.

## 6. Giữ đúng người, vật và trạng thái bằng dữ liệu gọn

- Khóa nhân vật theo vai xuyên truyện; ma có thể là biến thể mờ của cùng nhân vật khi nội dung yêu cầu. Không làm ma xuất hiện chỉ vì có từ liên quan siêu nhiên.
- Phân biệt mẫu hình đạo cụ và từng vật xuất hiện: hai bát dùng cùng hình vẫn là hai vật riêng. Chỉ theo dõi chủ sở hữu/trạng thái có tác dụng đến hình hoặc cốt truyện.
- Giữ vật đang đeo/cất/treo và người đang nằm/ngồi cho đến khi có thay đổi liên quan. Hồi tưởng không ghi đè trạng thái hiện tại.
- Cùng địa điểm dùng lại sơ đồ nền và đồ chính. Cận cảnh hoặc đổi người nói không làm phòng đổi cấu trúc hay người đổi bên vô cớ.
- Số lượng hình không phải tiêu chí chất lượng. Không giữ một hình quá đoạn lời mà nó còn đúng; không đổi ảnh liên tục chỉ để tránh nền lặp.

## 7. Cấu hình review ảnh và kiểm chất lượng vừa đủ

Thêm công tắc **AI duyệt ảnh cảnh** vào phần cài đặt tạo video hiện có, mặc định bật, lưu cùng dự án. Ghi rõ dùng AI/model ở mục **AI dựng video 2D/3D** hiện tại; chưa thêm bộ chọn AI riêng. Đồng bộ nhãn dựng 2D trong đợt sửa UI để phản ánh đường chạy thực.

- Bật: gửi hình đại diện cùng đoạn lời và yêu cầu minh họa; AI kiểm đúng người, đồ, tư thế, vị trí và chi tiết thiết yếu. Sửa có giới hạn rồi chụp duyệt lại.
- Tắt: không gửi ảnh cho AI review; vẫn kiểm dữ liệu, tài nguyên, vị trí cơ bản và lỗi engine. Không ảnh hưởng các lời gọi AI cần cho việc lập cảnh.
- Không yêu cầu hoạt cảnh cho động từ phụ, không chấm lỗi chỉ vì cảnh tĩnh hoặc nền dùng lại. Lỗi quan trọng chưa xử lý và việc AI chưa phản hồi phải hiển thị đúng trạng thái, không ghi thành đã đạt.
- Kiểm timeline với voice cuối để ảnh được gắn đúng đoạn kể. Dùng ảnh đại diện và thêm mốc khi trạng thái quan trọng đổi; không cần AI xem từng frame của toàn MP4.

## 8. Trình tự thực hiện và đầu ra

| Đợt | Công việc | Đầu ra bắt buộc |
|---|---|---|
| 1. Chuẩn hình và danh sách kho cũ | Chốt bộ hình đại diện theo mẫu, lập bảng xử lý từng ID cũ ở cả hai gói | Danh sách đủ hồ sơ; lỗi trước sửa; chuẩn tỷ lệ và bố cục; không coi kiểm schema là đã duyệt hình |
| 2. Sửa kho cũ | Sửa nhân vật/tư thế, đồ vật, nền, mảnh, biến thể và bản trùng; tách phần tái sử dụng có ích | Bộ kho chuẩn bị, ánh xạ ID, sheet trước–sau và sheet ghép người–đồ; không chỉ thêm nhóm tài nguyên mới |
| 3. Nối vào dựng minh họa | Sửa chọn biến thể, chọn bố cục, ghép đơn giản, storyboard và trạng thái thiết yếu | Cảnh đúng từ lời kể mà không yêu cầu hoạt cảnh; kiểm toàn kế hoạch trước voice |
| 4. UI và khóa phiên bản | Công tắc review, log đúng trạng thái, đổi gói bắt dựng lại hình, snapshot phiên bản | Bật/tắt hoạt động sau tải lại; đúng gói đã chọn; dự án cũ không tự đổi hình |
| 5. Nghiệm thu và phát hành | Kiểm nhiều đoạn truyện ở cả hai gói, sau đó video test 2 phút theo yêu cầu trước của người dùng | Contact sheet nhiều cảnh/ảnh; video đúng lời, không giật/zoom khó chịu; kết quả và phần chưa đạt được ghi rõ |

Mỗi nhóm tài nguyên được sửa phải được thử bằng luồng dựng thật ngay trong đợt, rồi mới mở rộng nhóm tiếp theo. Bao phủ toàn bộ kho cũ bằng danh sách xử lý; không bắt mọi hồ sơ lịch sử trở thành tài nguyên sản xuất. Chỉ bổ sung thiết kế mới sau khi xác nhận không thể dùng/tách/sửa tài nguyên đã có.

## 9. Điều kiện nghiệm thu

- Đứng, ngồi, nằm rõ và đúng mặt đỡ nhìn thấy; người và vật không xuyên nhau hoặc lơ lửng rõ rệt. Chỉ kiểm quan hệ thực sự xuất hiện, không đòi mô phỏng tiếp xúc phức tạp.
- Hai/ba người, người cạnh giường, hai người nằm hai phía, trên sàn/dưới sân, trong/ngoài cửa, trên bờ/dưới nước và cận vật chứng đều được kiểm ở cả hai gói.
- Nhận diện, tỷ lệ Chibi, trang phục, vật chứng và người giữ vật nhất quán; nhiều vật cùng mẫu không bị gộp mất.
- Chia hình theo thông tin, không theo dấu chấm; có cảnh rộng, vừa, cận đúng nhiệm vụ, không kéo dài cảnh qua sự thay đổi trái ngược.
- Hai chế độ review được kiểm; khi tắt không phát sinh lượt gửi ảnh QA. Khi bật không chấp nhận thiếu phản hồi là đạt.
- Tạo/làm lại/tiếp tục video không thêm tài nguyên vào kho; đổi gói không xuất nhầm phần hình cũ. Kho cũ có bảng chuyển đổi và đường khôi phục.
- Dùng nhiều tình huống/truyện để kiểm quy tắc chung; một video hoàn tất không được coi là đã bao phủ mọi truyện. Các chỉnh sửa không được làm mất chức năng voice, room AI, lưu log và phục hồi đã có.

Trọng tâm: sửa hình và dữ liệu kho cũ, chọn đúng bố cục tĩnh, kể đúng bằng những hình đơn giản. Không mở rộng thành hệ animation hoặc tương tác cơ thể để đạt mức video mẫu.
