# Sửa rủi ro ba kiểu hình Remotion — 31/10/2026

## Phạm vi

Áp dụng chung cho các video dùng Remotion. Định nghĩa Truyện ma, Lịch sử và Giải thích vẫn nằm trong thư mục riêng. Giữ một lượt thiết kế/vẽ ban đầu cho mỗi cảnh; tùy chọn AI duyệt ảnh và cơ chế bỏ qua rồi phục hồi cảnh lỗi được giữ. Kho tài nguyên dùng luồng hiện có.

## Các thay đổi

- Chia ứng viên dựng theo `locationKey/place/beatId`, tạo tham chiếu cho từng địa điểm. Kiểm tra lại địa điểm ngay trước khi dùng tham chiếu. Khi cảnh neo lỗi, thử cảnh còn lại của cùng địa điểm; lỗi vẫn được phục hồi sau lượt đầu.
- Chặn transform ở nhóm con chứa thân/chân/điểm tiếp xúc; cho phép nhóm cục bộ phù hợp như tay, mắt, miệng và chi tiết thở độc lập. Không tự thêm chuyển động khi không có nhóm an toàn.
- Hiệu ứng có `effectKind/sourceId`, truyền cả khai báo hiệu ứng sang lượt vẽ và sửa. Nhận diện các biến thể từ như raindrops/flickering fire; bỏ track tĩnh vô ích trước khi thêm chuyển động dự phòng. Khói/hơi/sương có dịch chuyển nhẹ, giữ độ trong suốt gốc. Không tự vẽ hiệu ứng thiếu hoặc di chuyển cả vật phát hiệu ứng.
- Bộ làm mềm chỉ xử lý loại hiệu ứng được chính profile cho phép; không đổi thứ tự DOM. Giải thích không tự thêm blur; highlight luôn giữ sắc nét.
- AI duyệt nhận tối đa hai khung hình tại thời điểm khác 0 trong cùng một request nếu có chuyển động. Preview dùng cho duyệt được kéo dài đủ xem chuyển động, tối đa 8 giây; không sửa thời lượng preview lưu hoặc video. Duyệt tắt không chụp ảnh/gọi AI duyệt.
- Lượt sửa giữ cast, era, place, identityContrast, identityReferences, renderBehavior, effects, nhóm nhân vật và mẫu tư thế đúng profile. Bỏ bản sao cảnh trước và mẫu đứng không liên quan.
- Thêm mẫu nằm/ngồi xổm cho Lịch sử; bổ sung mẫu ngồi/quỳ/nằm/ngồi xổm riêng cho Truyện ma và Giải thích. Mỗi loại tư thế lặp lại chỉ gửi một mẫu, tối đa hai SVG mẫu trong một cảnh. Đồ dùng, trang phục và nhận dạng vẫn theo nguồn. Bỏ hướng dẫn Giải thích chỉ đổi chân mà giữ giày đứng.
- Dạng khung hiện tại (`format`) được lập riêng và đưa vào cache/so sánh phân cảnh; không chọn mẫu map/timeline theo dạng của cảnh trước.
- Tóc dự phòng theo khóa nhân vật độc lập với thứ tự cast; tóc đã có trong nguồn được giữ.
- Lịch sử có kế hoạch đám đông theo phe và lớp gần–xa. Một nhóm quân là một node vô danh, không một node cho mỗi lính; `crowd` giữ groupKey, faction, appearance, depth, rows, facing và count nếu nguồn nêu số cụ thể. Dựng lính xa bằng các hình nhỏ lặp trực tiếp trong SVG, giữ đầu/áo/khiên rõ, giảm chi tiết xa, tách nhân vật chính. Dáng đứng yên của đội quân xa vẫn hợp lệ; không trượt cả đội để giả hành quân.

## Kiểm chứng

