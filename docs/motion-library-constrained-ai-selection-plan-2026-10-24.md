# Kế hoạch để AI chọn đúng tài nguyên và bố cục trong kho

Ngày ghi nhận: 24/10/2026.

Trạng thái 24/10/2026: đã triển khai hợp đồng chọn mã cảnh cho hai gói, kiểm tự động và dựng ảnh engine. Xem [báo cáo triển khai](motion-library-constrained-ai-selection-implementation-2026-10-24.md) để phân biệt phần đã kiểm, phần kế thừa và giới hạn còn lại. Các mô tả hiện trạng trước triển khai bên dưới được giữ làm căn cứ thiết kế; không dùng chúng thay cho code mới.

## 1. Yêu cầu cần giải quyết

Người dùng đã có kho tài nguyên và muốn AI chỉ chọn trong kho, không đề xuất thứ nằm ngoài kho hoặc hiểu sai rồi chọn nhầm. Ưu tiên lớn nhất là nhân vật, bối cảnh và đồ vật đúng với lời kể, đúng vị trí và giữ nhất quán xuyên cảnh.

- Chọn gói nào thì dùng đúng gói đó: Tối giản mặt nạ (`minimal_mask`) hoặc Chibi màu dân gian (`chibi_folk`).
- Khi tạo video chỉ chọn hoặc ghép các tài nguyên đã có, không gọi AI vẽ bổ sung, không tự cài tài nguyên mới vào kho.
- Hình là minh họa tĩnh đơn giản như video mẫu Chiếc khăn Piêu – Bùa Yêu Kỳ Truyện. Không mở rộng thành mô phỏng mọi động tác chi tiết.
- Dùng tên kỹ thuật và mô tả tiếng Anh chuẩn cho AI; lời kể và giao diện vẫn dùng tiếng Việt.
- Sửa quy tắc chung để nhiều dự án dùng được, không vá theo tên người hoặc tình tiết của một truyện.

## 2. Quyết định kiến trúc

**Tool tạo các phương án cảnh có thể dựng được bằng kho trước; AI chỉ chọn trong các phương án ấy. Code chịu trách nhiệm hình học và vị trí.**

Không chỉ gửi danh mục dài rồi dặn AI “chỉ dùng trong kho”. Không chỉ đổi tên tài nguyên sang tiếng Anh. Hai việc đó hỗ trợ hiểu nghĩa nhưng không chứng minh tài nguyên được chọn có thể dùng chung trong một cảnh.

Luồng đề xuất:

```text
Kho đã kiểm hình và điểm đặt
→ Chốt nhân vật, đồ vật và địa điểm xuyên truyện
→ Trích sự việc cần minh họa từ lời kể
→ Tool tìm/ghép những phương án cảnh hợp lệ trong gói
→ AI chọn mã phương án và gán vai vào vị trí được phép
→ Code kiểm lựa chọn, đặt hình và dựng ảnh
→ Duyệt ảnh theo lời kể nếu bật cấu hình
→ Chốt khả năng minh họa trước khi tạo voice và render
```

## 3. Điểm xuất phát của code

Các kết luận dưới đây dựa trên đợt đọc code trước khi lưu kế hoạch. Khi bắt đầu triển khai cần đối chiếu lại thay đổi mới, không khôi phục mô tả lịch sử trong tài liệu cũ thành hiện trạng.

| Phần đã có | Khoảng trống cần đối ứng |
|---|---|
| `packPolicy.ts` khóa đúng gói, chặn vẽ/ghi tài nguyên và giữ snapshot có nguồn/hash | Chặn tạo hình mới chưa đồng nghĩa AI hiểu đúng và chọn đúng hình đang có |
| `packCatalog.ts` gửi khả năng của kho cho AI | Một số khả năng được gộp theo địa điểm hoặc nhóm: có giường, ghế, nằm, ngồi trong danh mục không chứng minh một biến thể cảnh đáp ứng đủ tổ hợp đó |
| Danh mục nhân vật có nhóm tuổi/giới/vai | Cần lựa chọn gắn với ID cụ thể, ngoại hình, trang phục và ảnh xem trước; nhóm chung chưa đủ phân biệt từng mẫu |
| `director.ts` chuẩn hóa vai, hành động, tư thế và chỗ tựa | READ vẫn có trường ngữ nghĩa tương đối tự do; địa điểm mới kèm mô tả có thể được nhận vào dữ liệu trước khi kiểm khả năng dựng |
| `pipelinePuppet.ts` kiểm trước âm thanh và có hai lượt sửa kế hoạch có giới hạn | Nhiều đề xuất chưa khả thi vẫn phát sinh trước, rồi mới phát hiện và yêu cầu sửa |
| Layout, blocking, visual contract, ghép cảnh và trạng thái fixture đã có | Cần nối thành một hợp đồng lựa chọn cảnh hoàn chỉnh, đã kiểm tương thích tài nguyên–tư thế–mặt đỡ–vị trí |

