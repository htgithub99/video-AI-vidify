# Bổ sung kho 2D và quy tắc đặt cảnh từ 22 video tham khảo

Ngày thực hiện: 22/10/2026. Kho đã được ghi trực tiếp tại `D:/video-AI-vidify/storage/output/motion-video/kit-library`.

## Phạm vi đã làm và giới hạn

Đã đối chiếu các cảnh mẫu trong danh sách 22 video của kênh [Khuất Mặt Kỳ Truyện](https://www.youtube.com/@khuatmatkytruyen), tạo thêm tài nguyên SVG nguyên bản và sửa đường dữ liệu READ → COMPOSE → layout → compile → engine. Đây là việc học loại tài nguyên và cách bố trí; không sao chép hình vẽ hay truyện của kênh.

**Chưa xem và chú giải hết thời lượng của cả 22 video.** Các quan sát bên dưới là mẫu ở nhiều đoạn, không phải danh sách đầy đủ mọi nhân vật, đạo cụ, hành động hoặc mọi ảnh của từng video. Một số lượt tua gặp quảng cáo hoặc khung hình chưa tải; những lượt đó không được dùng làm bằng chứng. Yêu cầu “toàn bộ mọi thứ trong 22 video” vì vậy chưa hoàn tất ở mức kiểm kê từng cảnh.

Đã cài 120 tệp tài nguyên mới từ **32 mẫu thiết kế**, áp dụng cho hai phong cách. Đã cập nhật 285 tài nguyên có sẵn về metadata hoặc sprite. Không phải 405 hình vẽ mới. Đã kiểm tra 40 ảnh tĩnh từ bộ máy render thật; chưa chạy một lượt sản xuất truyện hoàn chỉnh qua AI và TTS, chưa xuất video thử.

## Danh sách nguồn và điều đã quan sát

Tên bên dưới dùng để nhận diện video, không khẳng định là nguyên văn toàn bộ tiêu đề trên YouTube. Thời lượng là thông tin ghi nhận khi khảo sát.

| Video | Thời lượng | Cảnh/tài nguyên thấy trong mẫu | Quy tắc cần giữ |
|---|---:|---|---|
| [Khăn Piêu](https://www.youtube.com/watch?v=ZrgIi8a8dyA) | 38:14 | Đám đông quanh cột hội; đôi nam nữ cạnh sông/xe máy; người nấp sau bụi; bàn thấp, lửa, mưa | Trang phục riêng từng vai; người nấp bị bụi che; nhóm quanh vật có tâm bố cục |
| [Người con anh hùng](https://www.youtube.com/watch?v=FFTF1CM4aBI) | 42:57 | Sân, hiên nhà; lính đội mũ cối; rừng, nồi; mẹ và con ở nghĩa trang | Mũ thuộc đúng người; người nói quay về người nghe; nhân vật trẻ có tỷ lệ riêng |
| [Cuốn sổ nợ](https://www.youtube.com/watch?v=m9WhpDtE9xE) | 38:24 | Mẫu xác nhận ở 03:50: cửa hàng, quầy, tủ lạnh, hàng hóa, bàn thờ tường, người bán và hai khách | Người bán sau quầy; khách trước quầy; quầy che chân người phía sau. Phạm vi mẫu của video này còn ít |
| [Ván bài, phần 2](https://www.youtube.com/watch?v=P0xXIU5Lyr8) | 27:31 | Cửa nhà, chùa, sư, bàn thờ; hai người lớn trên giường và em bé trong nôi riêng | Giường và nôi là hai chỗ tựa riêng; em bé không dùng hình người lớn |
| [Ván bài, phần 1](https://www.youtube.com/watch?v=nk48rQqJmc0) | 30:34 | Mẫu 03:03 và 09:10: ông, trẻ, bài, phòng/lịch; mặt ma trên nước | Đạo cụ thuộc đúng người; ảnh chèn và toàn cảnh có mục đích khác nhau. Chưa đủ mẫu để kiểm kê cả video |
| [Ác giả ác báo](https://www.youtube.com/watch?v=xS4lEGgdVCQ) | 34:14 | Giường, dụng cụ trên gối; người dưới xà; bàn tiền; người quay lưng ở bàn đêm | Dụng cụ đặt trên gối không tự chuyển vào tay; hướng vật khác với tư thế người |
| [Người mới trọ cũ](https://www.youtube.com/watch?v=1MBYdq1F-hE) | 37:19 | Bóng trên giường, điện thoại, lửa xanh; bàn ăn/căng tin | Tách bóng, người và vật cầm; đồ đặt trên bàn có điểm mặt bàn |
| [Tình mẹ](https://www.youtube.com/watch?v=U_2hRTsJ3So) | 37:33 | Người giơ tay ở cửa; cầu/chòi trên nước; đèn dầu, hội thoại | Tư thế theo câu kể. Có mẫu hình nằm trong khi lời kể nói ngồi: không học lại sai lệch đó |
| [Én ơi](https://www.youtube.com/watch?v=5tEEkZaXW3U) | 34:14 | Nhà sàn, bếp, chiếu, giỏ treo; thang; mộ; hai người nằm trên chiếu | Sàn/chiếu và ghế là loại chỗ tựa khác nhau; đồ treo không nằm dưới đất |
| [Chén cơm đất](https://www.youtube.com/watch?v=tUWV2SqMrpg) | 28:05 | Tay đưa thìa; tre; mặt ma; tủ | Động tác tay độc lập với tư thế thân; cận cảnh không thay toàn cảnh tương tác cần nhiều người |
| [Trả nợ](https://www.youtube.com/watch?v=XYjyI0EQ7tk) | 25:39 | Giường, bàn thờ, đồ chơi; tủ; rương mở có sổ; dép xanh | Vật trong rương phải ở lòng rương; dép có hình và màu riêng |
| [Heo 5 móng](https://www.youtube.com/watch?v=2ygTaMHUri0) | 24:08 | Chuồng, máng; sách mở; cha/con ở bàn thờ; chòi đêm | Sách mở khác sách đóng; máng là món bối cảnh; người có tỷ lệ tuổi khác nhau |
| [Thần trùng](https://www.youtube.com/watch?v=-Hb-Tn7OaHo) | 20:58 | Mẫu 02:05, 06:17, 10:29, 14:40, 18:52: chùa/quầy; giường; thầy cúng quay lưng trước người nằm; vòng pháp, đèn | Thầy đứng, người khác nằm; vòng pháp thuộc mặt sàn; giữ hướng nhìn |
| [Ma da](https://www.youtube.com/watch?v=vy7G-ATxNnM) | 20:41 | Bến, sông, thuyền; cận cổ chân; bóng dưới nước | Thuyền chỉ dùng ngoài trời phù hợp. Có mẫu đưa thuyền vào phòng: không học lại lỗi ngữ nghĩa đó |
| [Ma trành](https://www.youtube.com/watch?v=HSUbahCf3nU) | 18:25 | Nhà/gốc cây; hình nhân, hổ giấy, chỉ đỏ; rìu ở thân cây | Vật buộc và vật bị tác động cần quan hệ tiếp xúc, không chỉ một tọa độ gần nhau |
| [Con ranh](https://www.youtube.com/watch?v=Y_6PRdEk4Rk) | 12:07 | Mẫu 01:12, 03:37, 07:15, 10:53: người cạnh giường, đường tre ban đêm, nắm cổ tay, cửa/đèn dầu | Nắm cổ tay cần cơ chế tiếp xúc riêng; hiện chưa bảo đảm chính xác bàn tay |
| [Cắt tiền duyên](https://www.youtube.com/watch?v=brNfRbyVX0M) | 20:25 | Hai người lúc chạng vạng; tay cầm điện thoại; cửa sau/thang; khoanh tay | Vật cầm thuộc một người; cần giữ biểu cảm và cử chỉ riêng |
| [Phí Phông](https://www.youtube.com/watch?v=P3SOdALyYnA) | 16:59 | Giáo viên, bảng, bàn học; hồ, gốc cây, làng đêm | Giáo viên và học sinh có chỗ riêng; người ngồi phải có chỗ tựa ngồi |
| [Quỷ nhập tràng](https://www.youtube.com/watch?v=Cyak0swNZEo) | 15:11 | Dây lễ, dao, đinh; mưa; người nằm và người đứng cạnh quan tài; buộc chân | Giữ tư thế từng người; buộc hai chân cần mô hình tiếp xúc nhiều điểm |
| [Thư ếm](https://www.youtube.com/watch?v=wtR75Nr2Whc) | 14:38 | Người đội mũ, vật sát mặt; mép nước; người quấn khăn, đèn; thầy/cối; lọ tóc nút đỏ | Phân biệt vật đội, vật cầm và vật đặt; cối có chày; lọ tóc có đặc trưng riêng |
| [Thiên Linh Cái](https://www.youtube.com/watch?v=mmg9idL64rQ) | 13:46 | Bát trên bàn lễ; thang gác; người phụ nữ/bóng; cận bát/đầu | Bàn có bề mặt đặt bát; thang nối lên ô gác; bóng là trạng thái thị giác riêng |
| [Ma xó](https://www.youtube.com/watch?v=y9UmyNlC_g0) | 12:04 | Mẫu 01:12, 03:37, 07:14, 10:51: người ở cửa; hai người sau bàn/bát nóng; tủ có hốc tối/bát cơm | Bàn che phần thân phía sau; khói phát từ bát; hốc tối gắn với tủ |

## Tài nguyên đã cài

| Nhóm | Mẫu mới | Số tệp mới | Nội dung |
|---|---:|---:|---|
| Nhân vật mẫu | 8 | 16 | Lính, thợ mộc, người chèo đò, giáo viên, bà đỡ, em bé, thanh niên vùng cao, cô gái đi hội |
| Đạo cụ | 14 | 28 | Sách mở, dép xanh, mái chèo, đinh, chỉ đỏ, chỉ đỏ đứt, lọ tóc, cối/chày, đục, hổ giấy, vòng pháp, chiếu, mũ cối, gối |
| Món ghép bối cảnh | 6 | 12 | Nôi, rương mở, thang gác, thuyền, máng ăn, bụi che người |
| Bối cảnh hoàn chỉnh | 4 | 64 | Phòng có nôi, gian gác/rương, bến sông có thuyền, phòng giường làm lễ; mỗi mẫu có 4 biến thể × ngày/đêm × 2 phong cách |
| Tổng | 32 | 120 | Hai phong cách `minimal_mask` và `chibi_folk` |

285 cập nhật cũ gồm 146 món ghép được bổ sung môi trường/điểm đặt, 112 bối cảnh giữ nguyên SVG được bổ sung metadata điểm nằm, và 27 nhân vật seed chibi được sửa dáng ngồi, quỳ và metadata sprite. Không thay hình của bối cảnh cũ; không thay đầu hoặc thân của nhân vật tùy chỉnh. Sprite tùy chỉnh không có thông số khớp được giữ cách hiển thị cũ.

Tổng kho sau khi cài: 629 bối cảnh, 215 đạo cụ, 86 bộ nhân vật, 161 món ghép, 40 khuôn cảnh. Đây gồm cả dữ liệu có sẵn trước lần làm này, không phải toàn bộ đều được học từ 22 video.

Manifest cài đặt và mã băm: `D:/video-AI-vidify/scratch/reference-expansion/installed.json`. Đã đọc lại và xác minh SHA-256 cho đủ 405 tệp đã ghi. Bản sao 285 tệp cũ ở `D:/video-AI-vidify/scratch/reference-expansion/backup-20261022T064413Z`.

## Quy tắc đã sửa trong chức năng video motion

1. READ giữ `states` riêng cho từng người: hành động, cử chỉ tay, chỗ tựa và đối tượng nhìn. Câu “A đứng cạnh B nằm” giữ A đứng và B nằm.
2. Cử chỉ `read`, `row`, `feed`, `cradle`, `give`, `hold`, `pray` đi cùng tư thế thân. Ngồi đọc sách không tự đổi thành đứng cầm sách. Các cử chỉ là dáng tay minh họa, chưa phải mô phỏng tiếp xúc hoặc chuyển động cơ thể đầy đủ.
3. READ giữ tới 6 đồ vật cụ thể cùng lúc; mỗi vật có chủ sở hữu. Mũ của A bị loại khỏi B kể cả khi COMPOSE trả sai. Vật đặt trên gối bị loại khỏi tay kể cả khi COMPOSE gắn nhầm vào tay.
4. Trường `propMount` giữ cách đặt của từng lần xuất hiện. Cùng hình cái đục có thể dùng khi cầm trên tay hoặc nằm trên gối; metadata mặc định trong kho không được ghi đè ý nghĩa của câu kể.
5. `support` chọn điểm cùng loại tư thế; nhiều người dùng cùng loại chỗ tựa được phân bổ vào các điểm riêng. Nếu thiếu điểm phù hợp thì báo thiếu, không âm thầm cho ngồi/nằm sai chỗ.
6. `seatY` là độ cao mặt ngồi; `groundY` là độ sâu phối cảnh của chỗ tựa; `face` giữ hướng nằm theo giường, kể cả sau khi lật cảnh. Điểm đặt và mặt đồ vật di chuyển cùng nhau khi ghép/lật.
7. COMPOSE và quy tắc đổi góc máy liên tiếp giữ đủ người trong hành động đồng thời có ràng buộc chỗ tựa/đích nhìn. Không cắt còn một khuôn mặt rồi làm mất người nằm.
8. Đồ phụ đi qua compile, chọn tài nguyên và renderer; đặt trên các điểm surface/open/hang và tham gia thứ tự lớp vẽ. Bụi/nôi/thuyền che người theo độ sâu.
9. Món bối cảnh có `environment`. Bộ ghép cảnh loại thuyền ngoài trời khỏi phòng ngủ. Cache bối cảnh/series được kiểm lại các món cần thiết trước khi dùng lại.
10. Áo gắn ở thân, khăn ở cổ, mũ ở đầu. `removeWear` cho phép bỏ món đã cởi; quyền sở hữu được giữ theo người.
11. Sprite seed có `rig` hiệu chỉnh vị trí đầu/tay để còn hiển thị biểu cảm, vật cầm, vật đội trong tư thế ngồi/quỳ. Dáng ngồi/quỳ seed được vẽ lại đầu gối, không chỉ ép thấp dáng đứng. Không áp thông số seed này lên sprite tùy chỉnh không có `rig`.

Ví dụ trạng thái dựng cảnh:

```json
{
  "states": [
    { "char": "a", "action": "stand", "support": "bed_head", "target": "b" },
    { "char": "b", "action": "lie", "support": "bed" }
  ],
  "objects": [
    { "word": "cái đục", "key": "wooden_chisel", "size": 0.3, "type": "tool", "mount": "table", "rotation": 90, "owner": null }
  ]
}
```

## Kiểm chứng

Chạy `node_modules/.bin/tsx scripts/verify-motion-blocking.ts` sau khi cài kho. Script đọc tài nguyên từ **kho chính**, mock phản hồi AI để đưa cả phản hồi sai có chủ đích vào đường READ/COMPOSE thật, rồi dựng ảnh bằng renderer thật. Không gọi AI, TTS hoặc xuất video.

10 trường hợp × 2 phong cách × bật/tắt motion = 40 ảnh:

- A đứng cạnh B nằm, có đèn bên giường; phản hồi AI cố cắt chỉ còn A vẫn được sửa đủ hai người.
- Hai người ngồi trong thuyền, một người giữ mái chèo; kiểm tra cả khi hai người chỉ yêu cầu support chung `boat`.
- Em bé nằm trong nôi, người lớn đứng cạnh nôi.
- Chỉ A đội mũ; hai người ở hai điểm cố định quay về nhau.
- Sách trong rương; B cầm đèn pin ở chân thang.
- Người nấp sau bụi và người đứng cạnh bụi.
- Người ngồi đọc sách, người khác đứng cuối giường.
- Đục nằm ngang trên gối, không ở tay; kiểm tra cả khi hình đạo cụ trong kho có mặc định là cầm tay.
- Giường bị lật hướng; người nằm đổi hướng theo giường.
- Người quỳ đọc sách cạnh người nằm, giữ sprite quỳ và vật cầm.

Các kiểm tra dữ liệu bổ sung: giữ owner có khóa `a`/`b`; thiếu support phải báo lỗi; không sửa dữ liệu READ đầu vào; chuỗi khung liên tiếp không làm mất người; không ghép thuyền vào phòng ngủ. Kiểm tra môi trường yêu cầu phải có kế hoạch ghép thật, không bỏ qua khi danh sách rỗng.

Ảnh và dữ liệu từng ca: `D:/video-AI-vidify/scratch/reference-expansion/verification/`. Bảng ảnh: `contact-sheet.jpg`; dữ liệu: `report.json`.

Đã qua TypeScript `tsc --noEmit`, kiểm tra cú pháp engine/Node helper và `verify-motion-speech.ts`. Kiểm tra speech vẫn qua các trường hợp người kể, lời thoại, khoảng nghỉ, người ngoài khung, suy nghĩ, khung ngắn, cache và khung thứ hai. Bằng chứng lần chạy speech: `D:/video-AI-vidify/scratch/motion-speech-16624`.

## Tái tạo và cài bổ sung

Nguồn thiết kế thêm nằm ở `python_scripts/kit_seed/reference_expansion.py`; danh mục đăng ký tại các file `chars.py`, `pieces.py`, `scenes.py`, `spots.py`, `refprops.py` và `src/constants/motionPuppetSeed.ts`.

```powershell
python python_scripts/kit_seed/build_assets.py scratch/reference-expansion/staging
python python_scripts/kit_seed/export_pieces.py scratch/reference-expansion/pieces
python python_scripts/kit_seed/build_pieces.py scratch/reference-expansion/pieces scratch/reference-expansion/staging
python python_scripts/kit_seed/install_reference_expansion.py scratch/reference-expansion/staging storage/output/motion-video/kit-library scratch/reference-expansion
```

Lệnh cuối mặc định chỉ lập `planned.json`. Thêm `--apply` để ghi vào kho và sao lưu các tệp bị cập nhật. Bộ export dùng Node Playwright đang có trong repository, không cần cài Python Playwright. Có thể đặt `KIT_NODE` và `KIT_CHROMIUM` khi đường runtime khác máy này. Không chạy bộ build toàn kho trực tiếp vào kho đang dùng; installer chỉ chọn nhóm bổ sung và metadata tương thích.

## Phần còn thiếu trước khi gọi là làm đúng mọi thứ

- Chưa có bản kiểm kê theo từng cảnh/lời thoại cho hết cả 22 video. Chưa có số lượng đầy đủ các tư thế, cảnh và đạo cụ độc nhất của kênh.
- Chưa có bộ giải tiếp xúc nhiều điểm cho nắm cổ tay, bế người, buộc chân, đánh trúng một vị trí, đưa thìa vào miệng, người này đỡ cơ thể người kia. Đặt gần nhau hoặc có cử chỉ không tương đương với tiếp xúc chính xác.
- Chưa bảo đảm AI luôn đọc đúng chủ thể, phủ định, thời điểm và quan hệ. Prompt đã được bổ sung; bộ kiểm tra hiện dùng phản hồi có kiểm soát, không thay thế kiểm tra một lượt AI thật.
- Các món/bối cảnh tùy chỉnh chưa có điểm tựa đúng hoặc sprite chưa hiệu chỉnh vẫn cần bổ sung dữ liệu. Không có cách bảo đảm mọi hình tùy chỉnh đều có cùng tỷ lệ hình học với seed.
- Không tự sửa toàn bộ frame/spec đã cache hay video xuất trước đây. Cần cho chạy lại bước đọc/dựng các phân cảnh muốn áp dụng quy tắc mới. Code cần được tiến trình ứng dụng nạp lại; lần làm này không restart/deploy tiến trình đang chạy.

Khi mở rộng tiếp, thêm trường hợp kiểm chứng vào `scripts/motionBlockingVerificationTexts.ts`, dựng ảnh từ kho chính và nhìn lại ảnh trước khi kết luận. Không chỉ kiểm tra rằng key/spot trong JSON tồn tại.
