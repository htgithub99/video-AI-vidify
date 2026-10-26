# Đối chiếu kho tài nguyên với 22 video mẫu — 26/10/2026

## Kết luận

**Chưa đủ bằng chứng để xác nhận kho đáp ứng trọn vẹn 22 video. Đã xác định cả món còn thiếu lẫn món có hình nhưng chưa ghép/đặt đúng.**

- Hai gói hoạt động có cùng số lượng: mỗi gói 62 nhân vật, 150 đạo cụ, 26 nền, 95 mảnh bối cảnh, 174 tổ hợp cảnh và 1 hồ sơ phong cách: tổng 508 mục. 174 tổ hợp không phải 174 nền rời.
- Không có mục nào bị bộ kiểm cấu trúc hiện tại báo lỗi. Điều này không chứng minh đủ trạng thái, bố cục hay chất lượng hình.
- Xác nhận chưa tìm thấy 7 loại món rời: giàn giáo, laptop, xe khách, rạp tang, đồng hồ điện tử, máy quay và chân máy, trong cả hai gói. Đây là danh sách tối thiểu đã xác minh ở phạm vi đã xem.
- 56 phép thử tổng hợp (28 nhóm × 2 gói): 30 tạo được lựa chọn, 26 bị chặn. Cả hai gói cùng 15 tạo được / 13 bị chặn. **Tạo được lựa chọn không đồng nghĩa hình đạt**; đã xem ảnh và ghi vấn đề riêng.
- Probe hai giường là ràng buộc thêm; đã kiểm riêng hai người nằm sàn như ảnh nguồn và lớp học dùng ghế thường. Cả hai phương án đơn giản cũng bị chặn. Probe nôi là kiểm bổ sung, không gán nôi thành yêu cầu bắt buộc của ảnh võng.
- Các lỗi ghép khi có món tập trung ở võng, hai người nằm, nôi, quầy+kệ, chuồng heo, bệnh viện, lớp học, bàn lễ, vải trên giường và điểm người trên sàn cao.

## Phạm vi thực sự đã kiểm

- Đã xem 22 overview, tổng 792 ô timeline; chọn 85 mốc ảnh để lập sổ đối chiếu và xem lại tile nguồn. Các mốc có thể trùng ô overview.
- Kho ảnh lưu có 14,050 ảnh, không đồng nghĩa bấy nhiêu cảnh độc lập. Chưa xem thủ công toàn bộ ảnh và chưa nghe/chép toàn bộ thoại 22 video.
- Video 09 và 16 dùng storyboard dự phòng, có thể bỏ sót cảnh ngắn và chi tiết nhỏ.
- Không tính tỷ lệ bao phủ toàn bộ 22 video từ mẫu kiểm này; các phép thử có bối cảnh, nhân vật và câu bằng chứng tổng hợp, không phải chạy lại kịch bản gốc.
- Phạm vi là thư viện hình minh họa của hai gói minimal_mask/chibi_folk. Chưa kiểm luồng 3D, AI, giọng, phụ đề hoặc xuất video.

## Kho và tính toàn vẹn

- Release: `{'directory': 'D:\\video-AI-vidify\\storage\\output\\motion-video\\kit-library\\releases\\modular-v3-20261026', 'version': 3}`.
- SHA-256 toàn dữ liệu inventory (gồm SVG) trước/sau: `2c0c77c99fb373013b3cfbde1c28175a7ffbeb69d623805b2ace6d999eec3963`; bằng nhau trong lượt kiểm.
- Không sửa production hoặc tài nguyên, không gọi AI/TTS, không tạo/resume/render video. Chỉ thêm script kiểm và báo cáo/ảnh tĩnh.

## Bảng đối chiếu từng video

