# Suno Downloader — tiến trình tải trực tiếp, không lưu hosting

Tài liệu này mô tả đúng luồng hiện tại giữa website `suno.vidiflow.site`, worker và dịch vụ tải `download.sunoupload.site`. Mục tiêu là hosting chỉ lưu **metadata task**, không lưu MP3/WAV/ảnh/lời.

## 1. Kiến trúc

```text
Khách tạo task
    ↓
Website lưu downloader_jobs trong MySQL
    ↓
Worker claim task và đọc metadata Suno
    ↓
Worker probe download.sunoupload.site/api/file/:clipId/:format
    ↓ thành công
Worker báo completed + deliveryMode=stream
    ↓
Website tạo link ảo /api/downloader/jobs/:jobId/stream/:type
    ↓ khách bấm tải
Website kiểm tra đăng nhập, quyền sở hữu và hạn tải
    ↓
Website proxy stream từ download.sunoupload.site thẳng tới trình duyệt
```

Không có bước ghi MP3/WAV xuống `sunoupload-app/storage/suno-downloader` trong nhánh thành công này.

## 2. Biến môi trường

```env
DOWNLOADER_STREAM_ORIGIN=https://download.sunoupload.site
DOWNLOADER_CONCURRENCY=6
```

`DOWNLOADER_CONCURRENCY` chỉ là trần. Worker vẫn tự giảm số luồng theo RAM và theo Upload/Music AI đang hoạt động.

## 3. Worker kiểm tra nguồn và hoàn thành task ở chế độ stream

Mã cốt lõi trong `remote-worker.js`:

```js
await downloaderProgress(job.id, 35, "Đang kiểm tra nguồn tải trực tiếp");

const streamOrigin = String(
  process.env.DOWNLOADER_STREAM_ORIGIN || "https://download.sunoupload.site"
).replace(/\/$/, "");

let streamAvailable = false;

try {
  const probe = await fetchWithTimeout(
    `${streamOrigin}/api/file/${encodeURIComponent(job.clipId)}/${encodeURIComponent(job.format)}`,
    { headers: { Accept: "*/*" } },
    10000
  );

  if (probe.ok) {
    streamAvailable = true;
    probe.body?.cancel?.().catch(() => {});
  }
} catch {}

if (streamAvailable) {
  await downloaderProgress(job.id, 94, "Đang hoàn tất yêu cầu");
  await reportDownloaderResult(job.id, {
    status: "completed",
    deliveryMode: "stream",
    format: job.format,
    title: metadata.title,
    artist: metadata.displayName
  });
  return;
}
```

Worker chỉ xác nhận nguồn có thể tải. Nó không upload bản sao lên hosting.

## 4. API nhận kết quả stream

Mã cốt lõi trong `sunoupload-cpanel/downloader-routes.js`:

```js
app.post("/api/worker/downloader/jobs/:id/report", async (req, res) => {
  let conn;
  try {
    if (!workerOk(req)) return apiError(res, 401, "Worker key không hợp lệ");

    await ready;
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      "SELECT id,format,status FROM downloader_jobs WHERE id=? FOR UPDATE",
      [req.params.id]
    );

    const job = rows[0];
    if (!job) throw Error("Không tìm thấy yêu cầu");

    if (job.status === "completed") {
      await conn.commit();
      return res.json({ ok: true, idempotent: true });
    }

    if (req.body.status === "completed") {
      const [files] = await conn.execute(
        "SELECT type FROM downloader_files WHERE job_id=?",
        [job.id]
      );

      const types = new Set(files.map(file => file.type));
      const format = ["wav", "stems"].includes(req.body.format)
        ? req.body.format
        : "mp3";

      if (!types.has(format) && req.body.deliveryMode !== "stream") {
        throw Error("Thiếu file âm thanh kết quả");
      }

      await conn.execute(
        `UPDATE downloader_jobs
         SET status='completed', progress=100,
             status_message='Đã hoàn tất, sẵn sàng tải xuống',
             error_message=NULL, title=?, artist=?,
             completed_at=UTC_TIMESTAMP(),
             download_expires_at=DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 HOUR),
             lease_until=NULL
         WHERE id=?`,
        [
          String(req.body.title || "").slice(0, 255),
          String(req.body.artist || "").slice(0, 255),
          job.id
        ]
      );
    }

    await conn.commit();
    res.json({ ok: true });
  } catch (error) {
    if (conn) await conn.rollback().catch(() => {});
    apiError(res, 400, error.message);
  } finally {
    if (conn) conn.release();
  }
});
```