- `npm run test:motion-profile-risks`: lỗi nhóm con, loại hiệu ứng, highlight và thứ tự lớp, mẫu tư thế/sửa theo profile, tóc ổn định, 80 người thuộc hai nhóm không vượt node, cache format/nhóm, và tích hợp bốn cảnh/hai địa điểm cho cả ba profile; kiểm provider, số request và dọn ảnh duyệt.
- `npm run test:motion-profile-isolation`: tách dependency, cấu hình và prompt; luồng vẽ một lượt, phục hồi, export guard và prompt transport.
- Mẫu SVG tư thế được render bằng Chromium độc lập tại `scratch/motion-profile-risk-fixes-20261031/index.html`; đây là mẫu hướng dẫn cấu trúc, không phải hình AI vừa sinh.

## Giới hạn

Các kiểm tra trên không thay thế đánh giá cảnh AI thực tế. Prompt và cấu trúc nhóm giảm lỗi nhưng không bảo đảm AI vẽ đúng mọi nhân vật hay mọi request. Không tăng QA thẩm mỹ thành điều kiện chặn xuất. Video MP4 đã xuất không tự thay đổi; cảnh cần dựng lại mới dùng prompt mới. Revision mới: Truyện ma 19, Lịch sử 20, Giải thích 10.

## Cấu trúc nhân vật Lịch sử theo ảnh người dùng

- Sửa mâu thuẫn giữa lời hướng dẫn mắt nhỏ và mẫu SVG chứa hai vòng trắng lớn: mẫu trung tính nay dùng mắt nhỏ màu tối, mí trên rõ và miệng một nét. Mắt khép vẫn hợp lệ; mắt trắng mở lớn dành cho biểu cảm kinh ngạc rõ trong truyện.
- Mặt rộng, cằm bo, đầu lớn trên thân gọn và chân ngắn. Tỷ lệ 2.3–2.5 chiều cao đầu trần là hướng dẫn dựng hình gần ảnh mẫu, không phải phép đo chính xác ảnh hoặc điều kiện QA.
- Rút chân mẫu đứng: phần lộ từ gấu áo tới đế giày giảm từ 65 xuống 35 đơn vị, trong khi đầu giữ 106.76 đơn vị theo SVG getBBox. Tỷ lệ từ 0.61 xuống 0.33 chiều cao đầu; đế vẫn nằm trên nền. Rút cẳng chân mẫu ngồi và chân ghế tương ứng, giữ tiếp xúc giày/nền và hông/ghế. Đây là số đo mẫu kỹ thuật, không phải QA chặn ảnh AI.
- Mẫu đầu riêng trong thư mục Lịch sử được tái sử dụng cho đứng, ngồi, quỳ, nằm, ngồi xổm và cưỡi ngựa. Tóc, mũ, râu, trang phục, phụ kiện và thời đại theo nguồn; không cố định nhân vật thành lính cổ đại.
- Cập nhật lại năm prompt Lịch sử trong bộ 11 prompt. Kiểm tra hash xác nhận 12 file TXT/context của Truyện ma và Giải thích không đổi.
- Trang đối chiếu: `scratch/history-character-structure-20261031/index.html`. Hình trong trang là mẫu SVG kỹ thuật, chưa phải cảnh AI mới sinh.

## Cấu trúc Truyện ma theo ảnh người dùng