| #   | Video                                                                   | Phát hiện tại các mốc đã kiểm                                                                                                                                                             |
| --- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | Chiếc khăn Piêu - Bùa Yêu Kỳ Truyện                                     | Bếp, khăn và nhân vật có sẵn; đã thử hai người nằm sàn và hai người nằm giường, kèm một người chăm + bếp; cả hai tổ hợp bị chặn.                                                          |
| 02  | Người con anh hùng - Hồi ức ấu thơ                                      | Có hải quân, di ảnh và võng; võng thiếu điểm nằm, bị giới hạn trong nhà. Khiêng võng có thể minh họa tĩnh.                                                                                |
| 03  | Cuốn sổ nợ - Hình nhân thế mạng kỳ truyện                               | Có sổ nợ, hình nhân, quầy và kệ. Tổ hợp quầy + kệ vẫn bị search_limit, cần kiểm bộ ghép.                                                                                                  |
| 04  | Ván bài định mệnh - Thần Trùng P2                                       | Tượng Phật, chuông và chùa có sẵn; phép thử chùa tạo được lựa chọn. Trẻ trong ảnh nằm trên võng, không phải nôi gỗ.                                                                       |
| 05  | Ván bài định mệnh - Thần Trùng Kỳ Truyện P1                             | Có thuyền cá, bài và mộ. Phép thử hai người trên thuyền tạo hai thuyền riêng: chưa chứng minh hai người cùng một thuyền.                                                                  |
| 06  | Ác Giả Ác Báo - Bùa Lỗ Ban Kỳ Truyện                                    | Có nền mái, hình nhân và giường. Chưa có giàn giáo; điểm người trên mái/sàn cao cần xác minh riêng.                                                                                       |
| 07  | Người mới, trọ cũ - Ma ăn hồn kỳ truyện                                 | Thiếu laptop và xe khách. Có gương và giường nhưng chưa chứng minh khả năng phản chiếu đúng giường như mẫu.                                                                               |
| 08  | Tình mẹ - Ma nữ mất con Kỳ Truyện                                       | Có trẻ sơ sinh, mẹ, cầu và kéo. Có bát nước đất để xét làm vật chứa; chưa chứng minh bố trí trẻ trong vật chứa. Probe nôi bổ sung bị chặn; không xem nôi là bắt buộc trong ảnh nguồn này. |
| 09  | Én ơi, anh về rồi - Ma vọng phu kỳ truyện                               | Có hình nhà sàn và thang, nhưng chưa có điểm đứng trên sàn cao rõ ràng; nguồn dùng storyboard dự phòng.                                                                                   |
| 10  | Chén cơm đất - Ma giấu người kỳ truyện                                  | Có hốc tre, bát cơm đất, thìa và thanh chặn cửa; ghép được lựa chọn nhưng ảnh thử có người chồng nhau.                                                                                    |
| 11  | Trả nợ -Ma báo oán kỳ truyện                                            | Có cửa cuốn, bàn lễ, dép; thiếu xe khách. Phép thử bàn lễ + bát nhang chưa tìm được tổ hợp đúng điểm đặt.                                                                                 |
| 12  | Anh Hai ơi, em xin lỗi - Heo 5 móng kỳ truyện                           | Có chuồng, heo năm móng và thuyền. Tổ hợp chuồng trong sân bị chặn; heo trên thuyền chưa kiểm quan hệ chứa.                                                                               |
| 13  | Thần trùng - Trùng tang kỳ truyện                                       | Có chum đóng kín, cửa, xẻng và mộ; thiếu rạp tang. Trạng thái cửa có khe hở chưa được xác nhận từ tài nguyên cửa chung.                                                                   |
| 14  | Con nhớ nhà lắm - Ma da kỳ truyện                                       | Có cầu, thuyền, nhân vật và gói ma. Cầu tạo được lựa chọn; hình người chìm dưới mặt nước cần cơ chế che đúng lớp.                                                                         |
| 15  | Kẻ dẫn lối không đường về - Ma Trành kỳ truyện                          | Có hổ và dao. SVG dấu chân có bốn vòng tròn ngón ở một bàn chân, cần metadata rõ. Cưỡi hổ có thể dùng minh họa tượng trưng nếu giữ tình tiết.                                             |
| 16  | Đứa con oan nghiệt - Con ranh con lộn kỳ truyện #tamlinh #tamlinhthanbi | Có trẻ, mẹ, vải và bát nước đất; chưa kết luận thiếu chậu. Vải gấp chưa chứng minh phủ đúng thân; nguồn storyboard dự phòng và vật sắc còn khó đọc.                                       |
| 17  | Tình duyên muôn kiếp - Cắt tiền duyên kỳ truyện                         | Thiếu đồng hồ điện tử, máy quay, chân máy. Giường bệnh đã vẽ cả giá truyền; probe bệnh viện chưa ghép được dù có món.                                                                     |
| 18  | Ma cà rồng Tây Bắc - Phí Phông kỳ truyện                                | Có bảng, bàn ghế, nhà sàn và cửa. Probe lớp học với bàn ghế chuyên dụng và với ghế thường đều bị chặn; cần kiểm bát nhang treo và che khuất sau cửa.                                      |
| 19  | Đêm không ngủ - Quỷ nhập tràng kỳ truyện                                | Có người tang, mèo, vải, phản/giường. Vải phủ thi thể và phủ gương cần quan hệ ghép, probe vải trên giường bị chặn.                                                                       |
| 20  | Bùa chú An Giang - Thư ếm kỳ truyện                                     | Có chum, heo, nồi, thầy pháp và hũ tóc. Nồi trên bếp tạo được lựa chọn; đĩa chung chưa có nội dung đỏ như ảnh.                                                                            |
| 21  | Chú thuật phản phệ - Thiên Linh Cái Kỳ Truyện                           | Có cân, sọ và nhân vật. Cân đặt bàn tạo được lựa chọn; bát chung chưa có nội dung đỏ như ảnh; cảnh nhiều người cần bố cục riêng.                                                          |
| 22  | Chuyến đi làm thuê trên bản - Ma xó Kỳ Truyện                           | Có bát, nhà sàn, tủ và chăn. Mười bát tạo được lựa chọn nhưng nhiều chiếc chồng nhau; tủ mở và chăn phủ chưa được xác nhận.                                                               |