Điểm quan trọng là `deliveryMode === "stream"` cho phép hoàn thành task mà không cần bản ghi trong `downloader_files`.

## 5. Website tạo file ảo cho giao diện

Khi task completed nhưng không có file vật lý, API lịch sử tạo link ảo:

```js
if (!dbFiles.length) {
  const virtualTypes = [
    row.format,
    row.includeCover ? "cover" : "",
    row.includeLyrics ? "lyrics" : ""
  ].filter(Boolean);

  for (const type of virtualTypes) {
    files.push({
      id: `stream-${type}`,
      jobId: row.id,
      type,
      name: `${cleanName(row.title || "Suno track")}.${
        type === "cover" ? "jpg" : type === "lyrics" ? "txt" : type
      }`,
      sizeBytes: null,
      downloadedAt: null,
      expiresAt,
      expired,
      download: expired
        ? null
        : `/api/downloader/jobs/${row.id}/stream/${type}`
    });
  }
}
```

## 6. Endpoint proxy trực tiếp tới khách

Đây là phần thực sự truyền file mà không lưu hosting:

```js
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");

const streamOrigin = () => String(
  process.env.DOWNLOADER_STREAM_ORIGIN || "https://download.sunoupload.site"
).replace(/\/$/, "");

app.get("/api/downloader/jobs/:jobId/stream/:type", async (req, res) => {
  try {
    const user = await mustAuth(req, res);
    if (!user) return;

    await downloadAvailabilityReady;

    const type = String(req.params.type || "").toLowerCase();
    if (!["mp3", "wav", "cover", "lyrics"].includes(type)) {
      return apiError(res, 400, "Loại file không hợp lệ");
    }

    const [rows] = await pool.execute(
      `SELECT clip_id AS clipId,title,format,
              include_cover AS includeCover,
              include_lyrics AS includeLyrics
       FROM downloader_jobs
       WHERE id=? AND user_id=? AND status='completed'
         AND COALESCE(
           download_expires_at,
           DATE_ADD(completed_at,INTERVAL 1 HOUR),
           DATE_ADD(created_at,INTERVAL 1 HOUR)
         ) > UTC_TIMESTAMP()
       LIMIT 1`,
      [req.params.jobId, user.id]
    );

    const job = rows[0];
    if (!job) {
      return apiError(res, 404, "File đã hết hạn tải. Lịch sử bài hát vẫn được giữ lại.");
    }

    if ((type === "mp3" || type === "wav") && type !== job.format) {
      return apiError(res, 400, "Định dạng tải không khớp yêu cầu");
    }
    if (type === "cover" && !job.includeCover) {
      return apiError(res, 404, "Yêu cầu không bao gồm ảnh bìa");
    }
    if (type === "lyrics" && !job.includeLyrics) {
      return apiError(res, 404, "Yêu cầu không bao gồm lời bài hát");
    }

    const upstream = await fetch(
      `${streamOrigin()}/api/file/${encodeURIComponent(job.clipId)}/${type}`,
      {
        headers: { Accept: "*/*" },
        signal: AbortSignal.timeout(type === "wav" ? 180000 : 120000)
      }
    );

    if (!upstream.ok || !upstream.body) {
      throw Object.assign(
        Error(`Dịch vụ tải trực tiếp chưa sẵn sàng (${upstream.status})`),
        { status: 502 }
      );
    }

    await pool.execute(
      `UPDATE downloader_jobs
       SET direct_downloaded_at=COALESCE(direct_downloaded_at,UTC_TIMESTAMP())
       WHERE id=?`,
      [req.params.jobId]
    );

    const ext = type === "cover" ? "jpg" : type === "lyrics" ? "txt" : type;
    const name = `${cleanName(job.title || "Suno track")}.${ext}`;

    res.set({
      "Cache-Control": "private, no-store",
      "Content-Type": upstream.headers.get("content-type") || ({
        mp3: "audio/mpeg",
        wav: "audio/wav",
        cover: "image/jpeg",
        lyrics: "text/plain; charset=utf-8"
      })[type],
      "Content-Disposition":
        `attachment; filename="suno-download.${ext}"; ` +
        `filename*=UTF-8''${encodeURIComponent(name)}`
    });

    const length = upstream.headers.get("content-length");
    if (length) res.set("Content-Length", length);

    await pipeline(Readable.fromWeb(upstream.body), res);
  } catch (error) {
    if (res.headersSent) return res.destroy(error);
    apiError(res, error.status || 502, error.message || "Chưa thể truyền file tải xuống");
  }
});
```