Giữ và tận dụng các cơ chế đang hoạt động. Không viết lại toàn bộ pipeline chỉ vì cần siết bước lựa chọn.

## 4. Chuẩn hóa kho theo khả năng thực tế

Mỗi hồ sơ cần có ID, gói, phiên bản, tên/mô tả tiếng Anh, từ đồng nghĩa Việt/Anh, ảnh xem trước và trạng thái đã kiểm. Các trường bổ sung sau đây là yêu cầu thiết kế, chưa khẳng định schema hiện tại đã có đủ.

| Loại | Thông tin cần kiểm chứng |
|---|---|
| Nhân vật | Ngoại hình, tuổi/vai, trang phục, góc nhìn, tư thế thật sự có; điểm chân/tay/đầu phù hợp bộ hình |
| Bối cảnh/nền | Địa điểm, sàn, vùng đặt đồ, vùng cấm, lớp che và phối cảnh |
| Mảnh cảnh/nội thất | Mặt đỡ, chỗ đứng/ngồi/nằm, trước/sau, hướng, sức chứa và điểm lắp |
| Đạo cụ | Loại, kích thước, điểm cầm/đeo/đặt, mặt đỡ tương thích và trạng thái được phép |
| Bố cục | Vai, spot ID có thật, tư thế cho từng vai, thành phần bắt buộc, quan hệ tiếp xúc và camera phù hợp |

Phải rà cả tài nguyên cũ, không chỉ tài nguyên mới. Hồ sơ chưa kiểm hình học hoặc có mô tả lệch hình cần được đánh dấu và loại khỏi phương án sản xuất liên quan cho đến khi sửa. Không xóa hàng loạt dữ liệu lịch sử.

Không coi danh mục nhiều tài nguyên là bằng chứng mọi tổ hợp đều hợp lệ. Không lấy hợp của các biến thể rồi suy ra mọi tổ hợp tư thế/chỗ tựa đều được hỗ trợ.

## 5. Khóa danh tính xuyên truyện

- Gán vai truyện với character ID cụ thể một lần; các cảnh sau dùng lại, không chọn lại ngoại hình từng khung.
- Gán địa điểm lặp lại với cấu trúc cảnh ổn định; thay góc hoặc trạng thái cửa/đèn không tự đổi phòng.
- Tách **asset**, **bản thể xuất hiện trong truyện** và **trạng thái**. Hai bát là hai bản thể; một bát nóng rồi nguội vẫn có thể là cùng một vật.
- Theo dõi chủ sở hữu, vật cầm/đặt/đeo và các lần chuyển giao. Tách hiện tại với hồi tưởng.
- Tiếp tục dùng snapshot theo dự án; cập nhật kho không đổi ngầm tài nguyên của lượt dựng đã lưu.

## 6. Tách đọc nội dung khỏi chọn hình

AI đọc lời kể để xác định sự thật cần minh họa: ai xuất hiện, ở đâu, tư thế gì, vật nào thuộc ai/đặt ở đâu và trạng thái nào thay đổi. Gắn nhận định với câu hoặc cụm nguồn; phân biệt điều được kể rõ với điều chưa chắc chắn.

Không suy diễn “nói chuyện” thành “ngồi ghế”; người đang nằm vẫn nằm khi nói nếu truyện không mô tả đổi tư thế. Không đưa mọi người/vật được nhắc tới lên hình nếu chúng chỉ thuộc lời dẫn, ký ức hoặc giải thích.

Chọn trạng thái minh họa tĩnh có ý nghĩa. Với hành động khó, xem xét hình trước–sau hoặc cận đồ vật thay vì yêu cầu mô phỏng từng chuyển động.

## 7. Tool tạo phương án khả thi, AI chọn bằng mã

Tool lọc theo gói và yêu cầu của cảnh, sau đó tạo một danh sách ngắn các phương án hoàn chỉnh. Có thể bắt đầu thử với 3–8 phương án khi đủ lựa chọn; đây là tham số cần đánh giá, không phải quota buộc phải tạo đủ.