- Đưa mặt nạ và mẫu đứng vào `horror/characters.ts`; prompt, cảnh mẫu và mẫu ngồi/quỳ/nằm dùng chung cấu trúc mặt. Đầu tròn trắng, hai mắt oval đen lớn gần nhau, miệng oval nhỏ, viền đen; không cổ, tai, mũi, đồng tử hoặc chân theo kiểu Lịch sử. Tóc/mũ theo nguồn là các mảng phẳng quanh/sau mặt nạ.
- Tay nghỉ là các nét cong trơn cùng màu áo; nụ tay ngắn vẫn được phép khi phù hợp tư thế. Bỏ tay giơ mặc định trong cảnh mẫu; chỉ giơ tay khi nguồn yêu cầu. Quần áo, phụ kiện, người và bối cảnh theo truyện.
- Ảnh người dùng là khung cắt thân dưới; không suy ra tỷ lệ toàn thân từ phần bị cắt. Hai-shot/bust có thể cắt phần áo phía dưới theo khung, giữ nguyên tỷ lệ nhân vật.
- Cập nhật ba prompt Truyện ma; hash xác nhận 16 file TXT/context Lịch sử và Giải thích không đổi. Trang đối chiếu SVG kỹ thuật: `scratch/horror-character-structure-20261031/index.html`. Chưa gọi AI sinh cảnh hoặc tạo video mới. Không thêm request hay QA chặn thẩm mỹ.

## Nhân vật Giải thích theo cấu trúc Lịch sử đã chốt

- Giải thích có mẫu đầu và cơ thể riêng: đầu lớn mặt rộng, mắt nhỏ màu tối, miệng một nét, thân gọn, bàn tay bo và chân ngắn; tỷ lệ người đứng 2.3–2.5 chiều cao đầu trần. Mẫu hiện tại có cùng hình học với Lịch sử nhưng không import từ thư mục Lịch sử; chỉnh hai bên độc lập.
- Trang phục, tóc, tuổi, sắc da và dụng cụ theo chủ đề. Sơ đồ giữ bảng màu giáo dục, nhãn, mũi tên và thứ tự nguyên nhân/kết quả; không bắt buộc thêm người hoặc bối cảnh lịch sử.
- Mẫu tư thế riêng cho ngồi ghế, ngồi đất, xếp bằng, quỳ một/hai gối, nằm và ngồi xổm. Phân biệt ngồi trên nền với ngồi ghế bằng support. Khi có mẫu tư thế, bỏ mẫu đứng dư khỏi prompt.
- Tham chiếu minh họa thực tế có nhân vật mới; so sánh/quy trình/bản đồ/timeline vẫn dùng mẫu sơ đồ phù hợp. Cập nhật ba prompt Giải thích và xác nhận hash 16 file TXT/context Truyện ma/Lịch sử không đổi.
- Trang đối chiếu: `scratch/explainer-character-structure-20261031/index.html`. Chromium xác nhận mẫu Lịch sử và Giải thích có cùng chiều cao đầu và tỷ lệ phần chân lộ, sáu SVG hợp lệ. Đây là mẫu kỹ thuật, chưa phải cảnh AI mới sinh; không tăng request hoặc QA thẩm mỹ.

## Cập nhật tư thế và bộ ba prompt theo yêu cầu mới

- Rút cả đùi và cẳng chân ở mẫu ngồi/quỳ Lịch sử và Giải thích; rút luôn đoạn chân gập, chân ghế và điều chỉnh vị trí chạm nền. Mỗi kiểu vẫn giữ file riêng.
- Theo yêu cầu mới của người dùng, dáng nằm dùng toàn bộ nhân vật đặt ngang bằng phép quay cứng và scale đều: giữ đầu, thân, cả hai tay và hai chân/giày nếu kiểu hình có chân. Truyện ma giữ nguyên mặt nạ, thân áo và tay; không tự thêm chân người. Không bóp thân hoặc thay người bằng mảng chăn. Chăn chỉ là lớp phủ riêng khi nguồn yêu cầu. Quy tắc này thay thế các hướng dẫn cũ cấm xoay nguyên nhân vật ở tư thế nằm.
- Đồng bộ prompt vẽ, mẫu tư thế, hướng dẫn sửa và bộ prompt cũ; không thêm request hoặc QA thẩm mỹ.
- Bộ mới mỗi kiểu hình một prompt đầy đủ: `scratch/compact-poses-prompts-20261031/prompts.html`, kèm `truyen-ma.txt`, `lich-su.txt`, `giai-thich.txt` và `ba-prompt.md`. Mỗi cảnh dùng ba người riêng ở ba tư thế nằm/quỳ/ngồi để thử; actor/camera cố định và hiệu ứng tắt để tập trung kiểm tra cấu trúc.
- Trang SVG kỹ thuật: `scratch/compact-poses-prompts-20261031/index.html`. Đã kiểm tra XML/ID và nút sao chép toàn bộ ba prompt bằng Chromium độc lập, không ghi clipboard hệ thống. Chưa gọi AI sinh cảnh.

