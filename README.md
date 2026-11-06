<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e6609220-0d26-4ad5-b2ef-f402187473db

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Công cụ và tài liệu

- `tools/ffmpeg/`: FFmpeg dùng cho xử lý và xuất video. Cài bằng `npm run setup:ffmpeg`.
- `scripts/setup/`: script cài Python/FFmpeg và `requirements-dev.txt`. Cài Python bằng `npm run setup:python`.
- `scripts/build/`: script đóng gói; chạy bằng `npm run electron:build` từ thư mục gốc.
- `docs/guides/`: [hướng dẫn kho 2D](docs/guides/HUONG_DAN_KHO_2D_CO_DINH.md) và [hướng dẫn tải trực tiếp](docs/guides/TAI-TRUC-TIEP-KHONG-LUU-HOSTING.md).
- `storage/`: dữ liệu cục bộ, video, profile và mã nhận diện thiết bị. Không xóa thư mục này khi dọn mã nguồn.
- `scratch/`: kết quả kiểm tra và thử nghiệm; đặt log tạm ở đây thay vì thư mục gốc.
