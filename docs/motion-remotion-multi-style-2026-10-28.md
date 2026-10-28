# Remotion: đối ứng theo Kiểu hình

## Phạm vi

Đã cập nhật ba Kiểu hình hiện có: Truyện ma, Lịch sử và Giải thích. Các kiểu dùng chung pipeline thiết kế toàn cảnh, kiểm SVG, sửa nhóm, checkpoint và renderer. Mỗi kiểu có hướng dẫn riêng xuyên suốt phân cảnh, thiết kế không gian, vẽ, chuyển động và review. Nhánh Dùng kho không chuyển sang cơ chế này.

| Kiểu hình | Cách thể hiện |
| --- | --- |
| Truyện ma | Không gian tối nhưng đọc được chủ thể, màu áo đúng thoại, người và ma có hình dáng người, chuyển động nhẹ gắn nguồn; hình minh họa đơn giản là đủ. |
| Lịch sử | Nhân vật theo sự kiện và thời đại, phục trang/kiến trúc theo dữ kiện nguồn; có thể dùng cảnh kể chuyện, chi tiết hiện vật, bản đồ hoặc dòng thời gian. Không ép nhân vật cố định. |
| Giải thích | Chọn quy trình, so sánh, cơ chế/cắt lớp, sơ đồ hoặc ví dụ thực tế. Không bắt có người, căn phòng hay mặt sàn khi nội dung là khái niệm. |

## Thay đổi chính

- `motionIllustrationProfiles.ts` chứa hướng dẫn theo từng kiểu và từng bước. `motionIllustrationProfile.ts` cung cấp hướng dẫn và chọn tham chiếu theo kiểu/dạng trình bày.
- `motion_remotion_design` có thêm `format` tùy chọn: illustration, diagram, comparison, map, timeline, process, cutaway. AI chọn theo nội dung; thiếu trường này vẫn đọc được dữ liệu cũ. Không thêm lượt gọi AI chỉ để chọn dạng.
- Prompt chung đã bỏ ví dụ quan tài, ma, đèn dầu; các chi tiết đặc thù chuyển vào hướng dẫn truyện ma. Diễn giải hình học cho sơ đồ không bị đánh đồng với vị trí vật lý.
- Mỗi kiểu có SVG tham chiếu riêng. Bản đồ/dòng thời gian dùng tham chiếu sơ đồ thay vì căn phòng có người. Đây là ví dụ về kỹ thuật vẽ và quan hệ không gian; AI phải vẽ nội dung mới theo nguồn, không sao chép người, đồ vật, địa danh, sự kiện hoặc tọa độ của ví dụ.
- Luồng review nhận đúng phong cách, thiết kế đã chốt và nội dung cảnh. Chỉ yêu cầu sửa lỗi ảnh hưởng ý nghĩa: nhầm chủ thể, màu được nêu rõ, vị trí quan trọng, sai nhãn/chiều nguyên nhân, thiếu manh mối/bước quan trọng, chủ thể không đọc được hoặc cơ thể chính bị đứt rời nghiêm trọng. Khác động tác phụ, nếp áo, chi tiết trang trí không được trở thành điều kiện chặn.
- Sửa sau review và sửa dữ liệu đều giữ hướng dẫn của kiểu đang chọn. Có thể vá riêng nhóm sai, giữ hình đã đạt. Review ảnh vẫn theo công tắc người dùng.
- Chuyển động người, hiệu ứng cảnh, camera giữ các công tắc độc lập. Chỉ thoại trực tiếp mới có khẩu hình. Có thể chọn hình tĩnh cho động tác khó.
- Composition revision mới là 3; preview revision 1/2 vẫn đọc được. Phiên bản từng phong cách được đưa vào khóa kế hoạch, checkpoint và khóa dựng, tránh lấy nhầm cảnh đã lưu theo hướng dẫn cũ. Nâng phiên bản làm kế hoạch cũ cần dựng lại khi người dùng yêu cầu dựng; không tự khởi chạy dự án.

## Kiểm tra

- TypeScript: đạt.
- Bộ `test:motion-remotion`: đạt, đã tích hợp kiểm tra nhiều Kiểu hình.
- Bài cũ `verify-motion-style-prompts.ts` không chạy được vì còn import `motionGenService.ts` đã không có trong dự án. Bài này kiểm cơ chế dựng 2D/3D đời trước, không được tính là đạt; không thay thế nó bằng kết quả kiểm tra Remotion.
- Regression kiểm tra đủ các bước phân cảnh → thiết kế → vẽ → review/sửa của cả ba kiểu; sửa riêng trường lỗi; prompt sửa có giới hạn và không lặp SVG mẫu; giữ kiểu khi thử lại; cache; thay đổi phiên bản phong cách; sơ đồ không có người/floor vẫn hợp lệ.
- SVG tham chiếu đã qua normalize và được render bằng Chrome để xem trực tiếp. Gallery: `scratch/motion-multi-style-20261028/index.html`. Các ảnh này là tham chiếu kỹ thuật trong prompt, không phải kết quả AI tạo mới.
- Không tạo video sản xuất mới trong lượt cập nhật này. Kết quả kiểm tra kỹ thuật không chứng minh mọi video sau này sẽ đạt chất lượng mẫu. Độ đẹp, tính đúng của phục trang/địa lý và sự nhất quán qua nhiều cảnh vẫn cần đánh giá trên đầu ra AI thực tế.

## File chính

- `src/constants/motionIllustrationProfiles.ts`
- `src/constants/motionCompositionStyleExamples.ts`
- `src/constants/motionCompositionExamples.ts`
- `src/lib/motionIllustrationProfile.ts`
- `src/constants/motionSceneDesign.ts`
- `src/constants/motionSceneComposition.ts`
- `src/server/services/remotion/scenePipeline.ts`
- `src/server/services/remotion/sceneKeys.ts`
- `scripts/verify-motion-illustration-profiles.ts`