## Các nhóm cần đối ứng

### A01 — P1 / asset_missing

Không tìm thấy hình rời tương ứng trong hai gói hoạt động; đã so khóa, tên, mô tả, nhãn và danh mục toàn bộ món. Cần bổ sung theo mức quan trọng của truyện, không tự thay bằng món khác.

Video: 6, 7, 11, 13, 17.

### M01 — P0 / metadata_layout

Có hình võng, nhưng chỉ có điểm ngồi và đứng bên cạnh; giới hạn interior. Chưa có điểm nằm, liên kết trẻ-người chăm và cấu hình võng ngoài rừng. Không cần mô phỏng động tác khiêng.

Video: 2, 4.

### M02 — P0 / metadata_layout

Các món tồn tại và qua kiểm cấu trúc; các phép thử kết hợp vẫn bị search_limit/support. Đây là bằng chứng tổ hợp hiện chưa chạy được, chưa đủ để nói thiếu hình hoặc tăng giới hạn tìm kiếm sẽ sửa được.

Video: 1, 3, 8, 11, 12, 17, 18, 19.

### M03 — P0 / metadata_layout

Nhà sàn/thang có hình; điểm đứng trên sàn cao của nhà chưa được biểu diễn rõ. support=daybed có thể chọn cả điểm dưới lẫn trên, nên có lựa chọn không đồng nghĩa giữ quan hệ cao-thấp.

Video: 6, 9, 18.

### V01 — P0 / visual_composition

Ảnh tĩnh từ bộ dựng cho thấy cắt người ở mép, chồng người/món, xẻng lớn và nhiều bát chồng nhau; lựa chọn hợp lệ về dữ liệu chưa đủ chứng minh hình đạt. Các ảnh là phép thử tổng hợp, không phải lỗi được quan sát trong mọi dự án thật.

Video: 1, 7, 8, 15, 16, 21, 22.

### S01 — P1 / state_relation