Mỗi phương án phải xác định được:

- Asset ID và phiên bản cụ thể, gồm các mảnh nguồn nếu là cảnh ghép.
- Vai nào được gán vào spot ID nào; tư thế, hướng và trạng thái nào được phép.
- Đạo cụ nào dùng mặt đặt hoặc điểm cầm nào; sức chứa và vùng chiếm chỗ.
- Các ràng buộc phải đúng đồng thời trong chính phương án đó.
- Ảnh xem trước hoặc bảng ảnh gọn để hỗ trợ chọn khi khác biệt ngữ nghĩa khó phân biệt bằng tên.

AI trả về mã phương án và các lựa chọn trong danh sách cho phép. Không nhận tên tài nguyên mới, tọa độ tự do hoặc spot do AI tự đặt. Đầu ra ngoài danh sách phải bị từ chối và sửa trong giới hạn, không được âm thầm chuyển thành một lựa chọn gần giống.

Phải kiểm cả ngữ nghĩa lẫn hình học: đúng gói và ID nhưng chọn nhầm giếng thay mương hoặc nhầm loại khăn vẫn là lỗi.

## 8. Đặt hình bằng code và kiểm ảnh thực tế

Code tính tọa độ từ điểm neo và bố cục đã kiểm: chân bám sàn, người nằm bám mặt nằm, người ngồi bám ghế, vật bám bàn hoặc tay. Kiểm chỗ trùng, lớp trước/sau, hướng và sức chứa; giữ vị trí khi cắt cận rồi quay lại.

AI chọn ý nghĩa, phương án minh họa và góc nhìn trong giới hạn hợp lệ. Không để AI quyết định lại các tọa độ đã cố định.

Cấu hình **AI duyệt ảnh cảnh** tiếp tục được giữ. Khi bật, duyệt ảnh đã ghép với lời kể tương ứng; sửa bằng phương án hợp lệ khác hoặc lựa chọn được phép. Khi tắt vẫn phải kiểm ID, gói, tư thế, mặt đỡ, điểm đặt và lỗi engine. Review ảnh không thay thế việc sửa dữ liệu hình học sai.

## 9. Ví dụ bắt buộc giữ làm ca nghiệm thu

Lời kể: **“Nam đứng cạnh giường, bà nằm, bát cháo đặt trên bàn.”**

1. Khóa Nam, bà và bát cháo vào các ID/bản thể cụ thể.
2. Tìm một cảnh hoặc tổ hợp trong gói có đồng thời chỗ nằm trên giường, chỗ đứng cạnh giường và mặt bàn đặt bát.
3. Gán bà vào điểm nằm, Nam vào điểm đứng, bát vào mặt bàn. Không dùng một danh mục tổng hợp có các khả năng rời rạc làm bằng chứng đã đủ.
4. Khi bà nói, giữ tư thế nằm; không đổi thành đứng hoặc ngồi chỉ vì hành động là `talk`.
5. Nếu thiếu bàn trong phương án, tìm tổ hợp có mảnh bàn phù hợp hoặc chọn cách chia hình vẫn giữ đúng nội dung. Không tự đặt bát xuống đất hoặc vẽ bàn mới.

## 10. Xử lý thiếu khả năng trước các bước tốn thời gian

Ưu tiên lần lượt:

1. Bố cục có sẵn đáp ứng đủ yêu cầu.
2. Ghép nền và mảnh có sẵn trong cùng gói, kiểm đủ ràng buộc.
3. Minh họa đơn giản hơn: cận cảnh, insert, hai hình tĩnh hoặc trạng thái trước–sau nhưng giữ nguyên sự việc và vật chứng.

Nếu kho thật sự thiếu chi tiết thiết yếu, phải phát hiện ở lập cảnh/preflight trước voice/render. Không thay nhầm vật hoặc thay đổi cốt truyện để báo thành công. Với truyện do AI sáng tác, chỉ điều chỉnh kế hoạch trong phạm vi sáng tác đã được người dùng cho phép; với nguồn cố định, nêu rõ phần không đáp ứng trước khi chạy dài.

Kho hữu hạn không thể cam kết đáp ứng mọi hành động tưởng tượng. Mục tiêu là chọn đúng, chủ động tìm cách minh họa hợp lệ và phát hiện thiếu sớm.

