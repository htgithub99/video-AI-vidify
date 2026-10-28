# Tổ chức code sau refactor

## Phạm vi

Code do dự án quản lý được chuẩn hóa trên toàn repository: frontend, backend, Electron, admin dashboard, motion engine, script TypeScript/JavaScript, Python và PowerShell. Tài liệu, thư viện bên thứ ba, dữ liệu sinh tự động và các thư mục build không nằm trong phạm vi format source.

## Chức năng menu

| Chức năng | Thư mục |
| --- | --- |
| Dashboard | `src/features/dashboard` |
| Dự án | `src/features/projects` |
| Video tự động | `src/features/auto-video` |
| Phim điện ảnh | `src/features/cinematic` |
| Sáng tác nhạc | `src/features/music` |
| Trộn nhạc | `src/features/music-mixer` |
| Flow video | `src/features/flow` |
| Shorts | `src/features/shorts` |
| Xuất video | `src/features/video-export` |
| Video Motion | `src/features/motion` |
| Proxy | `src/features/proxy` |
| Cài đặt | `src/features/settings` |

`src/features/screens.ts` là điểm tải các màn bằng lazy import. `FeatureWorkspace` cung cấp loading và error boundary riêng cho mỗi màn. Dashboard, dự án, video tự động và phim điện ảnh giữ state sau lần mở đầu, tương ứng hành vi trước refactor.

Video tự động và phim điện ảnh dùng engine chung tại `src/features/video-generation`. Cinematic truyền phần cấu hình riêng vào engine qua contract `types/cinematicSetup.ts`.

Code của một feature không import implementation của feature khác; ngoại lệ là hai màn dùng engine `video-generation`. UI, hook và helper chung không import ngược implementation của menu. `npm run test:feature-boundaries` kiểm tra quy tắc này cùng đường dẫn import nội bộ.

Việc tách module giúp hạn chế ảnh hưởng giữa các màn. Các thay đổi ở API, model dữ liệu và thư viện chung vẫn cần kiểm tra những màn cùng sử dụng.

## Constants, helper và component dùng chung

- Text riêng từng chức năng: `src/features/<feature>/constants`, gồm `runtimeText.ts`.
- Text và cấu hình chung: `src/constants`, gồm `runtime/shared.ts`, `runtime/core.ts`, `runtime/ui.ts` và `runtime/server.ts`.
- Metadata HTML, URL font và cấu hình theme khởi động: `src/constants/document.ts`; Vite thay placeholder trước khi phục vụ HTML để theme vẫn được áp dụng ngay trong head.
- Admin: `admin_dashboard/constants.js`; bootstrap tách tại `initialize.js`, text và thuộc tính HTML được gắn tại `labels.js`.
- Python: `python_scripts/runtime_text.py`, `python_scripts/kit_seed/runtime_text.py`.
- PowerShell: `scripts/powershellTexts.ps1`.
- JSON: `src/lib/jsonStringify.ts` cung cấp `stringifyJson`, `parseJson`, `cloneJson`.
- Mở IndexedDB: `src/lib/indexedDatabase.ts`.
- Format dung lượng: `src/lib/mediaFormat.ts`.
- Phân trang: `src/components/ui/Pagination.tsx`, `src/lib/pagination.ts`.
- Chọn nhóm, xem ảnh, clipboard: `GroupedSelect`, `ImagePreviewModal`, `useClipboardFeedback` trong các thư mục chung.

Literal có vai trò cú pháp và hợp đồng dữ liệu như module specifier, tên thuộc tính, type literal, enum, selector cấu trúc và dữ liệu fixture vẫn giữ tại vị trí phù hợp. Callback Playwright chạy trong browser nhận constants qua payload; chúng không thể đọc biến import từ tiến trình Node.

## Format và kiểm tra

```sh
npm run format:code
python -m pip install -r requirements-dev.txt
npm run format:python
npm run check:refactor
```

Prettier và Black dùng chiều rộng 400. Formatter giảm dòng trống bên ngoài chuỗi, template và dữ liệu văn bản, đồng thời xóa comment bằng parser/tokenizer. Không ép chuỗi dài hoặc cấu trúc cần xuống dòng thành một dòng bằng cách làm thay đổi nội dung.

`check:refactor` gồm TypeScript, ESLint source, format TypeScript/JavaScript/CSS/HTML/Python, kiểm tra formatter/helper, ranh giới feature và kiểm thử workspace bằng trình duyệt. PowerShell được kiểm tra cú pháp bằng parser, không thực thi script cài đặt/đóng gói trong bước kiểm tra refactor.

## Dọn code và các giới hạn kiểm thử

Đã loại bỏ 19 file được xác nhận không dùng, gồm component/helper cũ, HTML tạm, scaffold applet và hai file Python bytecode từng được Git theo dõi. Các export công khai và script migration có mục đích riêng được giữ lại.

Một số script kiểm thử Motion cũ vẫn import module engine đã bị xóa từ trước; chúng chưa thể chạy trực tiếp. Không xóa các script migration/kiểm thử đó chỉ dựa trên kết quả unused import.

`npm run test:motion-cancellation` có assertion `logHistory` thất bại trên cả bản trước và sau refactor. Fixture phản hồi sai loại job và kỳ vọng journal chưa khớp dữ liệu status/stage/error hiện tại. Đây là giới hạn của kiểm thử hiện hữu; đợt refactor không thay đổi logic nghiệp vụ để bỏ qua assertion này.

Backup source trước refactor và báo cáo so sánh AST nằm trong `scratch/`, được Git ignore. Không dùng HEAD để khôi phục các file này vì working tree đã có thay đổi trước đợt refactor.