## Ngoại hình theo cốt truyện cho cả ba kiểu hình

- Chỉ khóa cấu trúc hình và tỷ lệ. Tóc, râu, trang phục, màu áo, mũ, kính và phụ kiện theo nhân vật, vai trò, thời đại/chủ đề trong nguồn; chi tiết nguồn được ưu tiên hơn ví dụ SVG.
- Ví dụ đứng/ngồi/quỳ/nằm đều phải đổi sang ngoại hình nhân vật hiện tại, giữ nhất quán trong cùng truyện. Nhân vật truyện khác có thể khác hoàn toàn về ngoại hình. Không sao chép đồng phục hay kiểu tóc của mẫu.
- Truyện ma cho phép tóc/mũ nguồn dưới dạng mảng phẳng quanh hoặc sau mặt nạ, giữ cấu trúc mắt/miệng và tỷ lệ con rối. Bỏ lệnh cấm tóc toàn cục; không tự thêm tóc dự phòng khi nguồn chưa mô tả.
- Mỗi profile có quy tắc riêng; không thêm lượt AI hoặc QA thẩm mỹ.

## Điểm neo bố cục, cầm vật và quân nền

- Hợp đồng kỹ thuật chung quy định điểm neo local/canvas, transform trực tiếp trong SVG, group ngoài giữ vị trí và group trong mới chuyển động. Điểm neo ngồi là hông/mặt ghế; quỳ là gối/chiếu; đứng là chân/nền; nằm phải tính cả chiều dài và contour tựa giường/gối sau khi xoay nguyên người. Các phép toán là hướng dẫn AI trong cùng lượt vẽ, không tự bố trí lại SVG đã được chấp nhận.
- Mỗi poseConstruction mô tả không gian mẫu riêng; không bê background, nội thất hoặc tọa độ 640x500 của ví dụ vào cảnh 1280x720. Bỏ lặp toàn bộ quy tắc ngoại hình ở từng tư thế, giữ một bản trong artDirection.identity.
- Bỏ profile direction và danh mục layout tĩnh trùng trong context vẽ. Lịch sử bỏ ví dụ cảnh nền không liên quan khi mẫu đứng đã có trong rules; giữ ví dụ map/timeline, mẫu mounted và tham chiếu tùy chỉnh. Hợp nhất các phần output/animation thành một contract chung, giữ art direction riêng cho từng profile.
- Lịch sử có ví dụ tay chạm đúng cán vật, ví dụ quân nền có mắt, thân áo, chân/giày nối liền. Giáo tỷ lệ theo chính người cầm; không đặt toàn bộ giáo trong tọa độ canvas bên cạnh người đã scale. Cho phép khiên che thân, bàn che chân hoặc chăn che người khi truyện yêu cầu; bảo vệ mặt và điểm tiếp xúc quan trọng.
- Parser cảnh tự thay Unicode whitespace ngoài JSON string bằng khoảng trắng chuẩn. Giữ nguyên NBSP trong SVG, tên, lời thoại và escape; không thay parseJson toàn ứng dụng. Không thêm request hoặc gate thẩm mỹ.
- Tái tạo bộ ba prompt ngồi/quỳ/nằm, hai prompt quân đội theo ảnh và bộ 11 prompt cũ từ nguồn mới. Những bộ này là prompt thử; chưa chứng minh AI đã sinh cảnh mới đúng.