`pipeline(Readable.fromWeb(upstream.body), res)` truyền từng chunk từ dịch vụ Downloader đến trình duyệt. RAM không cần chứa toàn bộ file và ổ đĩa hosting không nhận bản sao.

## 7. Tải hàng loạt

Luồng hiện tại phải tạo ZIP tạm nên vẫn sử dụng ổ đĩa tạm trong thời gian ngắn:

```text
download.sunoupload.site → thư mục tạm suno-bulk-* → ZIP → khách → xóa thư mục tạm
```

Thư mục tạm được xóa khi response hoàn tất:

```js
res.once("finish", () =>
  setImmediate(() => fsp.rm(tempDir, { recursive: true, force: true }).catch(() => {}))
);
```

Muốn tuyệt đối không dùng ổ đĩa cho tải hàng loạt thì cần chuyển sang ZIP streaming (ví dụ `archiver`) và pipe từng upstream stream trực tiếp vào archive.

## 8. Get Stems

Get Stems hiện chưa phải nhánh không lưu hosting. Worker phải tạo nhiều stem, đóng ZIP rồi upload ZIP để khách tải. Đây là ngoại lệ vì kết quả được tạo riêng cho từng task và dịch vụ `download.sunoupload.site` không cung cấp ZIP stems có sẵn.

Chính sách an toàn:

- Xóa workspace local của worker sau 60 giây.
- Xóa ZIP trên hosting ngay sau một lượt tải hoàn chỉnh.
- Nếu khách tải dở bằng Range request, giữ file đến TTL một giờ.
- Cron dọn mọi kết quả hết hạn sau một giờ.

## 9. Fallback

Nếu probe `download.sunoupload.site` thất bại, worker hiện chuyển sang browser downloader rồi upload file lên hosting. Đây là nhánh tương thích để khách vẫn tải được.

Muốn bắt buộc 100% không lưu hosting, thay fallback bằng báo lỗi và hoàn credit:

```js
if (!streamAvailable) {
  throw Error("Dịch vụ tải trực tiếp chưa sẵn sàng");
}
```

Không gọi `runStandaloneDownloader()` và không gọi `uploadDownloaderFile()` cho MP3/WAV.

## 10. Kiểm tra triển khai

```bash
node --check remote-worker.js
node --check sunoupload-cpanel/downloader-routes.js
```

Kiểm tra thực tế:

1. Tạo một task MP3.
2. Task hoàn thành phải không có dòng tương ứng trong `downloader_files`.
3. API lịch sử phải trả `id: stream-mp3`.
4. Bấm tải phải gọi `/api/downloader/jobs/:jobId/stream/mp3`.
5. `storage/suno-downloader` không được tăng dung lượng.
6. `direct_downloaded_at` phải được ghi sau khi khách bắt đầu tải.

## 11. Các file nguồn liên quan

- `remote-worker.js`: claim task, probe nguồn tải, báo `deliveryMode=stream`.
- `sunoupload-cpanel/downloader-routes.js`: xác thực, lịch sử, link ảo, proxy stream và TTL.
- `sunoupload-cpanel/public/suno-downloader-v4.js`: giao diện danh sách và tải hàng loạt.
- `suno-downloader/server-public.js`: dịch vụ đứng sau `download.sunoupload.site`.

