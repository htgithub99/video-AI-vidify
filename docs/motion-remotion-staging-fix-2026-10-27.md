# Sửa bố trí cảnh Remotion — 27/10/2026

## Phạm vi

Áp dụng các nhóm nguyên nhân trong `motion-remotion-scene-audit-2026-10-27.md`. Sửa luồng dùng chung cho dự án sau; giữ chế độ kho, các bản sửa reset lượt mới, thông báo lỗi và phần nhạc đang có. Không chạy tạo video, AI trực tuyến hoặc TTS để kiểm thử. Không sửa dữ liệu sản xuất thành trạng thái thành công.

## Đã triển khai

| Nhóm | Cách xử lý |
| --- | --- |
| Người treo trên cửa/cổng | Tách độ sâu khỏi độ cao: người đứng sau, trong hay cạnh kiến trúc vẫn đặt chân trên mặt đất. Người sau cửa được đặt lệch mép cửa để tránh cửa đặc che kín. Lớp nền sàn nằm dưới người. |
| Cổng thành thanh ngang, bàn dẹt | Chọn vùng riêng cho cửa/cổng/cửa sổ; giới hạn socket thay vì dùng cả tường. Chỉ fixture nhận tỷ lệ socket; bàn/ghế trên sàn giữ tỷ lệ tự nhiên. |
| Vị trí đồ đạc thay đổi | Lưu điểm ngang theo objectId và địa điểm. Không dàn bàn ghế theo số người có mặt. Thiết kế prop không phụ thuộc câu mô tả động tác hoặc tỷ lệ toàn sàn. |
| Người cầm chổi xuyên suốt | Tách ngoại hình gốc khỏi cụm cầm/mang đồ. Base character đứng trung tính, tay trống. Đồ cầm có node riêng. |
| Bàn chứa sẵn bát, bát chứa lẫn nhang | Mô tả asset chỉ giữ chủ thể; truyền danh sách chủ thể con phải loại trừ và quy tắc lớp độc lập. Thay riêng cache cũ có dấu hiệu ghép lẫn, giữ bản gốc trong invalidAssets. Đây là kiểm dựa vào metadata, không phải bộ nhận diện mọi nội dung SVG bằng thị giác. |
| Trẻ cao bằng người lớn, ma khác người gốc | Truyền tuổi vào layout, giảm cả chiều cao và giới hạn chiều rộng của trẻ. appearanceOf dùng SVG người gốc làm tham chiếu; nhận diện thêm các thay đổi như mặt lem tro, da xám. |
| Đèn dưới đất, người nằm xa chiếu | Suy ra quan hệ khi chỉ có một vật đỡ phù hợp, bằng tiếng Việt hoặc tiếng Anh. Trường hợp mơ hồ không tự chọn một vật bất kỳ. Chiếu phẳng có điểm mặt đỡ hình học khi ảnh cũ thiếu anchor. |
| Vật vừa ở tay vừa ở bàn | Khi pose và người giữ xác định rõ, chuẩn hóa heldBy; bằng chứng nguồn về cầm/nhận/mang được đưa vào stateEvidence để continuity không kéo vật trở lại vị trí cũ. Khi chưa đủ thông tin, giữ quan hệ có cấu trúc và bỏ mô tả động tác mâu thuẫn. |
| Che người/manh mối, cắt đầu khi zoom | Dàn lại người và vật phụ thuộc để giảm chồng mặt/che manh mối. Dàn các prop trên cùng mặt bàn. Focus và nguồn hiệu ứng cốt lõi được bảo vệ. Camera tính theo bounds nhìn thấy và giữ toàn bộ nhân vật/chủ thể quan trọng trong khung. Các quy tắc này chạy cả khi tắt review ảnh. |
| Khói bị vẽ hai lần hoặc sai nguồn | Chuyển node khói độc lập sang hiệu ứng của bát/nhang/đèn xác định được. Giữ chiều là đà/tụt xuống theo lời kể; không dùng cột SVG khói làm nguồn vật lý. Ảnh nguồn thiếu emitter sẽ được bổ sung metadata khi dựng bình thường. |
| Thiếu đám cô hồn | Nếu câu hiện tại nói rõ có nhóm cô hồn, thêm một lớp bóng người nền đơn giản, không tạo danh tính nhân vật mới. SVG lớp này dựng bằng code, không phát sinh lượt AI. Không thêm khi câu nói không có đám đông. |
| Các cảnh sau bị bỏ dở | Phục hồi và lưu tiến độ từng cảnh trong cùng đoạn. Một cảnh hỏng không ngăn các cảnh độc lập tiếp theo dựng tài nguyên. CAPTCHA, hủy và lỗi AI kết thúc luồng vẫn phải dừng đúng. |
| Mâu thuẫn sự kiện | Bổ sung sổ sự kiện gọn, tối đa 3.200 ký tự dữ liệu, cho prompt viết, sửa một phần và phân cảnh. Khi chia chương thành nhiều phần vẫn giữ các đoạn trước chương. Giữ topic.id trong hồ sơ truyện dân gian thu gọn. Đây là ngữ cảnh phòng sai cho AI; chưa phải bộ chứng minh mọi quan hệ nhân quả trong văn bản. |
| Tên bước gây hiểu nhầm dùng kho | Đổi tên giai đoạn chung thành “Dựng cảnh minh họa” và bổ sung phân loại log tương ứng. |

