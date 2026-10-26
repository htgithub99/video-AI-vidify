export const MOTION_ASSET_PREVIEW = {
  QUERY: "project",
  MIME: "image/svg+xml",
  SVG: /^\s*<svg\b/iu,
  LABEL: { vi: { character: "Nhân vật", prop: "Đồ vật", description: "Mô tả tài nguyên", loading: "Đang tải ảnh…", error: "Không tải được ảnh. Tài nguyên và tiến độ của dự án vẫn được giữ." }, en: { character: "Character", prop: "Prop", description: "Asset description", loading: "Loading image…", error: "Image unavailable. Project assets and progress are preserved." } },
  PLACEHOLDER: "flex min-h-24 items-center justify-center p-4 text-center text-xs text-slate-400",
  HIDDEN: "hidden",
  EXT: { SVG: ".svg", PNG: ".png" },
} as const;