Cần kiểm/tạo biến thể trạng thái và quan hệ: cửa/tủ hé, che khuất, vải phủ thân/gương, người dưới mặt nước, bát treo, đồ đỏ bên trong bát/đĩa, gương phản chiếu đúng cảnh. Không lấy khóa chung làm bằng chứng đã có trạng thái.

Video: 7, 13, 14, 18, 19, 20, 21, 22.

### R01 — P2 / needs_verification

Bát nước đất đã có, cần kiểm tỷ lệ và điểm chứa trẻ trước khi kết luận thiếu chậu. SVG muddy_footprints có bốn vòng tròn ngón ở một dấu chân: không được báo thiếu dấu bốn ngón chỉ vì thiếu khóa four_toed_footprint. Chi tiết vật sắc ở nguồn 16 cần ảnh rõ hơn.

Video: 8, 15, 16.

### O01 — P2 / simplifiable

Động tác khiêng võng, bế/trao trẻ, leo thang, cưỡi hổ hoặc mở tủ có thể dùng hình tĩnh trước/sau hành động khi không đổi tình tiết. Nếu bản thân tư thế/đồ vật là manh mối thì phải giữ đúng hình và quan hệ đó.

Video: 2, 8, 15, 18, 22.

## Thứ tự xử lý đề xuất

1. Chốt bộ nhu cầu hình minh họa tĩnh: đúng người, nơi, vật chứng và quan hệ quan trọng. Động tác phụ dùng hình đứng/bố cục trước-sau; không bắt mô phỏng chuyển động.
2. Sửa hợp đồng điểm đặt của món đã có: loại điểm, fixture, quan hệ trên/dưới/trong/bên cạnh, groundY, môi trường cho phép, vai trong bố cục, số người/số vật. Không xóa giới hạn môi trường một cách đại trà.
3. Tái hiện từng probe bị chặn và truy nguyên lựa chọn nền, lọc mảnh, slot, điểm tiếp xúc và bước tìm tổ hợp. search_limit là kết quả chẩn đoán hiện tại, chưa chứng minh nguyên nhân chỉ là giới hạn quá thấp.
4. Duyệt ảnh tĩnh sau khi ghép: đủ người trong khung, không che mất vật chứng/số lượng, đúng tỷ lệ, đúng mặt đỡ và lớp che. Không dùng “đã có choice” làm điều kiện hình đạt.
5. Bổ sung 7 loại món đã xác nhận thiếu cho cả hai gói, rồi thêm trạng thái cần thiết dưới dạng biến thể/lớp ghép dùng lại. Không tạo hàng loạt động tác phức tạp.
6. Mở rộng sổ đối chiếu theo từng cảnh/thoại còn chưa kiểm. Chỉ đánh dấu đủ một nhu cầu khi có nguồn → asset ID → bố cục cố định → ảnh ghép đã duyệt ở cả hai gói.

## Bằng chứng và cách đọc

- [Báo cáo ảnh, mốc nguồn và kết quả từng phép thử](index.html).
- [Sổ quan sát](observations.json): mốc nguồn/khóa ứng viên; gap là ứng viên thiếu, review là cần kiểm trạng thái. Dùng findings để đọc kết luận đã xác minh.
- [Kết quả máy và duyệt hình](audit.json): asset ID, diagnostics, frame và visualReview. choices_generated chỉ xác nhận bộ chọn tạo được dữ liệu.
- [Món vải, bát và dấu chân thực có](evidence/asset-details.jpg): bốn chấm ngón đã có; vải/chăn hiện giống miếng vải gấp; đĩa/bát chung không chứa màu đỏ như ảnh nguồn.
- Ảnh geometry là bộ dựng thật chạy offline với đầu vào tổng hợp. Dùng để tái hiện rủi ro, không khẳng định mọi cảnh của dự án thật đều có cùng lỗi.

Chạy lại kiểm offline: `node --import tsx scripts/audit-motion-reference-coverage.ts`. Báo cáo Markdown/HTML có phần duyệt tay; nếu cập nhật kết quả phải duyệt lại hình thay vì giữ kết luận cũ.