## Cache và dự án cũ

- Dùng stagingRevision riêng; không tăng đồng loạt revision SVG/nền để buộc vẽ lại mọi ảnh.
- Dự án chưa qua luồng staging mới cần dựng cập nhật trước khi xuất; không coi cache cũ là bản dựng mới đã đạt.
- Ảnh người chứa vật cầm, ảnh prop ghép lẫn, prop support từng ép theo sàn và cổng có tỷ lệ thanh ngang được thay riêng khi người dùng dựng tiếp. Các ảnh còn phù hợp được giữ.
- MP4 đã xuất không tự thay đổi. Bộ ảnh kiểm chứng vẫn dùng ảnh cũ nên vẫn thấy chổi, cổng ngang và bàn đã bị vẽ dẹt; các vấn đề nằm trong pixel này cần bước thay asset, không thể xóa chỉ bằng tọa độ.
- Bản sửa không tự tiếp tục hoặc tạo lượt sản xuất mới.

## Kiểm chứng

- TypeScript: `tsc --noEmit`.
- Bộ Remotion có mock: sửa từng phần, dùng lại checkpoint, migration riêng một ảnh lỗi, giữ nguyên ảnh hợp lệ, review bật/tắt, an toàn SVG, cutout.
- Bộ staging mới: điểm đất/độ sâu, tỷ lệ trẻ/biến thể ma, vị trí bàn ổn định, quan hệ tay/vật đỡ, camera sau crop qua bốn tỷ lệ hình, dàn đồ trên bàn, người không bị cửa che kín, khói có nguồn, nhóm bóng nền, sổ sự kiện, SVG cha và cảnh sau vẫn được dựng khi cảnh trước lỗi.
- Kiểm hình học từ job đã lưu: 21 cảnh, 18 cảnh đủ ảnh qua bốn tỷ lệ khung; 3 cảnh thiếu ảnh sẵn từ lượt cũ. Không sửa file nguồn.
- Đã dựng và nhìn ảnh tĩnh của 18 cảnh; dựng kiểm lại riêng 06, 11, 12, 18 sau khi sửa che khuất. Các ảnh này chứng minh thay đổi bố trí, không chứng minh các asset cũ đã được AI vẽ lại.
- Bộ hành vi hình/hiệu ứng, log, biên kịch và truyện dân gian được chạy offline. Không tạo MP4 thử, không gọi AI/TTS thật.

Ảnh kiểm toàn cảnh: `scratch/remotion-staging-after-20261027/`. Ảnh kiểm cuối bốn cảnh trọng tâm: `scratch/remotion-staging-focused-20261027/`. Các file JSON sản xuất vẫn giữ nguyên.

## Giới hạn cần giữ rõ

Các mô tả vị trí mơ hồ, nội dung AI tự vẽ lẫn dù prompt đã loại trừ, hoặc mâu thuẫn truyện tinh tế vẫn cần review ảnh/biên tập khi kiểm chất lượng thực tế. Chưa có lượt dựng mới bằng AI sau bản sửa này nên không tuyên bố mọi ảnh mới chắc chắn đạt hoặc mọi lần tạo video đều thành công. Không tăng QA cho khác biệt đứng/ngồi hoặc động tác phụ.