## 11. Thứ tự chuẩn bị triển khai

- [x] Đối chiếu code và schema; tái sử dụng các cơ chế danh tính, trạng thái và snapshot đang có.
- [x] Rà dữ liệu/hình học kho cũ và đổi chỉ mục sang hồ sơ cảnh cụ thể, giữ nguồn và các ID. Đã xem ảnh nghiệm thu được ghi trong báo cáo; chưa duyệt thủ công toàn bộ ảnh kho.
- [x] Giữ hợp đồng vai–nhân vật, vật–bản thể–trạng thái và địa điểm; thêm hồ sơ lựa chọn kiểm lại khi compile/resume.
- [x] READ của hai gói phải trích dẫn lời kể nguồn, dùng địa điểm của truyện và giữ tư thế độc lập.
- [x] Tạo phương án từ tài nguyên cụ thể, kiểm tổ hợp người–mặt đỡ–đạo cụ và vùng che khuất gần đúng.
- [x] AI chọn mã phương án, không tự đặt tọa độ; retry có giới hạn, phương án dự phòng do code đã kiểm được ghi log rõ.
- [x] Nối vào layout, compile, snapshot, lưu từng nhóm đã nhận và công tắc duyệt ảnh.
- [x] Giữ minh họa tĩnh, sửa tìm tổ hợp ghép và chuyển kiểm hình/QA trước tạo âm thanh. Không cam kết kho hữu hạn đáp ứng mọi tình tiết.
- [x] Kiểm hồi quy và ảnh engine của cả hai gói; kết quả cụ thể ở báo cáo triển khai.
- [ ] Nghiệm thu một dự án với AI thật và duyệt thủ công toàn bộ video. Chưa được tính các phản hồi AI giả lập trong kiểm thử là nghiệm thu này.

Ưu tiên ba phần cốt lõi: **chỉ mục kho chính xác → danh sách phương án thật sự dựng được → code quyết định vị trí**. Không bắt đầu bằng kéo dài prompt hoặc tăng số lượng tài nguyên không có kiểm chứng.

## 12. Tiêu chí nghiệm thu

- Không chọn ngoài danh sách, sai gói hoặc tự tạo tài nguyên ở lần đầu, sửa lỗi và chạy tiếp.
- Không tạo tổ hợp ảo từ khả năng gộp của nhiều biến thể cảnh.
- Giữ đúng người, đồ vật và địa điểm qua nhiều cảnh; hai vật giống nhau vẫn có bản thể/điểm đặt độc lập.
- Người đứng/ngồi/nằm đúng chỗ; lời nói không tự đổi tư thế; cận cảnh không làm dàn lại vị trí.
- Kiểm đúng mặt đỡ, chủ sở hữu, chuyển giao, lớp che, trạng thái và hồi tưởng.
- Các ca thiếu đồ trang trí có phương án đơn giản phù hợp; thiếu vật chứng thiết yếu bị phát hiện trước âm thanh/render.
- Bật/tắt review ảnh không làm mất các kiểm dữ liệu bắt buộc; AI không trả kết quả duyệt không được coi là đạt.
- Kiểm bằng ảnh engine thật, đối chiếu với câu nguồn; phân biệt kiểm tự động, AI giả lập và nghiệm thu AI thật. Không tuyên bố đã kiểm hết 22 video khi chưa có bằng chứng đầy đủ.

## Tài liệu và điểm nối khi bắt đầu

- Hướng dẫn kho: [HUONG_DAN_KHO_2D_CO_DINH.md](../HUONG_DAN_KHO_2D_CO_DINH.md).
- [Kế hoạch minh họa tĩnh và sửa kho cũ](motion-illustrated-library-plan-2026-10-24.md).
- [Phạm vi kho đóng đã triển khai](motion-closed-pack-placement-implementation-2026-10-24.md).
- Chỉ mục khả năng: `src/server/services/puppet/packCatalog.ts`.
- Đọc/chọn cảnh: `director.ts`, `pipelinePuppet.ts` trong cùng thư mục.
- Khóa và snapshot: `packPolicy.ts`; đặt hình: `blocking.ts`, `layout.ts`, `compilePuppet.ts`.
- Trạng thái và ghép: `visualContract.ts`, `setComposer.ts`, `packFixtures.ts`.

Tài liệu này bổ sung hợp đồng chọn tài nguyên; không thay thế bằng chứng triển khai hoặc kết quả kiểm thử của các phần đã có.
